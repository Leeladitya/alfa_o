#!/usr/bin/env node
/**
 * smoke-test.mjs: self-verification for alfa-mcp.mjs. Run: node mcp/smoke-test.mjs
 *
 * Evidence-ladder honest: every check below names the failure it catches, and
 * the test prints the artifacts (tool outputs, files written), not just PASS.
 * It builds a throwaway fixture pack in a temp dir, so it never touches your
 * real profile, memory, or logs. Exit code 0 only if every check passed.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, "alfa-mcp.mjs");
const FIXTURE = mkdtempSync(join(process.env.SMOKE_DIR ?? tmpdir(), "alfa-smoke-"));

// ---- fixture pack: a minimal alfa_o home with a SET profile and a seeded denylist ----
writeFileSync(
  join(FIXTURE, "PORTABLE_O.md"),
  `# PORTABLE_O.md (fixture)
=== PROFILE (alfa_o v2.0) ===
handle: testhandle
machine: personal
parallax_logs: local_only
claw_tier: private
workspace: none
=== END PROFILE ===
ENGINE MARKER: the fixture core file was loaded.
`
);
writeFileSync(join(FIXTURE, "MEMORY.md"), "# MEMORY.md (fixture)\nCOUNCIL MARKER: the fixture council file was loaded.\n");
writeFileSync(join(FIXTURE, "denylist.local.txt"), "Jane Realname\nAcme Employer Corp\n");

// ---- drive the server over stdio ----
const child = spawn(process.execPath, [SERVER], { env: { ...process.env, ALFA_HOME: FIXTURE }, stdio: ["pipe", "pipe", "inherit"] });
const pending = new Map();
let nextId = 1;
let buf = "";
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

function rpc(method, params) {
  const id = nextId++;
  return new Promise((resolvePromise, reject) => {
    pending.set(id, resolvePromise);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`TIMEOUT waiting for ${method} (catches: server hung or transport broken)`));
      }
    }, 5000);
  });
}
function notify(method) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method }) + "\n");
}
const toolText = (r) => r.result?.content?.[0]?.text ?? "";

let failures = 0;
function check(label, catches, ok, artifact) {
  const mark = ok ? "PASS" : "FAIL";
  if (!ok) failures++;
  console.log(`\n[${mark}] ${label}`);
  console.log(`       catches: ${catches}`);
  console.log("       artifact:\n" + String(artifact).split("\n").slice(0, 12).map((l) => "         | " + l).join("\n"));
}

const PUBLIC_LOG = `--- CLAW ---
consent: yes
tier: public
anonymized: yes
license: Collective Intelligence License, devudaaaa Labs
--- LOG ---
date: 2026-08-05
situation: a contested choice between two pipeline designs, anonymized.
options: rebuild in place; build clean beside and swap.
arguments: speed attacked auditability; auditability attacked speed.
resolution: build beside and swap survived, for stated auditability reasons.
confidence: high
outcome: pending
--- END ---`;

try {
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
  check("initialize handshake", "server does not speak MCP JSON-RPC at all", init.result?.serverInfo?.name === "alfa_o", JSON.stringify(init.result?.serverInfo));
  notify("notifications/initialized");

  const list = await rpc("tools/list", {});
  const names = (list.result?.tools ?? []).map((t) => t.name).sort();
  check("tools/list exposes the eight tools", "a tool silently missing from the surface", JSON.stringify(names) === JSON.stringify(["alfa_boot", "alfa_exec", "alfa_maturity", "bb_this", "claw_gate", "memory_recall", "memory_save", "parallax_log"]), names.join(", "));

  const boot = await rpc("tools/call", { name: "alfa_boot", arguments: {} });
  const bootText = toolText(boot);
  check("alfa_boot returns core + council + profile state", "boot returning a verdict instead of the actual files (print the artifact)", bootText.includes("ENGINE MARKER") && bootText.includes("COUNCIL MARKER"), bootText);

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  check("alfa_boot OPENS with this machine's real local date and the usage duty", "a session reasoning from a remembered date, or a UTC date that is already tomorrow in the evening", bootText.startsWith("CLOCK: ") && bootText.split("\n")[0].includes(today) && bootText.includes("USAGE DUTY"), bootText.split("\n").slice(0, 2).join("\n"));

  check("alfa_boot teaches the words the user can say, heartbeat first, and asks for bb this on security calls", "users never discovering heartbeat or bb this because nothing ever tells them they exist", bootText.includes("WORDS THE USER CAN SAY") && bootText.indexOf('"heartbeat"') < bootText.indexOf('"remember this"') && bootText.includes('"bb this"') && bootText.includes("security decision"), bootText.split("\n").filter((l) => l.startsWith("WORDS")).join("\n"));

  const savePII = await rpc("tools/call", { name: "memory_save", arguments: { name: "bad-entry", fact: "Met Jane Realname about the cluster", why: "x", apply: "x" } });
  check("memory_save DENIES a denylist hit and writes nothing", "the pseudonym law failing silently, PII landing on disk", toolText(savePII).startsWith("DENY") && !existsSync(join(FIXTURE, "memory", "bad-entry.md")), toolText(savePII));

  const saveOk = await rpc("tools/call", { name: "memory_save", arguments: { name: "vertica-grain-check", fact: "Assert row-count relationships across every join", why: "joins change grain silently", apply: "print counts before and after each stage" } });
  const entryOnDisk = existsSync(join(FIXTURE, "memory", "vertica-grain-check.md")) ? readFileSync(join(FIXTURE, "memory", "vertica-grain-check.md"), "utf8") : "(NOT WRITTEN)";
  const indexOnDisk = existsSync(join(FIXTURE, "MY_LIBRARY.md")) ? readFileSync(join(FIXTURE, "MY_LIBRARY.md"), "utf8") : "(NO INDEX)";
  check("memory_save writes the entry file AND the index line", "tool reports SAVED while the disk is empty (rung 4 is not evidence)", entryOnDisk.includes("grain") && indexOnDisk.includes("vertica-grain-check"), entryOnDisk + "\n---- index ----\n" + indexOnDisk);

  const recall = await rpc("tools/call", { name: "memory_recall", arguments: { name: "vertica-grain-check" } });
  check("memory_recall returns the saved entry", "save and recall disagreeing about names or paths", toolText(recall).includes("How to apply"), toolText(recall));
  check("every tool reply carries the clock, not only boot", "the date reaching the session once and then going stale for the rest of it", toolText(recall).includes("CLOCK: ") && toolText(savePII).includes("CLOCK: "), toolText(recall).split("\n").filter((l) => l.startsWith("CLOCK")).join("\n"));
  check("memory entries are stamped with the local date", "an evening entry stamped with tomorrow's UTC date", entryOnDisk.includes(`Saved ${today}.`), entryOnDisk.split("\n").filter((l) => l.startsWith("*Saved")).join("\n"));

  const gatePrivate = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: PUBLIC_LOG.replace("tier: public", "tier: private") } });
  check("claw_gate DENIES tier private", "the one absolute rule (only consent yes + tier public leaves) failing open", toolText(gatePrivate).startsWith("DENY"), toolText(gatePrivate));

  const gateNoHeader = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: "no header here at all" } });
  check("claw_gate DENIES a missing header (fail-closed)", "malformed input slipping through as an ALLOW", toolText(gateNoHeader).startsWith("DENY"), toolText(gateNoHeader));

  const gateAllow = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: PUBLIC_LOG } });
  check("claw_gate ALLOWS a clean public artifact, still demanding human confirmation", "the gate denying everything, which would train users to bypass it", toolText(gateAllow).startsWith("ALLOW") && toolText(gateAllow).includes("confirmation"), toolText(gateAllow));

  const logSave = await rpc("tools/call", { name: "parallax_log", arguments: { log: PUBLIC_LOG } });
  const logDir = join(FIXTURE, "parallax_logs");
  const logFiles = existsSync(logDir) ? readdirSync(logDir) : [];
  check("parallax_log writes the log file locally", "SAVED reported with no file on disk", toolText(logSave).startsWith("SAVED") && logFiles.length === 1, toolText(logSave) + "\n         files: " + logFiles.join(", "));

  // bb this: a security decision becomes a CLAW rule the gate enforces
  const bb = await rpc("tools/call", { name: "bb_this", arguments: { name: "no-cluster-names-out", decision: "Internal cluster names never leave this machine", why: "they map the network for an attacker", reopen_when: "the cluster is decommissioned", block: ["ORION-PROD-7"] } });
  const rulesPath = join(FIXTURE, "claw_rules.local.json");
  const rulesOnDisk = existsSync(rulesPath) ? readFileSync(rulesPath, "utf8") : "(NO RULES FILE)";
  const secEntry = existsSync(join(FIXTURE, "memory", "security-no-cluster-names-out.md")) ? readFileSync(join(FIXTURE, "memory", "security-no-cluster-names-out.md"), "utf8") : "(NOT WRITTEN)";
  check("bb_this writes the security memory AND the CLAW rule", "bb this reporting guarded while nothing reached the gate", toolText(bb).startsWith("Baahubali has it") && rulesOnDisk.includes("ORION-PROD-7") && secEntry.includes("DECISION: Internal cluster names"), rulesOnDisk + "\n---- memory ----\n" + secEntry);

  const gateBb = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: PUBLIC_LOG.replace("anonymized.", "anonymized, on ORION-PROD-7.") } });
  check("claw_gate DENIES a clean public artifact that breaks a bb rule, naming the rule but not the term", "a bb decision recorded in memory but never enforced at the gate, or the gate echoing the secret it guards", toolText(gateBb).startsWith("DENY") && toolText(gateBb).includes("no-cluster-names-out") && !toolText(gateBb).includes("ORION-PROD-7"), toolText(gateBb));

  const gateStillOk = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: PUBLIC_LOG } });
  check("claw_gate still ALLOWS a clean artifact that breaks no bb rule", "a bb rule that blocks everything, which trains users to bypass the gate", toolText(gateStillOk).startsWith("ALLOW"), toolText(gateStillOk));

  writeFileSync(rulesPath, "{ this is not json");
  const gateBroken = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: PUBLIC_LOG } });
  check("claw_gate DENIES when the bb rules file is unreadable (fail-closed)", "a corrupted rules file silently dropping every guard", toolText(gateBroken).startsWith("DENY") && toolText(gateBroken).includes("unreadable-rules-file"), toolText(gateBroken));
  rmSync(rulesPath);

  // workplace mode: flip the fixture profile and verify the gate slams shut
  writeFileSync(join(FIXTURE, "PORTABLE_O.md"), readFileSync(join(FIXTURE, "PORTABLE_O.md"), "utf8").replace("machine: personal", "machine: workplace"));
  const gateWork = await rpc("tools/call", { name: "claw_gate", arguments: { artifact: PUBLIC_LOG } });
  check("claw_gate DENIES everything under workplace mode, even a clean public artifact", "workplace mode being decorative rather than binding", toolText(gateWork).startsWith("DENY") && toolText(gateWork).includes("workplace"), toolText(gateWork));
} catch (e) {
  failures++;
  console.error("\n[FAIL] " + e.message);
} finally {
  child.kill();
  rmSync(FIXTURE, { recursive: true, force: true });
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} (fixture cleaned: ${FIXTURE})`);
process.exit(failures === 0 ? 0 : 1);
