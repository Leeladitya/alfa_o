# alfa_o

### One file that makes any AI prove what it tells you, remember what you decided, and argue with itself before it answers. Same model, better answers. Works on every model, every editor, every machine, including the locked down one at work.

---

## The thirty second version

Here is a real failure, and it is the kind everybody has lived through.

Someone asks an AI to set up a weekly backup. It writes the script, runs it, and reports: **"Done. Backup configured and integrity verified."** Every week after that, the log says the same thing. Integrity verified.

Two weeks later, the archives turn out to be empty. All of them. An empty zip is a valid zip, so it passed the exit code, it passed the file check, it passed the integrity test. The check could not fail, because it was never capable of detecting the thing that actually went wrong.

Now the same request, with alfa_o loaded. Same model, same prompt:

> **Backup script written. I have not verified it.**
>
> A tool exiting zero is not evidence that the work happened, so "verified" is not a word I have earned yet.
>
> Before writing the check, let me name the failure it has to catch: an archive that is valid but empty. A validity test cannot catch that, which makes it decoration rather than a check. Using a content floor instead: at least 1000 entries and at least 100 MB, with the entry count printed in every log line.
>
> One more thing. I will test it under the scheduler rather than from my own shell, because my shell has permissions the scheduler does not. Running it myself would prove nothing.

Nothing about the model changed. The difference is a method, and the method is a text file you paste in.

## What actually changes

- **It has to say how it knows.** Six rungs, from "I ran it and read the output" down to "that is just how it works." Only the top rung earns the word "verified." Below that it says "expected" or "unverified" and means it.
- **It asks before it builds.** Multiple choice questions with a recommendation and the reasoning behind it, not a wall of options dumped back on you.
- **It attacks its own draft before you see it.** A council of minds, each hunting a different kind of failure. You can design your own council for your own work; teaching that is the heart of this pack.
- **It remembers.** Every decision recorded with why it was made, what forced it, and what evidence would legitimately reopen it. Your corrections become permanent law instead of dying with the chat window.
- **It runs anywhere.** Plain text plus one zero dependency server. The model you get changes from machine to machine. The method does not.

## The part that matters at work

Most people cannot choose their AI at their job. The company picks the model, the editor, and the rules, and that is that.

This pack is built for exactly that situation. It is text, so it loads into whatever your employer already gave you. Set one flag to `workplace` and it locks itself down: nothing ever leaves the machine, no client or employer data enters any file it writes, and the sharing channel closes completely. Your real name is never written to disk anywhere, on any machine, by design.

A strong model with no method wastes its strength. A method carried in plain text runs at full strength on whatever model you were handed.

## What is in the pack

| File | Job |
|---|---|
| PORTABLE_O.md | The core: first-run interview, the fixed engine with the evidence ladder and field checks, the convergence method, the rails, the memory loop, the pseudonym law, the CLAW channel, workplace mode. The one file a new user must read. |
| MEMORY.md | The council module, the heart of the system: how to build your OWN council of minds (each seat a dissection plus a lens), how to convene a cut per problem, and the council log that slowly becomes a memory of your own judgment. |
| workspaces/ | Workspace models: the system tuned to one terrain. TEMPLATE.md to build yours; worked examples beside it (first: a data consultant building warehouse pipelines that risk teams model on). Contribute yours by pull request. |
| mcp/ | A zero-dependency MCP server (Node 18+) that loads the whole system into any MCP-capable client, with memory and the CLAW gate as executable law. Wiring guide and a smoke test that prints artifacts, not verdicts. |
| CLAUDE.md | Three-line drop-in for Claude Code folders. Points the session at PORTABLE_O.md and enforces the end-of-session rituals. |

## How to deploy

- **Claude Code or any coding agent:** copy the pack into the project folder. Done.
- **Any MCP-capable editor (VS Code, Claude Desktop, Cursor, and others):** wire mcp/alfa-mcp.mjs per mcp/README.md. The session then boots the system with one tool call on any machine.
- **claude.ai Project or any AI with an instructions field:** paste the full text of PORTABLE_O.md (and MEMORY.md if it fits).
- **Any chat on any AI account:** paste PORTABLE_O.md as the first message.
- **An employer's machine:** same as any of the above, plus answer the machine question with `workplace`. Everything then stays local, nothing is ever submitted anywhere, and no client or employer data enters any alfa file. Full rules in PORTABLE_O.md section 10.

## What stays fixed and what is yours

Fixed: the engine (clarify first, verify everything on the evidence ladder, complete deliverables, three horizons), the convergence method, the pseudonym law, and the CLAW rule. Yours: handle, terrain, voice, personal laws, reader, machine context, your council wardrobe, your workspaces, and whether to participate in the collective intelligence channel. The profile can be re-tuned any time; the engine cannot be tuned away, because it is the part that makes the rest work.

## The collective intelligence channel

Two kinds of contribution, both opt-in, both anonymized. Parallax logs feed the Parallax research corpus under the Collective Intelligence License, devudaaaa Labs; workspace models come into this repo under the Collective Intelligence License, alfa_o edition:

1. **Parallax logs.** When a session resolves a genuinely contested decision, it records an anonymized log with a CLAW consent header (spec in PORTABLE_O.md section 7). Logs are local by default. Only `consent: yes` plus `tier: public`, after a final human confirmation, may be submitted (as a GitHub issue at github.com/devudaaaa/parallax/issues/new). These feed the open research corpus on how people actually decide.
2. **Workspace models.** Your novel way of setting the system to your use case: the terrain map, the laws with their scars, the council seats you designed, the autopsy table. Anonymize it, pass it through `claw_gate`, and open a pull request to this repo. Nobody else has your terrain; that is exactly why it is valuable.

The CLAW rule is absolute in both directions, and the MCP server enforces it in code, fail-closed. On a workplace machine the channel is closed entirely.

## Pack changelog

- **v2.0 (2026-08-05).** The big one. (1) **MEMORY.md**, the council module: the council idea promoted from a paragraph in the method to a full module teaching you to design your own seats (dissection plus lens each, four lines per seat), convene a cut per problem, and keep the council log that becomes a memory of your judgment. (2) **Memory as a first-class loop:** MY_LIBRARY.md becomes an index over memory/ (one fact per file, each with its why and how-to-apply) plus your personal autopsy table of real failures with the cheapest test that would have caught each. (3) **The MCP server** (mcp/): the system as executable law in any MCP client, zero dependencies, with a smoke test that prints artifacts. (4) **The pseudonym law:** no file ever contains a real name, employer, or client; the onboarding handle stands in everywhere; a local gitignored denylist gives it teeth in code. (5) **Workplace mode:** for employer machines; everything local, channel closed, employer policy outranks the pack. (6) **Workspace models** (workspaces/): the template plus the first worked example, and the second contribution channel. (7) **Field checks swept in from the parent system:** real date, print the artifact not the verdict, concept-search over name-search, look before destructive writes, publish from a separate sanitized copy, rotate documented defaults. (8) **A licence**, the Collective Intelligence License, alfa_o edition v1.0: joint copyright, free for all use including at work, published forks come back, selling alfa_o itself needs an agreement. Roadmap for v2.1: BUDDY integration (the devudaaaa Labs companion device) as a physical surface for the memory loop.
- **v1.1 (2026-08-02).** Refreshed with the four laws that landed in the parent system after the v1.0 cut: the never-a-bare-menu clause, the evidence ladder, the five-part decision record, and the finesse pass.
- **v1.0 (2026-07-11).** First release. The engine, the six-question first-run interview, the council method, the personal library loop, and the Parallax and CLAW collective intelligence channel.

## License

[Collective Intelligence License, alfa_o edition, v1.0](LICENSE). Joint copyright, LEED and devudaaaa Research Lab. In plain words:

- **Use it anywhere, free, including at your job**, on client engagements, and inside a company. No registration, no notice, no fee.
- **What you make with it is yours.** The license claims nothing over your deliverables. Your profile, memory, council log, and local logs are your property, and contributing any of them is an invitation, never a requirement.
- **Published forks come back.** If you publicly distribute a modified alfa_o, it ships under this same license, marked as modified, with attribution intact. Private modifications trigger nothing.
- **Selling alfa_o itself needs an agreement.** Using it to earn a living does not.

It is a sibling of the Collective Intelligence License v1.0 that governs the Parallax Engine, and deliberately more permissive, because a method that cannot be carried onto an employer's machine is a method nobody can use.

## Credits

Pack v2.0, 2026-08-05. The universal edition of alfa, the author's personal system, with the driver's seat left empty for you.

## Attribution

The method is Council-Driven Convergence, by LEED (leed.life). Parallax (github.com/devudaaaa/parallax) and CLAW (github.com/Leeladitya/claw) are devudaaaa Labs. Keep the credit line in the file footers when you share the pack; everything you make with it, your profile, your memory, your council, and your local logs are entirely yours.

## Thanks

Thanks to Claude, by Anthropic. This system was designed, argued with, and written alongside Claude across many sessions, and the pack is built so that any capable model can run it. The method is the part that travels; Claude is where most of it was forged.
