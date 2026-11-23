# alfa_o

### Your AI is smart. It is not careful, and it does not know you. alfa_o fixes both.

alfa_o is an operating system for working with AI. It teaches any model to prove what it says, remember what you decided and why, and argue with itself before it answers. Over time it becomes something more: a working twin of how you think, one you can carry to any AI, any machine, and hand to the people who come after you.

---

## What you can build with it

**A twin of your judgment.**
Every decision you make with alfa is kept with its reasons, the event that forced it, and what would honestly change your mind. Every correction you give becomes permanent. Your council records which voices you trust on which problems. After a few months, ask *"what would I decide here?"* and it answers the way you would, shows you the past decisions it is leaning on, and tells you plainly when it is guessing.

**A colleague who never forgets the project.**
Open a session on a Monday and it already knows what you did on Friday, what you ruled out last month, and the mistake you swore never to repeat. Say **heartbeat** and it writes down everything you just learned together.

**Your profession, packaged.**
A workspace is the system tuned to one line of work: the terrain, the rules and the scars behind them, the council seats that field needs. The first one is a data consultant building warehouse pipelines that risk teams depend on. Build one for law, for research, for teaching, for security, for running a clinic. Share it, and everyone in your field starts where you are now.

**A team that thinks the same way.**
Give your whole team the same workspace and the same council, and every member's AI holds the same standards, checks the same failure modes, and records decisions in the same shape. New people stop learning your team's judgment by trial and error.

**A handover that loses nothing.**
When you change jobs, retire a project, or train a successor, record your alfa onto a tape. The person who plays it inherits the decisions, the reasons, and the lessons, not just the files. Institutional memory that walks out of the door with nobody.

**Safe AI on a locked-down work laptop.**
Most people cannot choose the AI their employer gives them. alfa loads into whatever you have. On a work machine it locks itself down: nothing leaves, nothing you learn there can be laundered out later, and it stays free for you.

**Your own tools on top.**
alfa speaks MCP, the open standard AI apps use for tools. Add your own: a connector to the app you work in, a checker for your field, a seat for your council. Every tool you add inherits the guard. The first connector is LEAP.

**Research on how people really decide.**
If you choose to, your alfa can share anonymized records of hard decisions with an open research corpus at devudaaaa Labs. Nothing identifying ever leaves, and nothing leaves without your yes.

## How a twin is made

Nobody writes a twin. It grows out of ordinary work:

1. **Day one.** Seven questions: what to call you, what you make, how your work should sound, your own rules, who reads it, whether this is a work machine, and whether you want to share. Your answers stay on your machine.
2. **Every session.** Decisions are written in five parts: what was decided, why, what forced it, and what would reopen it. Corrections become law the moment you give them.
3. **Every hard call.** Your council argues it out, and the log keeps who argued what and what you chose.
4. **Over weeks.** alfa measures its own maturity, from Seed to Living to Disciplined to Circle-ready. It counts real records saved across real days, never claims. A burst of entries written in one afternoon counts for nothing.

**What a twin is, honestly.** It is a model of how you decide, built only from what you recorded. It is not you. It does not act on its own; it advises the AI you are working with, and it says which of your past decisions it is drawing on. It is only as good as what you let it keep.

## Thirty seconds

Someone asks an AI to set up a weekly backup. It reports **"Done. Backup configured and integrity verified."** every week for two weeks. Then every archive turns out to be empty. An empty zip is a valid zip, so every check passed.

Same model, same request, with alfa_o loaded:

> **Backup script written. I have not verified it.** A tool exiting zero is not evidence the work happened. The failure this check must catch is an archive that is valid but empty, so I am using a content floor: at least 1000 entries and 100 MB, with the count printed in every log line. And I will test it under the scheduler, not my own shell, because my shell has permissions the scheduler does not.

Nothing about the model changed. What changed is the system it was running inside.

## Start in four steps

1. **Get it.** `git clone https://github.com/Leeladitya/alfa_o.git`
2. **Load it.** Put the folder in your project (Claude Code or any coding agent), wire the server in any MCP editor (`claude mcp add alfa_o -- node /ABSOLUTE/PATH/TO/alfa_o/mcp/alfa-mcp.mjs`), or paste PORTABLE_O.md into any AI.
3. **Answer seven questions.**
4. **Check your copy is the real one.** `node mcp/seal.mjs verify` says official, modified, or lineage unknown.

## Words you can say

| Say | What happens |
|---|---|
| **heartbeat** | Syncs now: saves what you did, decided, and learned. |
| **remember this** | The last decision or fact becomes permanent. |
| **what do you know** | Shows everything it remembers, so you can fix it. |
| **council** | Argues with itself, using your council, before answering. |
| **how sure are you** | Tells you exactly how it knows. |
| **bring home** | Packs the session to carry to any other AI. |
| **bb this** | Guards a security decision, and turns what must never leave into a rule the gate enforces. |

## Why you can trust it

- **The seal.** Every release is signed. Your copy checks itself on every start and tells you if anything in its core was changed.
- **Baahubali, the guard.** Risky commands wait for your yes; anything that leaks a name, touches the core, or sends work data out is refused; a git gatekeeper and tripwires catch what slips past. He works in every AI app. His successor, coming later, will stop a stray command in the very moment it runs.
- **Your name never touches disk.** A handle stands in for you everywhere.
- **Nothing leaves without you.** Every share is opt-in, anonymized, and confirmed by you at the last step.

## Where it is going

- [x] Proves, remembers, argues, knows the date, watches its budget
- [x] Words you can say, the guard, the seal, tapes, work mode that cannot be faked (v2.1 to v2.4)
- [ ] **The Circle:** invitations for alfas that have proven themselves
- [ ] **Twins that talk:** alfas consulting each other safely, every message checked, nothing taken as an order
- [ ] **alfa meets your apps,** starting with LEAP
- [ ] **bb's successor**

Full history in [CHANGELOG.md](CHANGELOG.md). What is inside each folder: [section below](#whats-inside).

## What's inside

| Path | What it is |
|---|---|
| PORTABLE_O.md | The core: the interview, the engine, the method, the memory loop, the sharing rules. The one file to read. |
| MEMORY.md | How to build your own council. |
| workspaces/ | Professions, packaged. A template and a worked example. |
| mcp/ | The server and the guard, with three test suites. |
| claw/, seal/ | The guard's rulebook, and the public half of the seal. |
| tapes/ | Carry or hand over your alfa. |

## License

[Collective Intelligence License, alfa_o edition, v1.0.1](LICENSE). Free for everyone, including at work and on client work. What you make is yours. Published forks come back under the same licence. Selling alfa_o itself needs an agreement. Joint copyright, LEED and devudaaaa Research Lab.

## Attribution and thanks

Council-Driven Convergence is LEED's method (leed.life). Parallax and CLAW are devudaaaa Labs. alfa_o v2.4, signed.

Thanks to Claude, by Anthropic, where most of this was forged. The method is the part that travels.
