#!/usr/bin/env node
/**
 * v24-smoke-test.mjs: self-verification for v2.4, the work-mode protections.
 * Run: node mcp/v24-smoke-test.mjs
 *
 * The managed-machine signs are replaced by a fixture file (ALFA_SIGNALS_FILE),
 * so every case is tested on any machine. A throwaway pack in a temp folder;
 * never touches your real files. Every check names the failure it catches.
 */

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK = join(HERE, "..");
const FIX = mkdtempSync(join(tmpdir(), "alfa-v24-"));
const SIGNALS = join(FIX, "signals.test.json");
const BORN_WORK = ["alfa", "born"].join("-") + ": work";

for (const d of ["mcp", "claw", "tapes", "memory"]) mkdirSync(join(FIX, d), { recursive: true });
for (const f of ["alfa-mcp.mjs", "seal.mjs", "walls.mjs", "baahubali.mjs"]) copyFileSync(join(HERE, f), join(FIX, "mcp", f));
copyFileSync(join(PACK, "tapes", "tape.mjs"), join(FIX, "tapes", "tape.mjs"));
copyFileSync(join(PACK, "claw", "policy.json"), join(FIX, "claw", "policy.json"));
writeFileSync(join(FIX, "PORTABLE_O.md"), "# fixture\n=== PROFILE ===\nhandle: unset\n=== END PROFILE ===\n");
writeFileSync(join(FIX, "MEMORY.md"), "fixture\n");
const profile = (machine) => writeFileSync(join(FIX, "profile.local.md"), `=== PROFILE ===\nhandle: tester\nmachine: ${machine}\nparallax_logs: contribute\n=== END PROFILE ===\n`);
const signs = (strong, weak = []) => writeFileSync(SIGNALS, JSON.stringify({ strong, weak }));
profile("personal");
signs([]);

const ENV = { ...process.env, ALFA_HOME: FIX, ALFA_SIGNALS_FILE: SIGNALS };
let failures = 0;
function check(label, catches, ok, artifact) {
  if (!ok) failures++;
  console.log(`\n[${ok ? "PASS" : "FAIL"}] ${label}\n       catches: ${catches}\n       artifact:\n` + String(artifact).split("\n").slice(0, 9).map((l) => "         | " + l).join("\n"));
}

const child = spawn(process.execPath, [join(FIX, "mcp", "alfa-mcp.mjs")], { env: ENV, stdio: ["pipe", "pipe", "inherit"] });
const pending = new Map();
let nextId = 1;
let buf = "";
child.stdout.setEncoding("utf8");
child.stdout.on("data", (c) => {
  buf += c;
  let nl;
  while ((nl = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});
const rpc = (method, params) =>
  new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, res);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error("TIMEOUT on " + method))), 15000);
  });
const call = async (name, args = {}) => (await rpc("tools/call", { name, arguments: args })).result?.content?.[0]?.text ?? "";
const edition = (boot) => boot.split("\n").find((l) => l.startsWith("EDITION")) ?? "(no EDITION line)";
const PUBLIC = "--- CLAW ---\nconsent: yes\ntier: public\nanonymized: yes\n---\n";

try {
  await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "v24", version: "0" } });

  // 1. an honest personal machine
  let boot = await call("alfa_boot");
  check("a personal machine with no signs of management runs as personal", "the protection punishing honest users", !edition(boot).includes("work"), edition(boot));

  // 2. "personal" on a machine that looks managed is HELD as Work
  signs(["device management enrolment", "a company security agent is running"]);
  boot = await call("alfa_boot");
  const gateHeld = await call("claw_gate", { artifact: PUBLIC + "a clean public note" });
  const execHeld = await call("alfa_exec", { command: "curl https://example.com", human_approved: true });
  check('"personal" on a managed-looking machine is held as Work: gate and outbound commands closed', "a work laptop claimed as personal sending the employer's data out", edition(boot).includes("work (held)") && gateHeld.startsWith("DENY") && execHeld.includes("DENY") && execHeld.includes("looks managed"), [edition(boot), gateHeld.split("\n").slice(0, 3).join("\n"), execHeld.split("\n").slice(0, 2).join("\n")].join("\n"));

  // 3. the agent cannot confirm with a throwaway line
  const weak = await call("alfa_confirm_personal", { statement: "yes" });
  check("confirming needs the human's own words, not a one-word yes", "an agent clicking past the hold on its own", weak.startsWith("DENY"), weak.split("\n")[0]);

  // 4. a real confirmation is recorded and opens personal mode for these signs
  const said = "This is my own MacBook. I bought it myself; the agent is from a past job.";
  const ok = await call("alfa_confirm_personal", { statement: said });
  boot = await call("alfa_boot");
  const decision = existsSync(join(FIX, "memory", "security-machine-is-personal.md")) ? readFileSync(join(FIX, "memory", "security-machine-is-personal.md"), "utf8") : "(not written)";
  check("the human's confirmation is recorded as a security decision and alfa runs as personal", "the override happening silently, with nothing on record", ok.startsWith("Baahubali has it") && !edition(boot).includes("work") && decision.includes(said) && decision.includes("REOPEN-WHEN"), [edition(boot), ...decision.split("\n").slice(2, 4)].join("\n"));

  // 5. new signs mean it asks again
  signs(["device management enrolment", "a company security agent is running", "corporate directory join"]);
  boot = await call("alfa_boot");
  check("when the signs change, the confirmation no longer counts and alfa holds again", "one old confirmation covering a machine that has since been enrolled by an employer", edition(boot).includes("work (held)"), edition(boot));

  // 6. data remembers where it was born
  signs([]);
  profile("workplace");
  await call("alfa_boot");
  await call("memory_save", { name: "client-schema", fact: "The billing warehouse joins orders to invoices on the internal account key", why: "learned on the client engagement", apply: "check the account key before any join" });
  const born = readFileSync(join(FIX, "memory", "client-schema.md"), "utf8");
  check("a memory saved on a work machine is stamped as born in work mode", "work data carrying no record of where it came from", born.includes(BORN_WORK), born.split("\n").slice(-3).join("\n"));

  // 7. switching to personal is visible and cannot launder it
  profile("personal");
  boot = await call("alfa_boot");
  const modeLine = boot.split("\n").find((l) => l.startsWith("MODE CHANGED")) ?? "(no MODE CHANGED line)";
  const launder = await call("claw_gate", { artifact: PUBLIC + "Notes: The billing warehouse joins orders to invoices on the internal account key." });
  check("switching work to personal is announced with what stays locked, and a verbatim copy of work data is still DENIED", "flipping the switch to launder work data out", modeLine.includes("work to personal") && modeLine.includes("memory/client-schema.md") && launder.startsWith("DENY") && launder.includes("WORK DATA"), [modeLine, launder.split("\n").slice(0, 3).join("\n")].join("\n"));

  const fresh = await call("memory_save", { name: "home-lesson", fact: "On my own projects I keep backups on two drives in two different places", why: "one drive fails", apply: "copy to both weekly" });
  const freshText = readFileSync(join(FIX, "memory", "home-lesson.md"), "utf8");
  const freshGate = await call("claw_gate", { artifact: PUBLIC + "On my own projects I keep backups on two drives in two different places" });
  check("new personal data on the now-personal machine is stamped personal and may still leave", "the lock spreading to everything and making personal use impossible", !freshText.includes(BORN_WORK) && freshGate.startsWith("ALLOW"), freshGate.split("\n")[0]);

  // 8. the gatekeeper holds work data too
  spawnSync("git", ["init", "-q"], { cwd: FIX });
  spawnSync("git", ["config", "user.email", "t@t"], { cwd: FIX });
  spawnSync("git", ["config", "user.name", "t"], { cwd: FIX });
  spawnSync(process.execPath, [join(FIX, "mcp", "baahubali.mjs"), "install-guard"], { env: ENV });
  writeFileSync(join(FIX, "notes.md"), "Lesson: The billing warehouse joins orders to invoices on the internal account key\n");
  spawnSync("git", ["add", "notes.md"], { cwd: FIX });
  const commit = spawnSync("git", ["commit", "-q", "-m", "notes"], { cwd: FIX, encoding: "utf8", env: ENV });
  check("the git gatekeeper holds a commit that copies work data into a normal file", "work data leaving through a repository", commit.status !== 0 && (commit.stdout + commit.stderr).includes("WORK DATA"), commit.stdout + commit.stderr);
  spawnSync("git", ["reset", "-q", "notes.md"], { cwd: FIX });
  rmSync(join(FIX, "notes.md"));

  // 9. tapes: work data is left off a backup on a personal machine, and blocks a share tape
  const tape = (...a) => spawnSync(process.execPath, [join(FIX, "tapes", "tape.mjs"), ...a], { encoding: "utf8", env: ENV });
  const backup = tape("record", FIX, join(FIX, "b.alfatape"));
  const listing = existsSync(join(FIX, "b.alfatape")) ? JSON.parse(readFileSync(join(FIX, "b.alfatape"), "utf8")).listing.map((l) => l.path) : [];
  tape("keygen", join(FIX, "friend"));
  const share = tape("record", FIX, join(FIX, "s.alfatape"), "--kind", "share", "--to", join(FIX, "friend.pub"));
  check("a backup tape on a personal machine leaves work-born items off, and a share tape refuses them", "work data leaving on a tape after the switch", backup.status === 0 && backup.stdout.includes("left off the tape") && !listing.includes("memory/client-schema.md") && listing.includes("memory/home-lesson.md") && share.status !== 0 && share.stderr.includes("work machine"), [backup.stdout.split("\n")[0], "listing: " + listing.join(", "), share.stderr].join("\n"));

  // 10. older entries without a stamp get one at upgrade
  writeFileSync(join(FIX, "memory", "old-entry.md"), "# old-entry\n\nAn entry written before version 2.4 existed, with no stamp at all.\n");
  boot = await call("alfa_boot");
  const upgraded = readFileSync(join(FIX, "memory", "old-entry.md"), "utf8");
  check("an older entry with no birth stamp is stamped at the next boot, with the mode the machine runs in", "pre-2.4 entries staying unstamped forever, a gap to launder through", boot.includes("UPGRADE:") && /born: personal/.test(upgraded), boot.split("\n").find((l) => l.startsWith("UPGRADE")));
} catch (e) {
  failures++;
  console.error("\n[FAIL] " + e.message);
} finally {
  child.kill();
  rmSync(FIX, { recursive: true, force: true });
}
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} (fixture cleaned)`);
process.exit(failures === 0 ? 0 : 1);
