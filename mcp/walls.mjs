/**
 * walls.mjs: the walls Baahubali keeps, shared by alfa-mcp.mjs and
 * baahubali.mjs. Zero dependencies, Node 18+.
 *
 * Everything here reads local files only and never touches the network:
 * the denylist (pseudonym law), the bb rules written by "bb this", the
 * tripwire canaries, the profile, and the CLAW policy in claw/policy.json.
 */

import { readFileSync, existsSync, writeFileSync, appendFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
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

const declaredWork = (root) => (parseProfile(root).machine ?? "").startsWith("workplace");

// ---------- is this machine managed by an employer? (local signals only, never sent anywhere) ----------

const AGENTS = /falcon|sentinel|cbagent|carbonblack|wdavdaemon|mdatp|jamf|kandji|intune|zscaler|netskope|tanium|cylance|tanium|qualys|forcepoint/i;
const PERSONAL_MAIL = /@(gmail|googlemail|outlook|hotmail|live|msn|icloud|me|mac|yahoo|proton|protonmail|pm|aol|gmx|zoho|fastmail|hey|yandex|mail)\.|@users\.noreply\.github\.com$/i;

function probe(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", timeout: 4000, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

let signalCache = null;

/**
 * Local signs that an employer manages this machine. Strong signs: device
 * management enrolment, a corporate directory join, a company security agent.
 * Weak sign: a work email in git. ALFA_SIGNALS_FILE (a JSON file) replaces the
 * probes, for tests only.
 */
export function managedSignals() {
  if (process.env.ALFA_SIGNALS_FILE) {
    try {
      const f = JSON.parse(readFileSync(process.env.ALFA_SIGNALS_FILE, "utf8"));
      return { strong: f.strong ?? [], weak: f.weak ?? [] };
    } catch {
      return { strong: [], weak: [] };
    }
  }
  if (signalCache && Date.now() - signalCache.at < 10 * 60 * 1000) return signalCache.value;
  const strong = [];
  const weak = [];
  if (process.platform === "darwin") {
    if (/MDM enrollment: Yes|Enrolled via DEP: Yes/i.test(probe("profiles", ["status", "-type", "enrollment"]))) strong.push("device management enrolment");
    if (/Active Directory Domain/i.test(probe("dsconfigad", ["-show"]))) strong.push("corporate directory join");
  } else if (process.platform === "win32") {
    const d = probe("dsregcmd", ["/status"]);
    if (/AzureAdJoined\s*:\s*YES|DomainJoined\s*:\s*YES/i.test(d)) strong.push("corporate directory join");
    if (/MdmUrl\s*:\s*\S+/i.test(d)) strong.push("device management enrolment");
  } else {
    if (probe("realm", ["list"]).trim()) strong.push("corporate directory join");
  }
  const procs = process.platform === "win32" ? probe("tasklist", []) : probe("ps", ["-axo", "comm"]);
  const agent = procs.split(/\r?\n/).find((l) => AGENTS.test(l));
  if (agent) strong.push("a company security agent is running");
  const mail = probe("git", ["config", "--global", "user.email"]).trim();
  if (mail.includes("@") && !PERSONAL_MAIL.test(mail)) weak.push("a work email address in git");
  const value = { strong, weak };
  signalCache = { at: Date.now(), value };
  return value;
}

const signalsFingerprint = (sig) => createHash("sha256").update([...sig.strong].sort().join("|")).digest("hex").slice(0, 16);

export function confirmation(root) {
  const raw = read(root, "machine_confirm.local.json");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function confirmPersonal(root, statement) {
  const sig = managedSignals();
  const record = { confirmedPersonal: true, signals: sig.strong, fingerprint: signalsFingerprint(sig), at: new Date().toISOString(), statement };
  writeFileSync(join(root, "machine_confirm.local.json"), JSON.stringify(record, null, 2) + "\n", "utf8");
  return record;
}

/**
 * The mode alfa actually runs in. "work" if the user said work. "held" if the
 * user said personal but the machine looks managed and that has not been
 * confirmed for these exact signals (held behaves exactly like work).
 * Otherwise "personal".
 */
export function effectiveMode(root) {
  if (declaredWork(root)) return { mode: "work", reason: "set to work at setup" };
  const sig = managedSignals();
  if (sig.strong.length === 0) return { mode: "personal", reason: sig.weak.length ? `personal (weak sign only: ${sig.weak.join(", ")})` : "personal" };
  const c = confirmation(root);
  if (c?.confirmedPersonal && c.fingerprint === signalsFingerprint(sig)) {
    return { mode: "personal", reason: `personal, confirmed by the user on ${c.at.slice(0, 10)} despite: ${sig.strong.join(", ")}` };
  }
  return { mode: "held", reason: `this machine looks managed (${sig.strong.join(", ")}) but setup said personal, so alfa runs as Work until the user confirms in their own words` };
}

export const isWorkplace = (root) => effectiveMode(root).mode !== "personal";

// ---------- birth-mode stamps: data remembers the mode it was born in ----------

// built from parts so the marker never appears literally in alfa's own source (the gatekeeper would hold it)
const BORN = ["alfa", "born"].join("-") + ": ";
export const BORN_WORK = BORN + "work";
export const BORN_PERSONAL = BORN + "personal";
export const bornStamp = (root) => (isWorkplace(root) ? BORN_WORK : BORN_PERSONAL);

const HOME_DIRS = ["memory", "parallax_logs", "workspaces"];

export function homeFiles(root) {
  const out = [];
  for (const d of HOME_DIRS) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith(".md") && statSync(join(dir, f)).isFile()) out.push(`${d}/${f}`);
  }
  if (existsSync(join(root, "MY_LIBRARY.md"))) out.push("MY_LIBRARY.md");
  return out.filter((f) => !CORE_FILES.includes(f));
}

/** Stamp every unstamped home file with the current mode. Returns the files stamped. */
export function stampLegacy(root) {
  const stamp = bornStamp(root);
  const done = [];
  for (const f of homeFiles(root)) {
    const p = join(root, f);
    const text = readFileSync(p, "utf8");
    if (text.includes(BORN_WORK) || text.includes(BORN_PERSONAL)) continue;
    writeFileSync(p, text.replace(/\s*$/, "") + `\n\n<!-- ${stamp} (stamped at upgrade) -->\n`, "utf8");
    done.push(f);
  }
  return done;
}

export function workBornFiles(root) {
  return homeFiles(root).filter((f) => readFileSync(join(root, f), "utf8").includes(BORN_WORK));
}

/** Lines of 30+ characters from work-born files: a verbatim copy of any of them is caught. */
function workBornLines(root) {
  const lines = new Set();
  for (const f of workBornFiles(root)) {
    for (const l of readFileSync(join(root, f), "utf8").split("\n")) {
      const t = l.replace(/^[#>*\-\s]+/, "").trim();
      if (t.length >= 30 && !t.includes(BORN)) lines.add(t);
    }
  }
  return [...lines];
}

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
  if (String(text).includes(BORN_WORK) || workBornLines(root).some((l) => String(text).includes(l))) hits.push("WORK DATA: something born on a work machine, which never leaves, whatever the machine is set to now");
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
  if (categories.includes("outbound") && isWorkplace(root)) reasons.push(effectiveMode(root).mode === "held" ? "this machine looks managed and has not been confirmed as personal, so it runs as Work: nothing leaves" : "work machine: nothing leaves, ever");
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
