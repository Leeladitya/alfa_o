# alfa_o

### Your AI is smart. It is not careful. alfa_o is the method that makes it careful.

One text file that makes any AI prove what it tells you, remember what you decided, and argue with itself before it answers. Same model, better answers. Every model, every editor, every machine, including the locked down one at work.

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

Nothing about the model changed. The difference is a method, and the method is a text file.

## What it does to your AI

- **It has to say how it knows.** Six rungs, from "I ran it and read the output" down to "that is just how it works." Only the top rung earns the word "verified." Below that it says "expected" or "unverified," and means it.
- **It asks before it builds.** Multiple choice questions, each with a recommendation and the reasoning behind it, instead of a wall of options handed back to you.
- **It attacks its own draft before you see it.** A council of minds, each hunting a different kind of failure. You design your own council for your own work, and teaching that is the heart of this pack.
- **It remembers.** Every decision is kept with why it was made, what forced it, and what would honestly reopen it. Your corrections become permanent instead of dying with the chat window.
- **It knows what day it is.** New in v2.1, below.

## New in v2.1: alfa knows the time

AI models do not know today's date. They guess from their training, and a long session can run past midnight without noticing. That is how deadlines get missed and "yesterday" becomes last month.

From v2.1, alfa tells your AI the real date and time straight from your machine's clock, the moment a session starts, and again with every alfa tool reply. It also hands the AI a standing duty: check your usage meters at the start and after each milestone, go lean at 70%, and wrap up cleanly at 85%. No plugins, no special support from your editor. alfa injects it.

## Start in three steps

1. **Get the pack.**
   ```bash
   git clone https://github.com/Leeladitya/alfa_o.git
   ```
2. **Load it into your AI.**
   - **Claude Code or any coding agent:** copy the pack into your project folder.
   - **Any MCP-capable editor** (Claude Code, Claude Desktop, VS Code, Cursor, and others): wire the server, for example `claude mcp add alfa_o -- node /ABSOLUTE/PATH/TO/alfa_o/mcp/alfa-mcp.mjs`. Details in [mcp/README.md](mcp/README.md).
   - **A claude.ai Project, or any AI with an instructions field:** paste the whole of PORTABLE_O.md in.
   - **Any chat on any AI account:** paste PORTABLE_O.md as your first message.
3. **Answer seven questions.** On first run the AI interviews you: what to call you, what you make, how your work should sound, your own rules, who reads your work, whether this is a work machine, and whether you want to share anonymized decisions. Then it gets to work.

## Words you can say

You never have to learn the system. Just say one of these, any time:

| Say | What happens |
|---|---|
| **heartbeat** | Your AI syncs right now: it saves what you did, what you decided, and what it learned, then tells you what it saved. Say it as often as you like. |
| **remember this** | The last decision or fact becomes a permanent memory. |
| **what do you know** | It shows you everything it remembers, so you can fix anything stale. |
| **council** | It argues with itself, using your council, before it answers. |
| **how sure are you** | It tells you exactly how it knows, in plain words. |
| **bring home** | It packs the session into a short block you can carry to any other AI. |
| **bb this** | It guards the decision you just made. bb is Baahubali, alfa's guard: it records the decision as a security call, turns anything that must never leave your machine into a CLAW rule the gate enforces from then on, and attacks the decision for leaks and abuse. |

Your alfa will suggest one of these when the moment is right, once, and then leave you alone. Start with **heartbeat**. It is the one that keeps everything else alive. And whenever you make a security decision or set a strategy, it will ask you to **bb this**.

## Tapes: take your alfa with you

Your alfa's home (memory, library, logs, your own workspaces) can travel on a tape. The core never does, so a tape can never change how anyone's alfa is governed.

```bash
node tapes/tape.mjs record . my-backup.alfatape                                    # a backup tape for yourself
node tapes/tape.mjs play my-backup.alfatape ~/new-machine/alfa_o                   # shows the plan, changes nothing
node tapes/tape.mjs play my-backup.alfatape ~/new-machine/alfa_o --yes             # plays it
node tapes/tape.mjs keygen friend                                                  # your friend makes keys once
node tapes/tape.mjs record . for-friend.alfatape --kind share --to friend.pub      # only your friend can open it
```

An empty tape never reports success. A share tape leaves your profile, real-name list and rules behind, and refuses to record if anything in it breaks a wall. Playing never overwrites: if a file already exists, the tape's version lands beside it. On a work machine you can back up in place, but nothing is shared out or played in.

## At work

Most people cannot choose their AI at their job. The company picks the model, the editor, and the rules.

This pack is built for exactly that. It is text, so it loads into whatever your employer already gave you. Answer the machine question with `workplace` and it locks itself down: nothing ever leaves the machine, no client or employer data enters any file it writes, and sharing is switched off completely. Your real name is never written to disk, on any machine, by design.

And the answer is not just taken on trust. If a machine looks employer-managed but was set up as personal, alfa runs as Work until you confirm in your own words, and it keeps that confirmation on record. Everything alfa learns on a work machine is stamped as work data and stays on that machine for good, even if the setting is later switched. Flipping the switch can never launder work data out. Nothing about these checks ever leaves your machine either.

A strong model with no method wastes its strength. A method in plain text runs at full strength on whatever model you were handed.

## What is in the pack

| File | Job |
|---|---|
| PORTABLE_O.md | The core: the first-run interview, the fixed engine with the evidence ladder and field checks, the convergence method, the memory loop, the pseudonym law, the CLAW channel, workplace mode. The one file a new user must read. |
| MEMORY.md | The council module: how to build your OWN council of minds (each seat a dissection plus a lens), convene it per problem, and keep the council log that slowly becomes a memory of your own judgment. |
| workspaces/ | The system tuned to one line of work. TEMPLATE.md to build yours, and a worked example beside it: a data consultant building warehouse pipelines that risk teams model on. |
| mcp/ | A zero-dependency MCP server (Node 18+) that loads the whole system into any MCP client, keeps your memory, puts the CLAW gate into code, turns every "bb this" into a CLAW rule, injects the clock, checks the seal, runs risky commands only through Baahubali (`alfa_exec`), and measures maturity from evidence (`alfa_maturity`). Also here: `seal.mjs`, `baahubali.mjs`, `walls.mjs`, and two smoke tests that print what they checked, not just PASS. |
| tapes/ | `tape.mjs`: record your alfa's home onto a tape and play it on a new machine, or seal it so only one friend can open it. Never carries the core. Tested by `tape-smoke-test.mjs`. |
| claw/ | The CLAW rulebook (`policy.json`): what counts as outbound, destructive, install, or a change to the core. The instructions and the code read the same file. |
| CLAUDE.md | A three-line drop-in for Claude Code folders that points the session at PORTABLE_O.md and enforces the end-of-session rituals. |

## What is fixed and what is yours

**Fixed:** the engine (clarify first, verify on the evidence ladder, complete deliverables, three horizons), the convergence method, the pseudonym law, and the CLAW rule. The engine cannot be tuned away, because it is the part that makes the rest work.

**Yours:** your handle, line of work, voice, personal rules, reader, machine context, your council, your workspaces, and whether to share anything at all. Re-tune any of it whenever you like.

## Share what you learn (only if you want to)

Two ways to give back, both opt-in, both anonymized:

1. **Parallax logs.** When a session settles a genuinely contested decision, it can record an anonymized log with a CLAW consent header (spec in PORTABLE_O.md section 7). Logs stay local by default. Only `consent: yes` plus `tier: public`, after your final confirmation, may be submitted, as an issue at github.com/devudaaaa/parallax/issues/new. They feed an open research corpus on how people actually decide.
2. **Workspace models.** Your way of setting the system to your work: the terrain, the rules and the scars behind them, the council seats you designed. Anonymize it, pass it through `claw_gate`, and open a pull request. Nobody else has your terrain, which is exactly why it is valuable.

Who shares what depends on your edition:

| Edition | Sharing |
|---|---|
| **Public** (every copy starts here) | Optional. Nothing leaves without your yes. |
| **Circle** (coming) | Giving anonymized logs back is the price of membership. You can leave any time. |
| **Work** | Nothing ever leaves. Never in the Circle. Always free for you. |

The CLAW rule is absolute in every edition, and the MCP server enforces it in code, fail-closed. Nothing identifying ever leaves, every contribution needs your final yes, and anything you guarded with "bb this" never leaves your machine at all. These are terms of the method; the licence stays v1.0.

## What is coming

v2.1 is a small release with a lot behind it. Here is what is being built. No dates are promised; each piece ships when it is proven.

- **Baahubali, a guard for every AI app.** He holds the walls whatever app you run, with no special support needed. One thing he cannot do yet is stop a single stray command in the moment it runs. That job belongs to his successor, coming in a future update for every app that supports it.
- **A seal on every copy.** Your alfa will tell you whether it is official, modified, or of unknown origin, and keep working either way.
- **alfas that talk to each other**, safely: every message checked on arrival, and nothing another alfa says is ever taken as an order.
- **Growing up on evidence.** Your alfa will measure its own maturity from what it has actually done, not from what it claims, and tell you when it is ready for more.
- **alfa meets your apps.** Your alfa will plug into the tools you already use and carry its method in with it. The first one is LEAP.

### Launch checklist

- [x] alfa knows the time and watches your usage (v2.1)
- [x] Words you can say, starting with heartbeat (v2.1.1), and bb this for every security call (v2.1.2)
- [x] bb this becomes CLAW: every guarded decision updates the gate (v2.2)
- [x] **The seal.** Every copy knows where it came from: official, modified, or unknown (v2.3)
- [x] **Baahubali.** The guard that holds the walls in every AI app (v2.3)
- [x] **Tapes.** Carry your alfa to a new machine, or hand it to a friend (v2.3.1)
- [ ] **Growing up on evidence.** The measuring is in v2.3; the Circle invitation comes later.

Come explore v2.1. The revolution is in the method, and it is just getting started.

## Changelog

- **v2.4 (2026-11-08). Work mode cannot be faked away.** (1) alfa looks for local signs that a machine is employer-managed (device management, a corporate directory join, a company security agent; a work email in git counts as a weak sign); a "personal" answer on such a machine runs as Work until the user confirms in their own words with `alfa_confirm_personal`, which records a security decision and asks again if the signs change. (2) Every memory entry, log and workspace is stamped with the mode it was born in, and older entries are stamped at the first boot of v2.4. (3) Work-born data never leaves: the gate, the git gatekeeper and the tapes refuse it, including verbatim copies pasted into other text, whatever the machine is set to later. (4) Mode changes are announced at boot with the list of what stays locked, and logged. The signs are only read on the machine and never sent anywhere; they can be absent or faked, so this makes the honest answer the easy one rather than proving anything. Tests: 11 new checks; three deliberate breaks each caught.
- **v2.3.2 (2026-11-08). The licence describes what alfa_o is now.** LICENSE v1.0.1 calls alfa_o an operating system (a method, a signed core, and a guard) instead of a method; no right or obligation changed. Re-signed by goldpack.
- **v2.3.1 (2026-11-07). Tapes.** `tapes/tape.mjs` records an alfa's home onto a backup or share tape and plays it into another alfa: home only, never the core; a content floor that counts knowledge, so an empty tape never reports success; share tapes scrubbed and sealed to one receiver (X25519 and AES-256-GCM); playing shows the plan first and never overwrites; work machines back up only. 9 checks. Outside the sealed core, so the seal still reads official 2.3.0.
- **v2.3 (2026-11-07). The seal and Baahubali.** (1) **The seal** (`mcp/seal.mjs`): goldpack's offline root key certifies a release key, the release key signs a manifest of every core file with its edition, and every boot reports official, modified (naming the files), or lineage unknown. A forged edition tag breaks the signature. It never locks anyone out. (2) **Baahubali** (`mcp/baahubali.mjs`, `mcp/walls.mjs`, `claw/policy.json`): the core locked read-only on disk; a git pre-commit gatekeeper that holds real names, personal files, bb-guarded terms, tripwire text and unreleased core changes, under every AI agent; tripwire decoys; and `alfa_exec`, which runs a shell command only after CLAW judges it (plain local commands run, outbound, destructive and install commands wait for the human's yes, anything that breaks a wall or touches the core is denied, and nothing outbound ever runs on a work machine). (3) **Editions**: the seal names the edition, and a work machine always runs as Work. (4) **`alfa_maturity`**: Seed, Living, Disciplined, Circle-ready, measured from content that must resolve on disk; a one-day burst of entries or an empty entry scores nothing. (5) **Your profile moves to `profile.local.md`** (gitignored), so your answers never sit in a tracked file. Tests: 19 original checks plus 19 new ones; four deliberate breaks were each caught by the check meant for them.

- **v2.2 (2026-11-07). bb this is CLAW, and the sharing terms by edition.** Public shares only on the user's yes; the coming Circle gives anonymized logs back as the price of membership; Work never shares and is always free. The licence stays v1.0. A new tool, `bb_this`, turns a security decision into a local CLAW rule: the decision is saved to memory tagged security, its block terms go into `claw_rules.local.json` (which never leaves the machine), and `claw_gate` denies any outbound artifact that breaks a rule, naming the rule without repeating the secret. An unreadable rules file makes the gate deny everything until it is fixed. The smoke test grows to 19 checks, and the two enforcement checks were proven to fail when enforcement is removed.
- **v2.1 (2026-11-07). alfa knows the time.** `alfa_boot` opens with the machine's real date and time, and every alfa tool reply carries the time it ran, so any client knows today's date and a long session notices when it crosses midnight. The boot also carries the usage duty, and PORTABLE_O.md gains it as a field check for surfaces without the server. **v2.1.1:** words you can say (heartbeat, remember this, what do you know, council, how sure are you, bring home), and alfa recommends one at the right moment, once per session. **v2.1.2:** "bb this" guards a security decision, and alfa asks for it every time one is made. Memory entries and Parallax logs are stamped with the local date instead of the UTC date, which was already tomorrow on evenings west of Greenwich. The smoke test grows from 11 to 14 checks, and the two clock checks were proven to fail when the clock is removed. BUDDY integration, planned for this release, moves to a later one.
- **v2.0 (2026-08-05). The big one.** MEMORY.md, the council module. Memory as a first-class loop: one fact per file, each with its why and how to apply, plus your own table of real failures and the cheapest test that would have caught each. The zero-dependency MCP server. The pseudonym law, with a local denylist that gives it teeth in code. Workplace mode. Workspace models. Field checks from the parent system: the real date, print the artifact not the verdict, search by concept not by name, look before destructive writes, publish from a separate clean copy, rotate documented defaults. And a licence.
- **v1.1 (2026-08-02).** The never-a-bare-menu clause, the evidence ladder, the five-part decision record, and the finesse pass.
- **v1.0 (2026-07-11).** First release: the engine, the first-run interview, the council method, the personal library loop, and the Parallax and CLAW sharing channel.

## License

[Collective Intelligence License, alfa_o edition, v1.0.1](LICENSE). v1.0.1 only corrects the description of alfa_o (now an operating system); the terms are exactly those of v1.0. Joint copyright, LEED and devudaaaa Research Lab. In plain words:

- **Use it anywhere, free, including at your job**, on client work, and inside a company. No registration, no notice, no fee.
- **What you make with it is yours.** The license claims nothing over your deliverables. Your profile, memory, council log, and local logs are yours, and sharing any of them is an invitation, never a requirement.
- **Published forks come back.** If you publicly distribute a modified alfa_o, it ships under this same license, marked as modified, with attribution intact. Private changes trigger nothing.
- **Selling alfa_o itself needs an agreement.** Using it to earn a living does not.

It is a sibling of the Collective Intelligence License v1.0 that governs the Parallax Engine, and deliberately more permissive, because an operating system you cannot carry onto an employer's machine is one nobody can use.

## Attribution

The method is Council-Driven Convergence, by LEED (leed.life). Parallax (github.com/devudaaaa/parallax) and CLAW (github.com/Leeladitya/claw) are devudaaaa Labs. Keep the credit line in the file footers when you share the pack. Everything you make with it is entirely yours.

Pack v2.1, 2026-11-07. The universal edition of alfa, the author's personal system, with the driver's seat left empty for you.

## Thanks

Thanks to Claude, by Anthropic. This system was designed, argued with, and written alongside Claude across many sessions, and the pack is built so that any capable model can run it. The method is the part that travels; Claude is where most of it was forged.
