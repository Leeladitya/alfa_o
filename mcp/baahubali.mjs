#!/usr/bin/env node
/**
 * baahubali.mjs: Baahubali, alfa's guard for every AI app. Zero dependencies.
 *
 * Seenu (a later release) stands at the door and stops an action as it
 * happens, in apps that support hooks. Baahubali cannot stand at the door,
 * so he makes the walls hold and catches every breach afterwards. His layers:
 *   1. lock      the sealed core is made read-only on disk
 *   2. walls     alfa's own tools enforce CLAW in code (alfa-mcp.mjs, walls.mjs)
 *   3. guard     a git pre-commit gatekeeper that works under every agent
 *   4. seal      the core is re-checked at every boot (seal.mjs)
 *   5. law       PORTABLE_O.md, now backed by the four above
 *   6. CLAW      the instruction layer: the policy in claw/policy.json, the
 *                pre-flight declaration, alfa_exec, and tripwires
 *
 * CLI:
 *   node mcp/baahubali.mjs status           what Baahubali is guarding right now
 *   node mcp/baahubali.mjs lock | unlock    core files read-only, or writable again
 *   node mcp/baahubali.mjs install-guard    add the pre-commit gatekeeper to this repo
 *   node mcp/baahubali.mjs precommit        the gatekeeper itself (git runs this)
 *   node mcp/baahubali.mjs tripwire         plant a decoy with a fresh canary
 *   node mcp/baahubali.mjs check "<cmd>"    how CLAW judges a shell command
 */

import { chmodSync, existsSync, readFileSync, writeFileSync, statSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CORE_FILES, checkSeal, sealLine } from "./seal.mjs";
import { wallHits, plantTripwire, evaluateCommand, loadBbRules, loadCanaries, loadDenylist, audit, effectiveMode, managedSignals, workBornFiles } from "./walls.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ALFA_HOME ? resolve(process.env.ALFA_HOME) : resolve(HERE, "..");

// Home and personal state: never committed, whatever an agent tries.
const PERSONAL = [/^memory\//, /^parallax_logs\//, /^MY_LIBRARY\.md$/, /\.local\./, /^profile\.local\.md$/, /^denylist/, /^claw_rules/, /^tripwire/, /^decoy-/];

const say = (msg) => console.log("Baahubali: " + msg);

function lock(readOnly) {
  const done = [];
  for (const f of CORE_FILES) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    chmodSync(p, readOnly ? 0o444 : 0o644);
    done.push(f);
  }
  say(readOnly ? `the core is locked read-only (${done.length} files). To change it, run unlock, and only for a signed release.` : `the core is writable again (${done.length} files). Lock it when the release is done.`);
}

function isLocked() {
  return CORE_FILES.filter((f) => existsSync(join(ROOT, f))).every((f) => (statSync(join(ROOT, f)).mode & 0o222) === 0);
}

function installGuard(force) {
  const gitDir = join(ROOT, ".git");
  if (!existsSync(gitDir)) {
    say("this folder is not a git repository, so there is nothing to guard at commit time.");
    process.exit(1);
  }
  const hookPath = join(gitDir, "hooks", "pre-commit");
  if (existsSync(hookPath) && !force && !readFileSync(hookPath, "utf8").includes("baahubali.mjs")) {
    say("a different pre-commit hook already exists here. Not touching it. Re-run with --force to replace it.");
    process.exit(1);
  }
  mkdirSync(join(gitDir, "hooks"), { recursive: true });
  writeFileSync(hookPath, `#!/bin/sh\n# Baahubali's gatekeeper (alfa_o). Works under every AI agent, because it belongs to git.\nexec node "${join(HERE, "baahubali.mjs")}" precommit\n`, { mode: 0o755 });
  say("the gatekeeper is installed. Every commit in this repository now passes my walls first.");
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function precommit() {
  const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n").filter(Boolean);
  const problems = [];
  for (const f of staged) {
    if (PERSONAL.some((re) => re.test(f))) {
      problems.push(`${f}: personal state never leaves this machine`);
      continue;
    }
    if (CORE_FILES.includes(f) && process.env.ALFA_RELEASE !== "1") {
      problems.push(`${f}: part of the sealed core; only a release (ALFA_RELEASE=1, then re-sign) may change it`);
    }
    let content = "";
    try {
      content = git(["show", ":" + f]);
    } catch {
      continue;
    }
    for (const hit of wallHits(ROOT, content)) problems.push(`${f}: breaks ${hit}`);
  }
  if (problems.length > 0) {
    say("holds this commit. Nothing was committed.\n  - " + problems.join("\n  - "));
    audit(ROOT, { layer: "guard", verdict: "deny", count: problems.length });
    process.exit(1);
  }
  audit(ROOT, { layer: "guard", verdict: "allow", files: staged.length });
}

function status() {
  const s = checkSeal(ROOT);
  const hook = join(ROOT, ".git", "hooks", "pre-commit");
  const guard = existsSync(hook) && readFileSync(hook, "utf8").includes("baahubali.mjs");
  console.log(
    [
      "Baahubali, status:",
      `  seal      ${sealLine(ROOT)}`,
      `  lock      ${isLocked() ? "core is read-only" : "core is writable (run: node mcp/baahubali.mjs lock)"}`,
      `  guard     ${guard ? "pre-commit gatekeeper installed" : "no gatekeeper (run: node mcp/baahubali.mjs install-guard)"}`,
      `  walls     ${loadDenylist(ROOT).length} denylist term(s), ${loadBbRules(ROOT).length} bb rule(s), ${loadCanaries(ROOT).length} tripwire(s)`,
      `  machine   ${(() => { const m = effectiveMode(ROOT); return `${m.mode}: ${m.reason}`; })()}`,
      `  signs     ${(() => { const g = managedSignals(); return g.strong.length || g.weak.length ? [...g.strong, ...g.weak.map((w) => w + " (weak)")].join(", ") : "no signs of employer management"; })()}`,
      `  work data ${workBornFiles(ROOT).length} item(s) born in work mode, locked to this machine`,
      `  edition   ${s.edition}${s.status === "official" ? "" : " (unverified)"}`,
    ].join("\n")
  );
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "lock") lock(true);
  else if (cmd === "unlock") lock(false);
  else if (cmd === "install-guard") installGuard(args.includes("--force"));
  else if (cmd === "precommit") precommit();
  else if (cmd === "tripwire") {
    plantTripwire(ROOT);
    say("a decoy is planted (decoy-credentials.local.md). If its token ever shows up in a commit, a tape or an outgoing message, I will hold it and say so.");
  } else if (cmd === "check") {
    const r = evaluateCommand(ROOT, args.join(" "));
    say(`${r.verdict.toUpperCase()} [${r.categories.join(", ")}]${r.reasons.length ? ": " + r.reasons.join("; ") : ""}`);
    process.exit(r.verdict === "allow" ? 0 : r.verdict === "ask" ? 3 : 1);
  } else status();
} catch (e) {
  say("could not finish: " + String(e?.message ?? e));
  process.exit(2);
}
