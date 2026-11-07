/**
 * walls.mjs: the walls Baahubali keeps, shared by alfa-mcp.mjs and
 * baahubali.mjs. Zero dependencies, Node 18+.
 *
 * Everything here reads local files only and never touches the network:
 * the denylist (pseudonym law), the bb rules written by "bb this", the
 * tripwire canaries, the profile, and the CLAW policy in claw/policy.json.
 */

import { readFileSync, existsSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { CORE_FILES } from "./seal.mjs";

const read = (root, f) => {
  const p = join(root, f);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};

export function parseProfile(root) {
  const src = read(root, "profile.local.md") ?? read(root, "PORTABLE_O.md") ?? "";
  const m = src.match(/=== PROFILE[^=]*===([\s\S]*?)=== END PROFILE ===/);
  const profile = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^([a-z_]+):\s*([^(]+)/);
      if (kv) profile[kv[1]] = kv[2].trim();
    }
  }
  return profile;
}

export const isWorkplace = (root) => (parseProfile(root).machine ?? "").startsWith("workplace");

export function loadDenylist(root) {
  const raw = read(root, "denylist.local.txt");
  if (!raw) return [];
  return raw.split("\n").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 1 && !t.startsWith("#"));
}

export function loadBbRules(root) {
  const raw = read(root, "claw_rules.local.json");
  if (!raw) return [];
  try {
    const rules = JSON.parse(raw);
    return Array.isArray(rules) ? rules : [];
  } catch {
    return [{ name: "unreadable-rules-file", block: [], broken: true }];
  }
}

export function loadCanaries(root) {
  const raw = read(root, "tripwire.local.json");
  if (!raw) return [];
  try {
    return (JSON.parse(raw).canaries ?? []).filter((c) => typeof c === "string" && c.length >= 12);
  } catch {
    return [];
  }
}

/** Every wall a piece of text could break, by name only (never echoing a secret). */
export function wallHits(root, text) {
  const lower = String(text).toLowerCase();
  const hits = [];
  if (loadDenylist(root).some((t) => lower.includes(t))) hits.push("the pseudonym law (a denylist term)");
  for (const r of loadBbRules(root)) {
    if (r.broken) hits.push("bb rules file is unreadable (fail-closed)");
    else if ((r.block ?? []).some((t) => lower.includes(String(t).toLowerCase()))) hits.push(`your bb rule ${r.name}`);
  }
  if (loadCanaries(root).some((c) => String(text).includes(c))) hits.push("a TRIPWIRE: text from a decoy file, which should never travel anywhere");
  return hits;
}

export function plantTripwire(root) {
  const canary = "ALFA-CANARY-" + randomBytes(9).toString("hex").toUpperCase();
  const store = join(root, "tripwire.local.json");
  const existing = loadCanaries(root);
  writeFileSync(store, JSON.stringify({ canaries: [...existing, canary] }, null, 2) + "\n", "utf8");
  writeFileSync(
    join(root, "decoy-credentials.local.md"),
    `# Service credentials (internal)\n\nThis file is a decoy planted by Baahubali. Nothing real is here.\nIf this text ever appears in a commit, a tape, or an outgoing message, something read it and tried to send it.\n\napi_token: ${canary}\n`,
    "utf8"
  );
  return canary;
}

let policyCache = null;
export function loadPolicy(root) {
  if (policyCache && policyCache.root === root) return policyCache.policy;
  const raw = read(root, "claw/policy.json");
  const policy = raw ? JSON.parse(raw) : null;
  policyCache = { root, policy };
  return policy;
}

const matchesAny = (cmd, patterns) => (patterns ?? []).some((p) => new RegExp(p, "i").test(cmd));

/**
 * Judge a shell command against CLAW. Returns { verdict: "allow" | "ask" | "deny",
 * categories: [...], reasons: [...] }. Fails closed: no policy means deny.
 */
export function evaluateCommand(root, cmd) {
  const policy = loadPolicy(root);
  if (!policy) return { verdict: "deny", categories: [], reasons: ["claw/policy.json is missing, so nothing runs (fail-closed)"] };
  const c = policy.categories;
  const categories = [];
  const reasons = [];
  const hits = wallHits(root, cmd);
  if (hits.length > 0) reasons.push(...hits.map((h) => "breaks " + h));
  if (matchesAny(cmd, c.outbound.patterns)) categories.push("outbound");
  if (matchesAny(cmd, c.destructive.patterns)) categories.push("destructive");
  if (matchesAny(cmd, c.install.patterns)) categories.push("install");
  const touchesCore = CORE_FILES.some((f) => cmd.includes(f) || cmd.includes(f.split("/").pop()));
  if (touchesCore && matchesAny(cmd, c.root.write_patterns)) {
    categories.push("root");
    reasons.push("changes the sealed core; only a signed release may do that");
  }
  if (categories.includes("outbound") && isWorkplace(root)) reasons.push("work machine: nothing leaves, ever");
  if (reasons.length > 0) return { verdict: "deny", categories, reasons };
  if (categories.length > 0) return { verdict: "ask", categories, reasons: [`${categories.join(" and ")}: needs your human's yes first`] };
  return { verdict: "allow", categories: ["local"], reasons: [] };
}

/** Audit by fingerprint only: never the command text, which may hold secrets. */
export function audit(root, entry) {
  const line = { at: new Date().toISOString(), ...entry };
  if (line.command) {
    line.fingerprint = createHash("sha256").update(line.command).digest("hex").slice(0, 16);
    delete line.command;
  }
  appendFileSync(join(root, "baahubali.local.jsonl"), JSON.stringify(line) + "\n", "utf8");
}
