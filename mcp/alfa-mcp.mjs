#!/usr/bin/env node
/**
 * alfa-mcp.mjs: the alfa_o operating system as an MCP server.
 * alfa_o v2.0, 2026-08-05. Zero dependencies, Node 18+, stdio transport
 * (newline-delimited JSON-RPC 2.0, per the MCP stdio spec).
 *
 * Tools: alfa_boot, memory_save, memory_recall, claw_gate, parallax_log.
 * Law in code: the pseudonym law (denylist), the CLAW gate (fail-closed),
 * and workplace mode (nothing leaves the machine, ever).
 *
 * Method: Council-Driven Convergence by LEED (leed.life).
 * Parallax and CLAW: devudaaaa Labs (devudaaaa.xyz). CLAW's policy model is
 * applied here as a pattern, with credit; this file imports no CLAW source.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const PACK_ROOT = process.env.ALFA_HOME
  ? resolve(process.env.ALFA_HOME)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SERVER_INFO = { name: "alfa_o", version: "2.0.0" };

// ---------- pack access ----------

function readPackFile(name) {
  const p = join(PACK_ROOT, name);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function parseProfile() {
  const core = readPackFile("PORTABLE_O.md") ?? "";
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

// ---------- tools ----------

const TOOLS = [
  {
    name: "alfa_boot",
    description:
      "Load the alfa_o operating system: PORTABLE_O.md, MEMORY.md, the active workspace, the profile, and the memory index. Call this first in every session.",
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
];

function text(s) {
  return { content: [{ type: "text", text: s }] };
}
function errText(s) {
  return { content: [{ type: "text", text: s }], isError: true };
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
  const parts = [];
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
  const stamp = new Date().toISOString().slice(0, 10);
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
  const stamp = new Date().toISOString().slice(0, 10);
  const n = readdirSync(dir).filter((f) => f.startsWith(stamp)).length + 1;
  const file = join(dir, `${stamp}-${String(n).padStart(2, "0")}.md`);
  writeFileSync(file, log, "utf8");
  return text(
    `SAVED locally: parallax_logs/${basename(file)} (tier: ${header.tier ?? "unset"}). ` +
      "Local storage is always allowed. Leaving the machine requires a claw_gate ALLOW plus the user's explicit confirmation."
  );
}

const TOOL_IMPL = {
  alfa_boot: toolAlfaBoot,
  memory_save: toolMemorySave,
  memory_recall: toolMemoryRecall,
  claw_gate: toolClawGate,
  parallax_log: toolParallaxLog,
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
            "alfa_o: call alfa_boot first in every session; it loads the operating system, profile, workspace, and memory index. Save durable facts with memory_save; pass every outbound artifact through claw_gate.",
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
