# alfa_o

### Your AI is smart. It is not careful. alfa_o makes it careful.

alfa_o is an operating system for working with AI. A method your AI follows, a guard that holds the walls, and a seal that proves where your copy came from. It runs on every model, in every editor, on every machine, including the locked down one at work.

---

## Thirty seconds

Someone asks an AI to set up a weekly backup. It writes the script, runs it, and reports: **"Done. Backup configured and integrity verified."** Every week the log says the same thing.

Two weeks later, every archive turns out to be empty. An empty zip is a valid zip, so it passed the exit code, the file check, and the integrity test. The check could never fail, because it was never able to see the thing that actually went wrong.

Same model, same request, with alfa_o loaded:

> **Backup script written. I have not verified it.**
>
> A tool exiting zero is not evidence that the work happened, so "verified" is not a word I have earned yet.
>
> The failure this check has to catch is an archive that is valid but empty, and a validity test cannot see that. So I am using a content floor instead: at least 1000 entries and at least 100 MB, with the entry count printed in every log line.
>
> One more thing: I will test it under the scheduler, not from my own shell. My shell has permissions the scheduler does not, so running it myself would prove nothing.

Nothing about the model changed. What changed is the system it was running inside.

## What changes when alfa is loaded

- **It has to say how it knows.** Six rungs, from "I ran it and read the output" down to "that is just how it works." Only the top rung earns the word "verified." Below that it says "expected" or "unverified," and means it.
- **It asks before it builds.** Multiple choice questions, each with a recommendation and the reasoning behind it, never a bare menu.
- **It attacks its own draft before you see it.** A council of minds, each hunting a different kind of failure. You design the council for your own work.
- **It remembers.** Every decision is kept with why it was made, what forced it, and what would honestly reopen it. Your corrections become permanent instead of dying with the chat window.
- **It knows what day it is.** Your machine's clock goes into every session, because a model guessing the date is how deadlines get missed.
- **It watches its own budget.** It checks your usage meters, goes lean at 70%, and wraps up cleanly at 85%.

## Start in four steps

1. **Get it.**
   ```bash
   git clone https://github.com/Leeladitya/alfa_o.git
   ```
2. **Load it into your AI.**
   - **Claude Code or any coding agent:** put the folder in your project.
   - **Any MCP-capable editor** (Claude Code, Claude Desktop, VS Code, Cursor, and others): wire the server, for example `claude mcp add alfa_o -- node /ABSOLUTE/PATH/TO/alfa_o/mcp/alfa-mcp.mjs`. Details in [mcp/README.md](mcp/README.md).
   - **A claude.ai Project, or any AI with an instructions field:** paste in the whole of PORTABLE_O.md.
   - **Any chat on any AI account:** paste PORTABLE_O.md as your first message.
3. **Answer seven questions.** On first run your AI interviews you: what to call you, what you make, how your work should sound, your own rules, who reads your work, whether this is a work machine, and whether you want to share anonymized decisions. Your answers stay in `profile.local.md`, which never leaves your machine.
4. **Check your copy is the real one.**
   ```bash
   node mcp/seal.mjs verify
   ```
   It answers official, modified (and names the changed files), or lineage unknown. It never locks you out either way.

## Words you can say

You never have to learn the system. Say one of these, any time:

| Say | What happens |
|---|---|
| **heartbeat** | Your AI syncs right now: it saves what you did, what you decided, and what it learned, then tells you what it saved. |
| **remember this** | The last decision or fact becomes a permanent memory. |
| **what do you know** | It shows you everything it remembers, so you can fix anything stale. |
| **council** | It argues with itself, using your council, before it answers. |
| **how sure are you** | It tells you exactly how it knows, in plain words. |
| **bring home** | It packs the session into a short block you can carry to any other AI. |
| **bb this** | It guards the decision you just made, and turns anything that must never leave your machine into a rule the gate enforces from then on. |

Your alfa suggests one of these when the moment is right, once, then leaves you alone. Start with **heartbeat**; it keeps everything else alive. And whenever you make a security call, it will ask you to **bb this**.

## The guard and the seal

**The seal.** Every release is signed. goldpack, the private root of the alfa family, keeps an offline key that vouches for a release key, and the release key signs a list of every core file. Your copy checks that list on every start. Change a core file and it says so; forge the edition and the signature breaks.

**Baahubali (bb), the guard for every AI app.** He needs nothing special from your editor:

- The core is locked read-only on disk.
- A git gatekeeper refuses commits that carry real names, personal files, guarded words, decoy text, or unreleased changes to the core. It belongs to git, so it works under every AI agent.
- Risky commands go through `alfa_exec`. Ordinary local commands run. Anything that sends data out, deletes, or installs waits for your yes. Anything that breaks a wall or touches the core is refused.
- Decoy files act as tripwires. If their text ever shows up in a commit, a tape, or an outgoing message, he holds it and says so.

What he cannot do yet is stop a single stray command in the very moment it runs. That job belongs to his successor, coming for every AI app that supports it.

## At work

Most people cannot choose their AI at their job. The company picks the model, the editor, and the rules. alfa_o is built for exactly that: it is text plus a small server, so it loads into whatever you were given.

Answer the machine question with `workplace` and it locks itself down. Nothing ever leaves the machine, no client or employer data enters any file it writes, sharing switches off completely, and it stays free for you.

The answer is not just taken on trust. If a machine looks employer-managed but was set up as personal, alfa runs as Work until you confirm in your own words, and keeps that on record. Everything learned on a work machine is stamped as work data and stays there for good, even if the setting is switched later. These checks run on your machine only and are never sent anywhere. They can be fooled by someone determined; what they guarantee is that the honest answer is the easy one and every override leaves a record.

Your real name is never written to disk, on any machine, by design.

## Take your alfa with you

Your alfa's home (memory, library, logs, your own workspaces) can travel on a tape. The core never does, so a tape can never change how anyone's alfa is governed.

```bash
node tapes/tape.mjs record . my-backup.alfatape                                  # a backup tape for yourself
node tapes/tape.mjs play my-backup.alfatape ~/new-machine/alfa_o                 # shows the plan, changes nothing
node tapes/tape.mjs play my-backup.alfatape ~/new-machine/alfa_o --yes           # plays it
node tapes/tape.mjs keygen friend                                                # your friend makes keys once
node tapes/tape.mjs record . for-friend.alfatape --kind share --to friend.pub    # only your friend can open it
```

An empty tape never reports success. A share tape leaves your profile, real-name list and rules behind, and refuses to carry work data at all. Playing never overwrites: if a file already exists, the tape's version lands beside it.

## Growing up on evidence

Your alfa measures its own maturity: Seed, Living, Disciplined, then Circle-ready. It counts what actually exists on disk (real memories saved across real days, decisions written in full, corrections, security calls), never what it claims. A burst of entries written in one afternoon scores nothing, because an empty zip is a valid zip and we learned that lesson once already. Ask it with the `alfa_maturity` tool.

## Share what you learn (only if you want to)

1. **Parallax logs.** When a session settles a genuinely contested decision, it can record an anonymized log with a CLAW consent header. Logs stay local by default. Only `consent: yes` plus `tier: public`, after your final confirmation, may be submitted, as an issue at github.com/devudaaaa/parallax/issues/new. They feed an open research corpus on how people actually decide.
2. **Workspace models.** Your way of setting the system to your work. Anonymize it, pass it through `claw_gate`, and open a pull request. Nobody else has your terrain, which is exactly why it is valuable.

| Edition | Sharing |
|---|---|
| **Public** (every copy starts here) | Optional. Nothing leaves without your yes. |
| **Circle** (coming) | Giving anonymized logs back is the price of membership. You can leave any time. |
| **Work** | Nothing ever leaves. Never in the Circle. Always free for you. |

In every edition, nothing identifying ever leaves, every contribution needs your final yes, and anything you guarded with "bb this" stays on your machine.

## What is inside

| Path | What it is |
|---|---|
| PORTABLE_O.md | The core: the first-run interview, the engine with the evidence ladder and field checks, the convergence method, the memory loop, the pseudonym law, the sharing rules, workplace mode. The one file a new user must read. |
| MEMORY.md | The council module: how to build your own council of minds and keep the log that slowly becomes a memory of your judgment. |
| mcp/ | The zero-dependency server (Node 18+): boot, memory, the CLAW gate, `bb_this`, `alfa_exec`, `alfa_maturity`, `alfa_confirm_personal`. Also `seal.mjs`, `baahubali.mjs`, `walls.mjs`, and three test suites that print what they checked, not just PASS. |
| claw/ | The CLAW rulebook, `policy.json`. Your AI's instructions and alfa's code read the same rules from this one file. |
| seal/ | The public half of the seal: the root's public key, the release key's certificate, and the signed list of core files. No secret ever lives here. |
| tapes/ | The tape recorder and its tests. |
| workspaces/ | The system tuned to one line of work: a template, and a worked example for a data consultant. |
| CLAUDE.md | A three-line drop-in for Claude Code folders. |
| CHANGELOG.md | Every release, newest first. |

## Where it is going

- [x] Knows the time, watches your usage (v2.1)
- [x] Words you can say, heartbeat and bb this (v2.1.1, v2.1.2)
- [x] Guarded decisions become CLAW rules (v2.2)
- [x] The seal and Baahubali (v2.3)
- [x] Tapes (v2.3.1)
- [x] Work mode that cannot be faked away (v2.4)
- [ ] **The Circle:** invitations for alfas that have proven themselves
- [ ] **alfas that talk to each other**, safely: every message checked on arrival, nothing another alfa says taken as an order
- [ ] **alfa meets your apps:** your alfa carries its method into the tools you already use, starting with LEAP
- [ ] **bb's successor:** a guard that stops a stray command the moment it runs

No dates are promised. Each piece ships when it is proven. The full history is in [CHANGELOG.md](CHANGELOG.md).

## License

[Collective Intelligence License, alfa_o edition, v1.0.1](LICENSE). Joint copyright, LEED and devudaaaa Research Lab. In plain words:

- **Use it anywhere, free, including at your job**, on client work, and inside a company. No registration, no notice, no fee.
- **What you make with it is yours.** Your profile, memory, council log, and local logs are yours, and sharing any of them is an invitation, never a requirement.
- **Published forks come back.** If you publicly distribute a modified alfa_o, it ships under this same license, marked as modified, with attribution intact. Private changes trigger nothing.
- **Selling alfa_o itself needs an agreement.** Using it to earn a living does not.

## Attribution

The method is Council-Driven Convergence, by LEED (leed.life). Parallax (github.com/devudaaaa/parallax) and CLAW (github.com/Leeladitya/claw) are devudaaaa Labs. Keep the credit line in the file footers when you share the pack. Everything you make with it is entirely yours.

alfa_o v2.4, signed. The universal edition of alfa, the author's personal system, with the driver's seat left empty for you.

## Thanks

Thanks to Claude, by Anthropic. This system was designed, argued with, and written alongside Claude across many sessions, and it is built so that any capable model can run it. The method is the part that travels; Claude is where most of it was forged.
