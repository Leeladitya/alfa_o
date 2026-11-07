#!/usr/bin/env node
/**
 * tape.mjs: alfa tapes v0.1 (the alfa_o tape recorder). Record an alfa's home onto a tape, and
 * play a tape into an alfa. Zero dependencies, Node 18+.
 *
 * A tape carries HOME only (memory, the library, logs, the user's own
 * workspaces, the profile). It never carries the core, so a tape cannot
 * change how anyone's alfa is governed.
 *
 *   node tape.mjs record <alfa-folder> <out.alfatape> [--kind backup|share] [--to <receiver.pub>]
 *   node tape.mjs play <tape.alfatape> <alfa-folder> [--yes] [--key <receiver.key>]
 *   node tape.mjs keygen <out-prefix>       a key pair for receiving share tapes
 *
 * Promises:
 *   - An empty tape never reports success: recording and playing both check
 *     the content (a content floor), not just that the file is valid.
 *   - A share tape is scrubbed: no profile, no denylist, no rules, no logs,
 *     and it refuses to record if any file breaks a wall. It is sealed so only
 *     the receiver's key can play it.
 *   - Playing shows the plan first and changes nothing without --yes. A file
 *     that already exists with different content is never overwritten: the
 *     tape's version lands beside it as <name>.from-tape.
 *   - A work machine records backup tapes only, and never plays a share tape in.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, generateKeyPairSync, createPublicKey, createPrivateKey, diffieHellman, hkdfSync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const FORMAT = "alfa-tape/1";
const FLOOR = { files: 1, bytes: 64 };
const BACKUP_HOME = [/^MY_LIBRARY\.md$/, /^memory\/.+\.md$/, /^parallax_logs\/.+\.md$/, /^workspaces\/(?!TEMPLATE\.md$|data-consultant-vertica\.md$).+\.md$/, /^profile\.local\.md$/, /^denylist\.local\.txt$/, /^claw_rules\.local\.json$/];
const SHARE_HOME = [/^MY_LIBRARY\.md$/, /^memory\/.+\.md$/, /^workspaces\/(?!TEMPLATE\.md$|data-consultant-vertica\.md$).+\.md$/];

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const die = (msg, code = 1) => {
  console.error("tape: " + msg);
  process.exit(code);
};

function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out.push(relative(base, p).split(sep).join("/"));
  }
  return out;
}

function readText(root, f) {
  const p = join(root, f);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function isWorkplace(root) {
  const prof = readText(root, "profile.local.md") ?? "";
  return /^machine:\s*workplace/m.test(prof);
}

function wallTerms(root) {
  const deny = (readText(root, "denylist.local.txt") ?? "").split("\n").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 1 && !t.startsWith("#"));
  let bb = [];
  try {
    bb = JSON.parse(readText(root, "claw_rules.local.json") ?? "[]").flatMap((r) => (r.block ?? []).map((t) => String(t).toLowerCase()));
  } catch {
    die("the bb rules file is unreadable, so nothing is recorded until it is fixed (fail-closed)");
  }
  let canaries = [];
  try {
    canaries = JSON.parse(readText(root, "tripwire.local.json") ?? "{}").canaries ?? [];
  } catch {}
  return { words: [...deny, ...bb], canaries };
}

// ---- sealing a share tape to one receiver: X25519, HKDF-SHA256, AES-256-GCM ----
function seal(plain, receiverPubPem) {
  const eph = generateKeyPairSync("x25519");
  const secret = diffieHellman({ privateKey: eph.privateKey, publicKey: createPublicKey(receiverPubPem) });
  const salt = randomBytes(16);
  const key = Buffer.from(hkdfSync("sha256", secret, salt, Buffer.from(FORMAT), 32));
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return { ephemeral: eph.publicKey.export({ type: "spki", format: "pem" }), salt: salt.toString("base64"), iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), body: body.toString("base64") };
}

function unseal(sealed, receiverKeyPem) {
  const secret = diffieHellman({ privateKey: createPrivateKey(receiverKeyPem), publicKey: createPublicKey(sealed.ephemeral) });
  const key = Buffer.from(hkdfSync("sha256", secret, Buffer.from(sealed.salt, "base64"), Buffer.from(FORMAT), 32));
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(sealed.iv, "base64"));
  d.setAuthTag(Buffer.from(sealed.tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(sealed.body, "base64")), d.final()]);
}

function record(root, out, kind, toPub) {
  if (!["backup", "share"].includes(kind)) die("kind must be backup or share");
  if (kind === "share" && isWorkplace(root)) die("this is a work machine: nothing leaves it, so share tapes are never recorded here. A backup tape is fine.");
  if (kind === "share" && !toPub) die("a share tape must be sealed to its receiver: add --to <receiver.pub>");
  const allow = kind === "share" ? SHARE_HOME : BACKUP_HOME;
  const files = walk(root).filter((f) => allow.some((re) => re.test(f)));
  const entries = files.map((f) => {
    const buf = readFileSync(join(root, f));
    return { path: f, sha256: sha256(buf), size: buf.length, data: buf.toString("base64") };
  });
  if (kind === "share") {
    const { words, canaries } = wallTerms(root);
    const bad = entries.filter((e) => {
      const t = Buffer.from(e.data, "base64").toString("utf8");
      return words.some((w) => t.toLowerCase().includes(w)) || canaries.some((c) => t.includes(c));
    });
    if (bad.length > 0) die(`share tape refused: ${bad.map((e) => e.path).join(", ")} break a wall (a denylist term, a bb rule, or a tripwire). Rewrite them, or record a backup tape for yourself instead.`);
  }
  const bytes = entries.reduce((n, e) => n + e.size, 0);
  // the floor counts knowledge (library, memory, logs, workspaces), never settings: a profile and a denylist alone are still an empty tape
  const knowledge = entries.filter((e) => !/\.local\./.test(e.path));
  const kBytes = knowledge.reduce((n, e) => n + e.size, 0);
  if (knowledge.length < FLOOR.files || kBytes < FLOOR.bytes) die(`refusing to record an empty tape: ${knowledge.length} knowledge file(s), ${kBytes} bytes (floor: ${FLOOR.files} file, ${FLOOR.bytes} bytes). An empty tape that says "done" is the backup failure all over again.`, 2);
  const listing = entries.map(({ path, sha256: h, size }) => ({ path, sha256: h, size }));
  const payload = Buffer.from(JSON.stringify(entries.map(({ path, data }) => ({ path, data }))));
  const tape = { format: FORMAT, kind, recorded: new Date().toISOString(), floor: { files: entries.length, bytes }, listing };
  if (kind === "share") tape.sealed = seal(payload, readFileSync(toPub, "utf8"));
  else tape.payload = payload.toString("base64");
  writeFileSync(out, JSON.stringify(tape, null, 2) + "\n");
  console.log(`tape recorded: ${out}\n  kind ${kind}, ${entries.length} file(s), ${bytes} bytes${kind === "share" ? ", sealed to the receiver" : ""}\n` + listing.map((l) => `  - ${l.path} (${l.size} bytes)`).join("\n"));
}

function play(tapePath, root, yes, keyPath) {
  const tape = JSON.parse(readFileSync(tapePath, "utf8"));
  if (tape.format !== FORMAT) die("not an alfa tape (format " + tape.format + ")");
  if (tape.kind === "share" && isWorkplace(root)) die("this is a work machine: share tapes from outside are never played in here.");
  let raw;
  if (tape.sealed) {
    if (!keyPath) die("this tape is sealed to its receiver: add --key <receiver.key>");
    try {
      raw = unseal(tape.sealed, readFileSync(keyPath, "utf8"));
    } catch {
      die("this tape will not open with that key. It was sealed for someone else, or it was changed on the way.");
    }
  } else raw = Buffer.from(tape.payload, "base64");
  const files = JSON.parse(raw.toString("utf8"));
  const allow = tape.kind === "share" ? SHARE_HOME : BACKUP_HOME;
  const problems = [];
  if (files.length !== tape.listing.length) problems.push(`the tape lists ${tape.listing.length} file(s) but carries ${files.length}`);
  let bytes = 0;
  const plan = [];
  for (const f of files) {
    const buf = Buffer.from(f.data, "base64");
    bytes += buf.length;
    const listed = tape.listing.find((l) => l.path === f.path);
    if (!listed || listed.sha256 !== sha256(buf)) problems.push(`${f.path}: fingerprint does not match the listing`);
    if (!allow.some((re) => re.test(f.path)) || f.path.includes("..")) problems.push(`${f.path}: not a home file, and a tape may never write outside home`);
    const target = join(root, f.path);
    const existing = existsSync(target) ? readFileSync(target) : null;
    plan.push({ path: f.path, buf, action: existing === null ? "new" : sha256(existing) === sha256(buf) ? "same" : "kept-both" });
  }
  if (bytes < FLOOR.bytes || files.length < FLOOR.files) problems.push(`the tape is under the content floor (${files.length} file(s), ${bytes} bytes)`);
  if (problems.length > 0) die("refusing to play this tape:\n  - " + problems.join("\n  - "), 2);
  const lines = plan.map((p) => `  ${p.action === "new" ? "new      " : p.action === "same" ? "same     " : "kept both"} ${p.path}${p.action === "kept-both" ? `  (yours stays; the tape's lands as ${p.path}.from-tape)` : ""}`);
  console.log(`tape: ${tape.kind}, recorded ${tape.recorded}, ${files.length} file(s), all fingerprints match.\nplan:\n${lines.join("\n")}`);
  if (!yes) {
    console.log("\nNothing was changed. Run again with --yes to play it.");
    return;
  }
  for (const p of plan) {
    if (p.action === "same") continue;
    const target = join(root, p.action === "kept-both" ? p.path + ".from-tape" : p.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, p.buf);
  }
  console.log(`\nplayed: ${plan.filter((p) => p.action === "new").length} new, ${plan.filter((p) => p.action === "kept-both").length} kept both, ${plan.filter((p) => p.action === "same").length} already the same.`);
}

const isMain = (() => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  const [cmd, a, b, ...rest] = process.argv.slice(2);
  const opt = (name) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  try {
    if (cmd === "record" && a && b) record(resolve(a), resolve(b), opt("--kind") ?? "backup", opt("--to"));
    else if (cmd === "play" && a && b) play(resolve(a), resolve(b), rest.includes("--yes"), opt("--key"));
    else if (cmd === "keygen" && a) {
      const k = generateKeyPairSync("x25519");
      writeFileSync(a + ".key", k.privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
      writeFileSync(a + ".pub", k.publicKey.export({ type: "spki", format: "pem" }));
      console.log(`receiver keys written: ${a}.key (keep it) and ${a}.pub (give it to whoever sends you tapes)`);
    } else die("usage: record <alfa-folder> <out.alfatape> [--kind backup|share] [--to receiver.pub] | play <tape> <alfa-folder> [--yes] [--key receiver.key] | keygen <prefix>", 64);
  } catch (e) {
    die(String(e?.message ?? e), 3);
  }
}
