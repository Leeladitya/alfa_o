# The alfa_o MCP server
### One file, zero dependencies, Node 18 or newer. It loads the alfa_o operating system into any MCP-capable client: VS Code, Claude Code, Claude Desktop, Cursor, or anything else that speaks the protocol. This is how the method rides along on EVERY machine, whatever model that machine happens to have.

## What it serves

| Tool | Job |
|---|---|
| `alfa_boot` | The whole OS in one call: the machine's real date and time, the usage duty, PORTABLE_O.md, MEMORY.md, the active workspace, the profile, the memory index. Call it first, every session. Since v2.1 every tool reply also carries the time it ran. |
| `memory_save` | One fact per file into memory/, index line updated. Refuses denylist hits (the pseudonym law). |
| `memory_recall` | The index, or one entry in full. |
| `claw_gate` | The CLAW consent gate as code, fail-closed. DENY unless consent yes, tier public, anonymized yes, denylist clean, every bb rule respected, and workplace mode off. |
| `bb_this` | "bb this": guards a security decision. Saves it to memory tagged security and, given block terms, adds a CLAW rule to claw_rules.local.json (gitignored) that `claw_gate` enforces from then on. |
| `parallax_log` | Writes a decision log locally into parallax_logs/. Local always; outbound only via claw_gate ALLOW plus your explicit confirmation. |

## Wiring

The server needs no install step. Point your client at it with `node`, and set `ALFA_HOME` to the folder holding your PORTABLE_O.md (defaults to the pack root, one level above this folder).

**Claude Code** (from any project):

```bash
claude mcp add alfa_o -- node /ABSOLUTE/PATH/TO/alfa_o/mcp/alfa-mcp.mjs
```

**VS Code** (works with the extensions that read `.vscode/mcp.json`, including Copilot's MCP support and Claude Code's VS Code extension):

```json
{
  "servers": {
    "alfa_o": {
      "type": "stdio",
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/alfa_o/mcp/alfa-mcp.mjs"],
      "env": { "ALFA_HOME": "/ABSOLUTE/PATH/TO/alfa_o" }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`, under `mcpServers`): same `command`, `args`, and `env` shape as above.

Exact settings locations move between client versions; if your client's docs differ, trust the client's docs. The server itself is plain stdio JSON-RPC and does not change.

## First run on a new machine

1. Copy the alfa_o pack anywhere on the machine.
2. Seed `denylist.local.txt` at the pack root: the terms that must never be written to disk (your real name, your employer, client names), one per line. It is gitignored and never leaves the machine.
3. Wire the server (above), start a session, and call `alfa_boot`. If the profile is unset, the session runs the seven-question interview first.
4. On an employer machine, answer the machine question with `workplace`. The gate then denies every outbound artifact, no exceptions, and no client or employer data may enter any alfa file.

## Verifying it (do not trust this README; run the test)

```bash
node /ABSOLUTE/PATH/TO/alfa_o/mcp/smoke-test.mjs
```

The smoke test builds a throwaway fixture pack in a temp folder (your real profile, memory, and logs are never touched), drives the server over real stdio, and prints the artifacts rather than just PASS: the boot payload, the files written, the DENY reasons. Every check names the failure it exists to catch, including: the pseudonym law failing silently, the CLAW gate failing open on a private tier or a malformed header, and workplace mode being decorative instead of binding.

## Trust and privacy

- The server reads and writes only inside `ALFA_HOME`. No network calls, ever. Submission of anything anywhere is a human act that happens outside this server, and only after `claw_gate` says ALLOW and you confirm.
- Your real name is never stored; the handle stands in for you everywhere (the pseudonym law).
- CLAW (devudaaaa Labs, github.com/Leeladitya/claw) is credited as the source of the policy model; this server applies the pattern and imports no CLAW source.

---

*alfa_o v2.0. Method: Council-Driven Convergence by LEED (leed.life). Parallax and CLAW: devudaaaa Labs (devudaaaa.xyz).*
