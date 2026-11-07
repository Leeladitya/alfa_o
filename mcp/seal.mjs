#!/usr/bin/env node
/**
 * seal.mjs: the alfa seal. Every copy can tell whether it is official,
 * modified, or of unknown origin. Zero dependencies, Node 18+.
 *
 * How it works:
 *   - goldpack's ROOT key (offline) signs a short certificate for a RELEASE key.
 *   - The release key signs a manifest: version, edition, and the SHA-256 of
 *     every core file.
 *   - Every copy carries the root PUBLIC key (seal/root.pub). On boot it checks
 *     the certificate, then the manifest, then re-hashes its own core files.
 *
 * It never locks anyone out. A modified copy keeps working and simply knows
 * which files changed. Someone who modifies a copy can also remove this check,
 * so the seal is lineage honesty, not DRM.
 *
 * CLI (keys are read from files; passphrases from the ALFA_KEY_PASS variable,
 * never from arguments, so they stay out of shell history):
 *   node mcp/seal.mjs keygen <out-prefix>           new Ed25519 key pair (encrypted if ALFA_KEY_PASS is set)
 *   node mcp/seal.mjs certify <root.key> <release.pub> <key-id> <valid-until YYYY-MM-DD>
 *   node mcp/seal.mjs sign <release.key> <version> <edition>
 *   node mcp/seal.mjs verify
 */

import { createHash, generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The core: the files root is made of. Home (memory/, MY_LIBRARY.md, *.local.*,
// parallax_logs/, the user's own workspaces) is never part of the seal.
export const CORE_FILES = [
  "PORTABLE_O.md",
  "MEMORY.md",
  "CLAUDE.md",
  "LICENSE",
  "claw/policy.json",
  "mcp/alfa-mcp.mjs",
  "mcp/seal.mjs",
  "mcp/walls.mjs",
  "mcp/baahubali.mjs",
  "workspaces/TEMPLATE.md",
  "workspaces/data-consultant-vertica.md",
];

export const EDITIONS = ["master", "circle", "work", "public"];

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

// Canonical JSON: sorted keys, so the signed bytes never depend on key order.
export function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export function hashCore(root) {
  const files = {};
  for (const f of CORE_FILES) {
    const p = join(root, f);
    files[f] = existsSync(p) ? sha256(readFileSync(p)) : null;
  }
  return files;
}

function privateKey(pemPath) {
  const pem = readFileSync(pemPath, "utf8");
  return createPrivateKey(process.env.ALFA_KEY_PASS ? { key: pem, passphrase: process.env.ALFA_KEY_PASS } : pem);
}

const signText = (text, key) => sign(null, Buffer.from(text), key).toString("base64");
const verifyText = (text, sigB64, pubPem) => {
  try {
    return verify(null, Buffer.from(text), createPublicKey(pubPem), Buffer.from(sigB64, "base64"));
  } catch {
    return false;
  }
};

export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Check this copy. Returns { status: "official" | "modified" | "unknown",
 * edition, version, changed: [files], reason }.
 */
export function checkSeal(root) {
  const dir = join(root, "seal");
  const need = ["root.pub", "release-cert.json", "manifest.json", "manifest.sig"];
  const missing = need.filter((f) => !existsSync(join(dir, f)));
  if (missing.length > 0) {
    return { status: "unknown", edition: "public", version: null, changed: [], reason: "no seal on this copy (missing " + missing.join(", ") + ")" };
  }
  try {
    const rootPub = readFileSync(join(dir, "root.pub"), "utf8");
    const cert = JSON.parse(readFileSync(join(dir, "release-cert.json"), "utf8"));
    const { sig: certSig, ...certBody } = cert;
    if (!verifyText(canonical(certBody), certSig, rootPub)) {
      return { status: "unknown", edition: "public", version: null, changed: [], reason: "the release key certificate is not signed by the goldpack root key" };
    }
    if (certBody.validUntil && localDate() > certBody.validUntil) {
      return { status: "unknown", edition: "public", version: null, changed: [], reason: `the release key ${certBody.keyId} expired on ${certBody.validUntil}` };
    }
    const manifestText = readFileSync(join(dir, "manifest.json"), "utf8");
    const manifest = JSON.parse(manifestText);
    const sig = readFileSync(join(dir, "manifest.sig"), "utf8").trim();
    if (!verifyText(canonical(manifest), sig, certBody.publicKey)) {
      return { status: "unknown", edition: "public", version: null, changed: [], reason: "the manifest signature does not verify against the certified release key" };
    }
    if (manifest.keyId !== certBody.keyId) {
      return { status: "unknown", edition: "public", version: null, changed: [], reason: "the manifest names a different release key than the certificate" };
    }
    const now = hashCore(root);
    const changed = Object.keys(manifest.files).filter((f) => manifest.files[f] !== now[f]);
    const edition = EDITIONS.includes(manifest.edition) ? manifest.edition : "public";
    if (changed.length > 0) {
      return { status: "modified", edition, version: manifest.version, changed, reason: `${changed.length} core file(s) differ from official ${manifest.version}` };
    }
    return { status: "official", edition, version: manifest.version, changed: [], reason: `official ${manifest.version}, edition ${edition}, signed with release key ${manifest.keyId}` };
  } catch (e) {
    return { status: "unknown", edition: "public", version: null, changed: [], reason: "the seal files could not be read: " + (e?.message ?? e) };
  }
}

export function sealLine(root) {
  const s = checkSeal(root);
  if (s.status === "official") return `SEAL: official. ${s.reason}.`;
  if (s.status === "modified") return `SEAL: modified. ${s.reason}: ${s.changed.join(", ")}. It keeps working; it simply is not the official build.`;
  return `SEAL: lineage unknown. ${s.reason}. It keeps working; it cannot prove where it came from.`;
}

// ---------------- CLI ----------------

function cli() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = process.env.ALFA_HOME ? resolve(process.env.ALFA_HOME) : resolve(here, "..");
  const [cmd, ...args] = process.argv.slice(2);
  const sealDir = join(root, "seal");

  if (cmd === "keygen") {
    const prefix = args[0];
    if (!prefix) throw new Error("usage: keygen <out-prefix>");
    const enc = process.env.ALFA_KEY_PASS ? { cipher: "aes-256-cbc", passphrase: process.env.ALFA_KEY_PASS } : {};
    const { publicKey, privateKey: priv } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem", ...enc },
    });
    writeFileSync(prefix + ".key", priv, { mode: 0o600 });
    writeFileSync(prefix + ".pub", publicKey);
    console.log(`keys written: ${prefix}.key (private${enc.cipher ? ", encrypted" : ", NOT encrypted"}) and ${prefix}.pub`);
  } else if (cmd === "certify") {
    const [rootKey, releasePub, keyId, validUntil] = args;
    if (!rootKey || !releasePub || !keyId || !/^\d{4}-\d{2}-\d{2}$/.test(validUntil ?? "")) {
      throw new Error("usage: certify <root.key> <release.pub> <key-id> <valid-until YYYY-MM-DD>");
    }
    const body = { keyId, publicKey: readFileSync(releasePub, "utf8"), validUntil };
    mkdirSync(sealDir, { recursive: true });
    writeFileSync(join(sealDir, "release-cert.json"), JSON.stringify({ ...body, sig: signText(canonical(body), privateKey(rootKey)) }, null, 2) + "\n");
    console.log(`certificate written: seal/release-cert.json (key ${keyId}, valid until ${validUntil})`);
  } else if (cmd === "sign") {
    const [releaseKey, version, edition] = args;
    if (!releaseKey || !version || !EDITIONS.includes(edition)) throw new Error(`usage: sign <release.key> <version> <${EDITIONS.join("|")}>`);
    const cert = JSON.parse(readFileSync(join(sealDir, "release-cert.json"), "utf8"));
    const files = hashCore(root);
    const absent = Object.keys(files).filter((f) => files[f] === null);
    if (absent.length > 0) throw new Error("refusing to sign: core files missing: " + absent.join(", "));
    const manifest = { format: "alfa-seal/1", version, edition, issued: localDate(), keyId: cert.keyId, files };
    writeFileSync(join(sealDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    writeFileSync(join(sealDir, "manifest.sig"), signText(canonical(manifest), privateKey(releaseKey)) + "\n");
    console.log(`signed ${version} (${edition}): ${Object.keys(files).length} core files`);
  } else if (cmd === "verify" || cmd === undefined) {
    const s = checkSeal(root);
    console.log(sealLine(root));
    process.exit(s.status === "unknown" ? 2 : s.status === "modified" ? 1 : 0);
  } else {
    throw new Error("unknown command: " + cmd);
  }
}

const isMain = (() => {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (isMain) {
  try {
    cli();
  } catch (e) {
    console.error(String(e?.message ?? e));
    process.exit(64);
  }
}
