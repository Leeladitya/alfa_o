#!/usr/bin/env node
/**
 * alfa-mcp.mjs: the alfa_o operating system as an MCP server.
 * alfa_o v2.1, 2026-11-07. Zero dependencies, Node 18+, stdio transport
 * (newline-delimited JSON-RPC 2.0, per the MCP stdio spec).
 *
 * Tools: alfa_boot, memory_save, memory_recall, claw_gate, parallax_log, bb_this,
 * alfa_exec, alfa_maturity.
 * Law in code: the pseudonym law (denylist), the CLAW gate (fail-closed),
 * and workplace mode (nothing leaves the machine, ever).
 * Since v2.1, alfa injects the clock: alfa_boot opens with the machine's real
 * date and time plus the usage duty, and every tool reply carries the time it
 * ran, so any client knows the date without hooks.
 * Since v2.2, "bb this" is CLAW: bb_this turns a security decision into a
 * local CLAW rule (claw_rules.local.json, gitignored), and claw_gate enforces
 * every such rule from then on. bb is Baahubali, alfa's guard.
 * Since v2.3: the seal (seal.mjs) is checked at every boot and names the
 * edition; Baahubali's walls (walls.mjs, baahubali.mjs) back alfa_exec, which
 * runs a shell command only after CLAW judges it; alfa_maturity measures this
 * alfa's maturity from evidence that must resolve, never from claims.
 *
 * Method: Council-Driven Convergence by LEED (leed.life).
 * Parallax and CLAW: devudaaaa Labs (devudaaaa.xyz). CLAW's policy model is
 * applied here as a pattern, with credit; this file imports no CLAW source.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { checkSeal, sealLine } from "./seal.mjs";
import { wallHits, evaluateCommand, audit } from "./walls.mjs";

const PACK_ROOT = process.env.ALFA_HOME
  ? resolve(process.env.ALFA_HOME)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SERVER_INFO = { name: "alfa_o", version: "2.3.0" };

// ---------- the clock and the usage duty (injected, no hooks needed) ----------

function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowLine() {
  const d = new Date();
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local time";
  return `CLOCK: ${day} ${localDate(d)} ${time} (${zone}), read from this machine when this tool ran. Use this date; never reason from a remembered one.`;
}

const USAGE_DUTY =
  "USAGE DUTY: read the plan or usage meters at session start, before starting any parallel work, and after each milestone. " +
  "At 70% on any meter, go lean (smaller steps, no fan-out); at 85%, wrap up and write the heartbeat. " +
  "If this client exposes no meter, ask the user once and say plainly that the meters could not be read.";

const WORDS_TIP =
  'WORDS THE USER CAN SAY: "heartbeat" (sync now: update MY_LIBRARY.md and memory, report what was saved), "remember this", "what do you know", "council", "how sure are you", "bring home", "bb this" (guard a security decision with the bb_this tool: it is saved to memory tagged security, and its block terms become a CLAW rule that claw_gate enforces from then on; then attack it from the warden seat). ' +
  'Whenever a security decision or strategy is taken, ask the user once for that decision: "That was a security call. Say \'bb this\' and I will guard it." ' +
  "At a natural pause, recommend ONE word the user has not used yet, in one short line, at most once per session; start with heartbeat. Never mid-task, never after the user declines tips.";

// ---------- pack access ----------

function readPackFile(name) {
  const p = join(PACK_ROOT, name);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function parseProfile() {
  // since v2.3 the user's answers live in profile.local.md (gitignored); the block in PORTABLE_O.md is the blank template
  const core = readPackFile("profile.local.md") ?? readPackFile("PORTABLE_O.md") ?? "";
  const m = core.match(/=== PROFILE[^=]*===([\s\S]*?)=== END PROFILE ===/);
  const profile = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^([a-z_]+):\s*([^(]+)/);
      if (kv) profile[kv[1]] = kv[2].trim();
    }
  }
  return profile;
}

function loadDenylist() {
  const raw = readPackFile("denylist.local.txt");
  if (!raw) return [];
  return raw
    .split("\n")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1 && !t.startsWith("#"));
}

function denylistHits(text) {
  const lower = text.toLowerCase();
  return loadDenylist().filter((term) => lower.includes(term));
}

function isWorkplace() {
  return (parseProfile().machine ?? "").startsWith("workplace");
}

function editionLine() {
  const s = checkSeal(PACK_ROOT);
  if (isWorkplace()) return "EDITION: work. Nothing leaves this machine, the Circle is never offered, and it is free for the person using it.";
  if (s.status === "official") return `EDITION: ${s.edition}.`;
  return `EDITION: public (the seal could not confirm ${s.status === "modified" ? "an unmodified build" : "a lineage"}).`;
}

const BAAHUBALI_DUTY =
  "BAAHUBALI (the guard): before any command that could send data out, delete, install, or touch the core, write one pre-flight line naming the command, its CLAW category (outbound, destructive, install, root, local) and the verdict; " +
  "route such commands through alfa_exec, which judges them in code; and ask the human before anything outbound or destructive. A missing pre-flight line is itself a breach.";

// ---------- bb rules: the user's own CLAW rules, written by bb_this ----------

function loadBbRules() {
  const raw = readPackFile("claw_rules.local.json");
  if (!raw) return [];
  try {
    const rules = JSON.parse(raw);
    return Array.isArray(rules) ? rules : [];
  } catch {
    // fail-closed: an unreadable rules file must not silently drop the guard
    return [{ name: "unreadable-rules-file", block: ["\u0000"], broken: true }];
  }
}

function bbRuleHits(text) {
  const lower = text.toLowerCase();
  return loadBbRules().filter((r) => r.broken || (r.block ?? []).some((t) => lower.includes(String(t).toLowerCase())));
}

// ---------- tools ----------

const TOOLS = [
  {
    name: "alfa_boot",
    description:
      "Load the alfa_o operating system: the machine's real date and time, the usage duty, PORTABLE_O.md, MEMORY.md, the active workspace, the profile, and the memory index. Call this first in every session.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "memory_save",
    description:
      "Save one fact per file into memory/ and update the MY_LIBRARY.md index. Refuses entries containing denylist terms (the pseudonym law). Fields: name (kebab-case), fact, why, apply.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "kebab-case entry name" },
        fact: { type: "string", description: "the fact itself" },
        why: { type: "string", description: "why it matters" },
        apply: { type: "string", description: "how to apply it" },
      },
      required: ["name", "fact", "why", "apply"],
      additionalProperties: false,
    },
  },
  {
    name: "memory_recall",
    description:
      "Recall memory: with no arguments returns the index (MY_LIBRARY.md); with a name returns that memory/ entry in full.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "entry name; omit for the index" } },
      additionalProperties: false,
    },
  },
  {
    name: "claw_gate",
    description:
      "The CLAW consent gate, fail-closed. Checks an outbound artifact: consent yes, tier public, anonymized yes, denylist clean, workplace mode off. Returns ALLOW or DENY with every reason. Nothing may leave the machine without an ALLOW plus the user's explicit confirmation.",
    inputSchema: {
      type: "object",
      properties: { artifact: { type: "string", description: "the full artifact text including its CLAW header" } },
      required: ["artifact"],
      additionalProperties: false,
    },
  },
  {
    name: "parallax_log",
    description:
      "Write a Parallax decision log (with its CLAW header) into parallax_logs/, always locally. Validates the header exists and anonymized is yes; checks the denylist. Local storage works at any tier; leaving the machine additionally requires claw_gate ALLOW plus user confirmation.",
    inputSchema: {
      type: "object",
      properties: { log: { type: "string", description: "the full log text including its CLAW header" } },
      required: ["log"],
      additionalProperties: false,
    },
  },
  {
    name: "bb_this",
    description:
      "bb this: guard a security decision (bb is Baahubali, alfa's guard). Saves the decision to memory tagged security and, when block terms are given, adds a CLAW rule that claw_gate enforces from then on: any outbound artifact containing a block term is DENIED. Rules live in claw_rules.local.json, which never leaves the machine.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "kebab-case name for the security decision" },
        decision: { type: "string", description: "what was decided" },
        why: { type: "string", description: "why it was chosen" },
        reopen_when: { type: "string", description: "the evidence that would legitimately reopen it" },
        block: {
          type: "array",
          items: { type: "string" },
          description: "words or phrases that must never leave this machine because of this decision (optional)",
        },
      },
      required: ["name", "decision", "why", "reopen_when"],
      additionalProperties: false,
    },
  },
  {
    name: "alfa_exec",
    description:
      "Run one shell command through Baahubali. CLAW judges it in code first: commands that break a wall (a denylist term, a bb rule, a tripwire, the sealed core, anything outbound on a work machine) are DENIED; outbound, destructive and install commands are HELD until the human has said yes, which you confirm by setting human_approved; plain local commands run. Use this for every command that could send data out, delete, install, or touch the core.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "the shell command" },
        human_approved: { type: "boolean", description: "true only if the human explicitly approved THIS command in this conversation" },
        cwd: { type: "string", description: "working directory (optional)" },
      },
      required: ["command"],
      additionalProperties: false,
    },
  },
  {
    name: "alfa_maturity",
    description:
      "Measure this alfa's maturity level (0 Seed, 1 Living, 2 Disciplined, 3 Circle-ready) from evidence that must resolve on disk: real memory entries with content, decisions in five parts, corrections, security calls, consented logs over weeks. Counts content, never claims. Reports every criterion with its address. Unlocks nothing; at level 3 it tells you to inform the master.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function text(s) {
  return { content: [{ type: "text", text: s + "\n\n" + nowLine() }] };
}
function errText(s) {
  return { content: [{ type: "text", text: s + "\n\n" + nowLine() }], isError: true };
}

function parseClawHeader(artifact) {
  const m = artifact.match(/--- CLAW ---([\s\S]*?)---/);
  if (!m) return null;
  const header = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([a-z_]+):\s*([^(]+)/);
    if (kv) header[kv[1]] = kv[2].trim();
  }
  return header;
}

function toolAlfaBoot() {
  const profile = parseProfile();
  const parts = [nowLine() + "\n" + sealLine(PACK_ROOT) + "\n" + editionLine() + "\n" + USAGE_DUTY + "\n" + WORDS_TIP + "\n" + BAAHUBALI_DUTY];
  const core = readPackFile("PORTABLE_O.md");
  const council = readPackFile("MEMORY.md");
  const index = readPackFile("MY_LIBRARY.md");
  parts.push(core ?? "MISSING: PORTABLE_O.md not found at " + PACK_ROOT);
  parts.push(council ?? "MISSING: MEMORY.md not found.");
  const ws = profile.workspace;
  if (ws && ws !== "unset" && ws !== "none") {
    const wsText = readPackFile(join("workspaces", basename(ws)));
    parts.push(wsText ?? `MISSING: workspace file workspaces/${basename(ws)} not found.`);
  }
  parts.push(index ?? "No MY_LIBRARY.md yet. Create it at the first heartbeat.");
  if (!profile.handle || profile.handle === "unset") {
    parts.push("PROFILE IS UNSET: run the first-run interview (PORTABLE_O.md section 1) before any task.");
  }
  if (loadDenylist().length === 0) {
    parts.push(
      "NOTE: denylist.local.txt is empty or missing. Seed it with the terms that must never be written to disk (real name, employer, clients), one per line. It is gitignored and never leaves this machine."
    );
  }
  return text(parts.join("\n\n============================================================\n\n"));
}

function toolMemorySave({ name, fact, why, apply }) {
  const safeName = (name ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!safeName) return errText("DENY: entry name is empty after sanitizing. Use kebab-case letters and digits.");
  const body = [fact, why, apply].join("\n");
  const hits = denylistHits(body + "\n" + safeName);
  if (hits.length > 0) {
    return errText(
      "DENY (pseudonym law): entry contains denylist terms and was NOT saved: " +
        hits.join(", ") +
        ". Rewrite with the handle or a neutral role instead."
    );
  }
  const dir = join(PACK_ROOT, "memory");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, safeName + ".md");
  const stamp = localDate();
  const entry = `# ${safeName}\n\n${fact}\n\n**Why:** ${why}\n\n**How to apply:** ${apply}\n\n*Saved ${stamp}.*\n`;
  writeFileSync(file, entry, "utf8");
  const indexPath = join(PACK_ROOT, "MY_LIBRARY.md");
  const indexLine = `- [${safeName}](memory/${safeName}.md): ${fact.slice(0, 100)}`;
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      `# MY_LIBRARY.md\n\n## DONE / DOING / HEADING\n\n## Decisions locked\n\n## Corrections (permanent law)\n\n## Memory index\n${indexLine}\n`,
      "utf8"
    );
  } else {
    const idx = readFileSync(indexPath, "utf8");
    if (idx.includes(`](memory/${safeName}.md)`)) {
      writeFileSync(indexPath, idx.replace(new RegExp(`- \\[${safeName}\\]\\(memory/${safeName}\\.md\\).*`), indexLine), "utf8");
    } else if (idx.includes("## Memory index")) {
      writeFileSync(indexPath, idx.replace("## Memory index", `## Memory index\n${indexLine}`), "utf8");
    } else {
      appendFileSync(indexPath, `\n## Memory index\n${indexLine}\n`);
    }
  }
  return text(`SAVED: memory/${safeName}.md and index line updated. The entry as written:\n\n${entry}`);
}

function toolMemoryRecall({ name } = {}) {
  if (!name) {
    const idx = readPackFile("MY_LIBRARY.md");
    return text(idx ?? "No MY_LIBRARY.md yet; memory is empty.");
  }
  const entry = readPackFile(join("memory", basename(name).replace(/\.md$/, "") + ".md"));
  if (!entry) {
    const dir = join(PACK_ROOT, "memory");
    const listing = existsSync(dir) ? readdirSync(dir).join(", ") : "(no memory folder yet)";
    return errText(`Not found: ${name}. Entries on disk: ${listing}`);
  }
  return text(entry);
}

function toolClawGate({ artifact }) {
  const reasons = [];
  const header = parseClawHeader(artifact ?? "");
  if (isWorkplace()) reasons.push("workplace mode is on: nothing leaves this machine, ever");
  if (!header) reasons.push("no CLAW header found (fail-closed: a missing or malformed header is a DENY)");
  else {
    if (header.consent !== "yes") reasons.push(`consent is "${header.consent ?? "absent"}", must be exactly "yes"`);
    if (header.tier !== "public") reasons.push(`tier is "${header.tier ?? "absent"}", only "public" may leave the machine`);
    if (header.anonymized !== "yes") reasons.push(`anonymized is "${header.anonymized ?? "absent"}", must be exactly "yes"`);
  }
  const hits = denylistHits(artifact ?? "");
  if (hits.length > 0) reasons.push("denylist terms present: " + hits.join(", "));
  const bbHits = bbRuleHits(artifact ?? "");
  if (bbHits.length > 0) reasons.push("Baahubali holds this: it breaks your bb rule(s) " + bbHits.map((r) => r.name).join(", "));
  for (const h of wallHits(PACK_ROOT, artifact ?? "").filter((x) => x.includes("TRIPWIRE"))) reasons.push("Baahubali holds this: it carries " + h);
  if (reasons.length > 0) {
    return text("DENY. This artifact may NOT leave the machine.\nReasons:\n- " + reasons.join("\n- "));
  }
  return text(
    "ALLOW. Header valid (consent: yes, tier: public, anonymized: yes), denylist clean, workplace mode off.\n" +
      "One human step remains and it is not optional: show the artifact to the user one final time and get their explicit confirmation before anything is submitted anywhere."
  );
}

function toolParallaxLog({ log }) {
  const header = parseClawHeader(log ?? "");
  if (!header) return errText("DENY: no CLAW header. Every Parallax log carries its passport (PORTABLE_O.md section 7).");
  if (header.anonymized !== "yes") return errText(`DENY: anonymized is "${header.anonymized ?? "absent"}", must be "yes".`);
  const hits = denylistHits(log);
  if (hits.length > 0) return errText("DENY (pseudonym law): log contains denylist terms and was NOT saved: " + hits.join(", "));
  const dir = join(PACK_ROOT, "parallax_logs");
  mkdirSync(dir, { recursive: true });
  const stamp = localDate();
  const n = readdirSync(dir).filter((f) => f.startsWith(stamp)).length + 1;
  const file = join(dir, `${stamp}-${String(n).padStart(2, "0")}.md`);
  writeFileSync(file, log, "utf8");
  return text(
    `SAVED locally: parallax_logs/${basename(file)} (tier: ${header.tier ?? "unset"}). ` +
      "Local storage is always allowed. Leaving the machine requires a claw_gate ALLOW plus the user's explicit confirmation."
  );
}

function toolBbThis({ name, decision, why, reopen_when, block = [] }) {
  const safeName = (name ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!safeName) return errText("DENY: the decision name is empty after sanitizing. Use kebab-case letters and digits.");
  const body = [decision, why, reopen_when].join("\n");
  const hits = denylistHits(body + "\n" + safeName);
  if (hits.length > 0) {
    return errText("DENY (pseudonym law): the decision text contains denylist terms and was NOT saved: " + hits.join(", ") + ". Rewrite it with the handle or a neutral role.");
  }
  const terms = (Array.isArray(block) ? block : []).map((t) => String(t).trim()).filter((t) => t.length > 1);
  const stamp = localDate();
  const dir = join(PACK_ROOT, "memory");
  mkdirSync(dir, { recursive: true });
  const entry =
    `# security-${safeName}\n\n[${stamp}] DECISION: ${decision}\nWHY: ${why}\nTRIGGER: guarded with "bb this".\nREOPEN-WHEN: ${reopen_when}\n\n` +
    `**CLAW rule:** ${terms.length > 0 ? `${terms.length} block term(s) kept in claw_rules.local.json; claw_gate denies any outbound artifact containing them.` : "none (no block terms given); the decision is guarded as memory only."}\n\n*Guarded ${stamp}.*\n`;
  writeFileSync(join(dir, `security-${safeName}.md`), entry, "utf8");
  if (terms.length > 0) {
    const rules = loadBbRules().filter((r) => !r.broken && r.name !== safeName);
    rules.push({ name: safeName, block: terms, since: stamp });
    writeFileSync(join(PACK_ROOT, "claw_rules.local.json"), JSON.stringify(rules, null, 2) + "\n", "utf8");
  }
  const indexPath = join(PACK_ROOT, "MY_LIBRARY.md");
  const indexLine = `- [security-${safeName}](memory/security-${safeName}.md): SECURITY ${decision.slice(0, 90)}`;
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, `# MY_LIBRARY.md\n\n## Memory index\n${indexLine}\n`, "utf8");
  } else {
    const idx = readFileSync(indexPath, "utf8");
    if (!idx.includes(`](memory/security-${safeName}.md)`)) {
      writeFileSync(indexPath, idx.includes("## Memory index") ? idx.replace("## Memory index", `## Memory index\n${indexLine}`) : idx + `\n## Memory index\n${indexLine}\n`, "utf8");
    }
  }
  return text(
    `Baahubali has it. Guarded: memory/security-${safeName}.md` +
      (terms.length > 0 ? `, and a CLAW rule with ${terms.length} block term(s). claw_gate now denies any outbound artifact that contains them.` : ". No block terms were given, so no CLAW rule was added.") +
      `\n\nNow attack it from the warden's seat before moving on: what could leak, who could abuse it, what fails open?\n\n${entry}`
  );
}

function toolAlfaExec({ command, human_approved = false, cwd }) {
  const cmd = String(command ?? "").trim();
  if (!cmd) return errText("DENY: empty command.");
  const r = evaluateCommand(PACK_ROOT, cmd);
  const label = `[${r.categories.join(", ")}]`;
  if (r.verdict === "deny") {
    audit(PACK_ROOT, { layer: "alfa_exec", verdict: "deny", categories: r.categories, command: cmd });
    return errText(`Baahubali: DENY ${label}. Not run.\n- ${r.reasons.join("\n- ")}`);
  }
  if (r.verdict === "ask" && human_approved !== true) {
    audit(PACK_ROOT, { layer: "alfa_exec", verdict: "held", categories: r.categories, command: cmd });
    return errText(`Baahubali: HELD ${label}. Not run. ${r.reasons.join("; ")}. Show the human the exact command, get an explicit yes, then call again with human_approved: true.`);
  }
  audit(PACK_ROOT, { layer: "alfa_exec", verdict: r.verdict === "ask" ? "approved" : "allow", categories: r.categories, command: cmd });
  let out;
  let code = 0;
  try {
    out = execFileSync("/bin/sh", ["-c", cmd], { cwd: cwd ? resolve(cwd) : process.cwd(), encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    code = e.status ?? 1;
    out = String(e.stdout ?? "") + String(e.stderr ?? "");
  }
  const trimmed = out.length > 8000 ? out.slice(0, 8000) + `\n[... ${out.length - 8000} more characters cut]` : out;
  return text(`Baahubali: ran ${label}, exit ${code}.\n${trimmed}`);
}

// ---------- maturity: content, never counts of claims ----------

function memoryEntries() {
  const dir = join(PACK_ROOT, "memory");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => ({ file: "memory/" + f, text: readFileSync(join(dir, f), "utf8") }));
}

function fivePartDecisions(textBlob) {
  const out = [];
  const re = /DECISION:([^\n]*)\n\s*WHY:([^\n]*)\n\s*TRIGGER:([^\n]*)\n\s*REOPEN-WHEN:([^\n]*)/g;
  let m;
  while ((m = re.exec(textBlob))) if ([m[1], m[2], m[3], m[4]].every((x) => x.trim().length >= 10)) out.push(m[1].trim());
  return out;
}

function toolAlfaMaturity() {
  const rows = [];
  const add = (level, label, ok, address) => rows.push({ level, label, ok, address });
  const profile = parseProfile();
  const seal = checkSeal(PACK_ROOT);
  const work = isWorkplace();

  add(0, "profile set (the setup interview ran)", !!profile.handle && profile.handle !== "unset", existsSync(join(PACK_ROOT, "profile.local.md")) ? "profile.local.md" : "PORTABLE_O.md profile block");
  add(0, "known lineage (seal official or modified)", seal.status !== "unknown", "seal/: " + seal.status);

  const entries = memoryEntries();
  const real = entries.filter((e) => {
    const fact = e.text.split("\n").slice(2).join(" ").split("**Why:**")[0].trim();
    const why = (e.text.match(/\*\*Why:\*\*([^\n]*)/) ?? [])[1] ?? "";
    const how = (e.text.match(/\*\*How to apply:\*\*([^\n]*)/) ?? [])[1] ?? "";
    const isSecurity = e.file.startsWith("memory/security-") && /DECISION:.{10,}/.test(e.text);
    return isSecurity || (fact.length >= 40 && why.trim().length >= 10 && how.trim().length >= 10);
  });
  const days = new Set(real.map((e) => (e.text.match(/(?:Saved|Guarded) (\d{4}-\d{2}-\d{2})/) ?? [])[1]).filter(Boolean));
  const index = readPackFile("MY_LIBRARY.md") ?? "";
  const linked = [...index.matchAll(/\]\((memory\/[^)]+)\)/g)].map((m) => m[1]);
  const dangling = linked.filter((f) => !existsSync(join(PACK_ROOT, f)));
  add(1, "at least 5 memory entries with real content (fact 40+ chars, why and how 10+ each)", real.length >= 5, `memory/: ${real.length} real of ${entries.length}`);
  add(1, "saved on at least 3 different days (a one-day burst does not count)", days.size >= 3, `distinct days: ${[...days].sort().join(", ") || "none"}`);
  add(1, "every index line points to a file that exists", index.length > 0 && dangling.length === 0, index ? (dangling.length ? "MY_LIBRARY.md dangling: " + dangling.join(", ") : "MY_LIBRARY.md: all links resolve") : "no MY_LIBRARY.md");

  const decisions = fivePartDecisions(index + "\n" + entries.map((e) => e.text).join("\n"));
  const corrections = (index.split("## Corrections")[1] ?? "").split("\n## ")[0].split("\n").filter((l) => /^-\s+\S.{10,}/.test(l));
  const security = entries.filter((e) => e.file.startsWith("memory/security-"));
  add(2, "at least 3 decisions written in all five parts", decisions.length >= 3, `found ${decisions.length} in MY_LIBRARY.md and memory/`);
  add(2, "at least 1 correction recorded as permanent law", corrections.length >= 1, `MY_LIBRARY.md Corrections: ${corrections.length}`);
  add(2, 'at least 1 security call guarded with "bb this"', security.length >= 1, `memory/security-*: ${security.length}`);

  const logsDir = join(PACK_ROOT, "parallax_logs");
  const logs = existsSync(logsDir) ? readdirSync(logsDir).filter((f) => /^\d{4}-\d{2}-\d{2}/.test(f)) : [];
  const goodLogs = logs.filter((f) => {
    const h = parseClawHeader(readFileSync(join(logsDir, f), "utf8"));
    return h && h.consent === "yes" && h.anonymized === "yes";
  });
  const span = goodLogs.length ? (Date.parse(goodLogs.sort().at(-1).slice(0, 10)) - Date.parse(goodLogs.sort()[0].slice(0, 10))) / 86400000 : 0;
  add(3, "not a work machine (the Circle is never offered at work)", !work, `profile machine: ${profile.machine ?? "unset"}`);
  add(3, "at least 3 consented, anonymized Parallax logs", goodLogs.length >= 3, `parallax_logs/: ${goodLogs.length} consented of ${logs.length}`);
  add(3, "steady over at least 3 weeks", span >= 21, `first to last consented log: ${Math.round(span)} days`);
  add(3, "the user chose to contribute", profile.parallax_logs === "contribute", `profile parallax_logs: ${profile.parallax_logs ?? "unset"}`);

  let level = -1;
  for (const l of [0, 1, 2, 3]) {
    if (rows.filter((r) => r.level === l).every((r) => r.ok)) level = l;
    else break;
  }
  const names = ["Seed", "Living", "Disciplined", "Circle-ready"];
  const lines = rows.map((r) => `  L${r.level} ${r.ok ? "PASS" : "....."} ${r.label}\n         address: ${r.address}`);
  let verdict = level < 0 ? "Level: not yet Seed. Finish setup first." : `Level ${level}: ${names[level]}.`;
  if (level === 3) verdict += " Tell your master: this alfa is ready to be invited to the Circle. Joining needs an invitation signed by goldpack; nothing unlocks on its own.";
  if (work) verdict += " This is a work machine: levels 0 to 2 are for you, and the Circle is never offered here.";
  return text(`MATURITY (measured from content on disk, not from claims)\n${verdict}\n\n${lines.join("\n")}`);
}

const TOOL_IMPL = {
  alfa_boot: toolAlfaBoot,
  memory_save: toolMemorySave,
  memory_recall: toolMemoryRecall,
  claw_gate: toolClawGate,
  parallax_log: toolParallaxLog,
  bb_this: toolBbThis,
  alfa_exec: toolAlfaExec,
  alfa_maturity: toolAlfaMaturity,
};

// ---------- JSON-RPC over stdio ----------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function handle(msg) {
  const { id, method, params } = msg;
  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion ?? "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
          instructions:
            "alfa_o: call alfa_boot first in every session; it loads the operating system, profile, workspace, and memory index, and opens with the machine's real date and time plus the usage duty. Every tool reply carries the time it ran. Save durable facts with memory_save; pass every outbound artifact through claw_gate.",
        },
      });
    } else if (method === "notifications/initialized" || method === "notifications/cancelled") {
      // notifications carry no response
    } else if (method === "ping") {
      send({ jsonrpc: "2.0", id, result: {} });
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const impl = TOOL_IMPL[params?.name];
      if (!impl) {
        send({ jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } });
        return;
      }
      send({ jsonrpc: "2.0", id, result: impl(params?.arguments ?? {}) });
    } else if (id !== undefined) {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (e) {
    if (id !== undefined) send({ jsonrpc: "2.0", id, error: { code: -32603, message: String(e?.message ?? e) } });
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch {
      // a malformed line is ignored; the transport stays up
    }
  }
});
process.stdin.on("end", () => process.exit(0));
