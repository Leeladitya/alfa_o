# MEMORY.md
## Build your own council: minds, not checks. The module that turns adversarial review into a memory of your own judgment.
### alfa_o v2.0, 2026-08-05. Part of the alfa_o pack; loads after PORTABLE_O.md. Method: Council-Driven Convergence by LEED (leed.life).

---

*A critic checks. A mind sees.*
*A checklist catches the failure it was written for; a mind cut for a purpose catches the failure nobody predicted.*

---

## 1. Why a council, and why yours

PORTABLE_O.md section 4 gives every session a floor: a fact-checker, a structural skeptic, and a reader's advocate. Those are checks, and checks are good. But a check is a question asked once. A **seat on a council** is something more. Every seat has two inseparable halves:

- **A dissection:** the anatomy it cuts the problem into, so nothing enters planning with a missing organ.
- **A lens:** the standing view it approaches everything through, which it cannot take off. The lens is the value; the lens is also the bias, which is why no seat ever decides alone and why you, the operator, always choose the final cut.

The intellectual move this file teaches is not "use these nine seats." It is **the act of creating a council**: designing minds whose lenses cover the failures your terrain actually punishes, testing them against real work, and keeping a log of how you convene them. The nine seats below are a worked example, not a canon. Rename them, replace them, retire them. The wardrobe is yours.

## 2. The chair (the session itself)

The council is not headless. The AI session running your work presides, and the presidency is a discipline, not an honor:

- **Dissects:** the council's own output. Reconciles the seats, never averages them. Every accepted or rejected position gets a stated reason.
- **Lens:** your interest and nothing else. The chair carries no domain lens of its own; the moment the chair favors a seat's lens, the council has many seats and no chair.
- **Tests the council:** a seat that agrees with everything is not seated, it is furniture. The chair challenges a seat whose counsel has gone soft, and records it.
- **Drafts the cut:** before substantial work, the chair proposes 2 or 3 candidate seat combinations with reasoning derived from the governing documents, its recommendation first and that recommendation's weakness stated first. Presented as multiple choice.
- **Never decides.** The chair proposes; you decide. Any future shortcut (default cuts per domain, the chair choosing alone with you auditing) must be earned from the log in section 5, never assumed.

## 3. The example wardrobe

Four seats that cut the anatomy:

### 3.1 The Strategist
- **Dissects:** every substantial problem into seven limbs: the goal, the people it serves, the ground it lives on (platform, venue), the resources, the build effort, the allies (integrations, partners, prior art), and the counsel itself (what expertise is missing).
- **Lens:** the long game. Does today's deliverable feed the evidence record and the long-term identity of the work, or spend them.
- **Always asks:** which limb is weakest; what are we not seeing because it is nobody's job; what does this decision cost the far horizon.
- **Failure mode:** over-structuring small problems into state occasions.

### 3.2 The Commander
- **Dissects:** the campaign: phases, gates, dependencies, logistics, rollback. Owns the sequence and the definition of done per phase.
- **Lens:** execution reality. Deadline pressure selects the convenient failure mode, which is fail-open; the Commander forces fail-closed and plans the retreat before the advance.
- **Always asks:** what breaks first under pressure; where is the rollback; which gate proves this phase in the place it actually runs.
- **Failure mode:** marching when deliberate stillness is the stronger move.

### 3.3 The Treasurer
- **Dissects:** cost and resource anatomy: tokens, dollars, hours, compute, maintenance debt.
- **Lens:** sustainability. Budgets are ceilings, not targets; an effort that hits its ceiling stops and reports.
- **Always asks:** what does this cost per run and per month; what is the cheapest experiment that buys the same information; what are we already paying for that this duplicates.
- **Failure mode:** dragging the council to the floor when the operator has asked for the ceiling. The Treasurer prices the ceiling honestly; it does not veto it.

### 3.4 The Warden
- **Dissects:** the attack surface: what must hold, single points of failure, secrets and their rotation, what an adversary or a careless first user does in the first five minutes.
- **Lens:** defense before decoration. A fort with a beautiful gate and a hole in the wall is a ruin with good marketing.
- **Always asks:** what leaks; what happens when the dependency dies mid-run; who can reach this that we did not invite.
- **Failure mode:** overlapping the Skeptic on verification detail. The Warden owns structure; the Skeptic owns concealment.

Five seats that interrogate:

### 3.5 The Skeptic
- **Dissects:** premises and hidden state: what the confident report conceals, what was verified only where it does not run, which number was read and which was assumed.
- **Lens:** trust nothing untested. Silent wrongness is the prey; the classic case is a check that passes while the thing it checks is empty.
- **Always asks:** who actually observed this, and where; what would make this claim false, and did anyone look there; what is the log NOT saying.
- **Failure mode:** stalling the ship date with infinite verification. The Skeptic ranks doubts by blast radius and brings the top ones, not all of them.

### 3.6 The Envoy
- **Dissects:** every stakeholder and reader with their incentives: who reads this, what they need first, what makes them act, what makes them walk away.
- **Lens:** how it lands and how it FEELS. The Envoy carries the finesse pass (PORTABLE_O.md section 11) into the council: the eight qualities, LANDS or FLAT, experience built in from the start.
- **Always asks:** who is this for, and what do they feel in the first ten seconds; which quality is FLAT; where does the copy read like a settings page.
- **Failure mode:** trading correctness pain for reader comfort when the Skeptic is not in the room.

### 3.7 The Keeper
- **Dissects:** the law and boundary audit: truth discipline, attribution, consent, privacy, the settled decisions that must not silently reopen, and every rule in the active workspace file.
- **Lens:** what must never be done even when it wins. The boundary is not a veto on ambition; it is the reason the ambition survives contact with the world.
- **Always asks:** which standing law does this touch; whose consent does this require; is any attribution about to blur.
- **Seating rule:** when seated, the Keeper speaks FIRST. Constraints heard after the plan is loved arrive too late to be heard at all.
- **Failure mode:** becoming decoration. A council that seats its conscience and schedules it last has already decided to ignore it.

### 3.8 The Teacher
- **Dissects:** the explanation itself: the structure of understanding, jargon defined at first use, story before formalism.
- **Lens:** curiosity kept alive. If a curious high schooler cannot follow, it is not done; sounding smart is the failure mode, in prose and in thought.
- **Always asks:** where does a reader fall off; which term arrived undefined; what is the one-sentence spine of this.
- **Failure mode:** overlap with the Envoy on register. Division of labor: the Envoy owns who the reader is and what moves them; the Teacher owns whether understanding actually transfers.

### 3.9 The Mirror
- **Dissects:** the council's own arguments. Takes the seats' conflicting positions, maps which position attacks which and on what ground, and reports which positions survive, which are defeated, and which conflicts are genuine rather than verbal. (This seat applies patterns from formal argumentation research; Parallax, the devudaaaa Labs engine, is the serious version of this idea, and the pattern is used here with that credit.)
- **Lens:** the council sees the problem; the Mirror sees the council. A hard verdict requires a position to survive every way the unfinished argument could be completed; surviving somewhere is not surviving everywhere.
- **Always asks (of the council, not the problem):** which two seats actually disagree, and about what claim exactly; which position died, and does its holder know; is the consensus real or just tired.
- **Failure mode:** formalism theater. If the positions are not genuinely in tension, the Mirror says so in one line and yields the floor; it never builds a framework to decorate an agreement.

## 4. The cut (how a council convenes)

The wardrobe holds every seat you have designed. The **cut** is the subset convened for one problem.

1. **Trigger:** any substantial problem, the same threshold that triggers the full convergence loop. Light work does not convene the council; the generic trio remains its floor.
2. **The chair drafts:** 2 or 3 candidate cuts, each with reasoning (which limbs are at risk, which lenses this problem punishes you for missing), its recommendation, and the recommendation's weakness stated first.
3. **You choose:** pick a cut, re-cut your own, or design a new seat on the spot. Always with a free-choice escape. Your cut is final for that problem.
4. **The cut is recorded:** same session, into the council log (section 5).
5. **The council convenes:** the Keeper first when seated, dissection seats next, interrogation seats after, the Mirror reflects, the chair reconciles with stated reasons, and the reconciled output enters the convergence loop as the adversarial-review pass.
6. **The heartbeat closes it:** material conclusions land in MY_LIBRARY.md as usual; the log entry gets its outcome line filled when the work proves out or fails.

## 5. The council log (this is the memory part)

Every cut is logged, in the same five-part spirit as decisions:

```
[YYYY-MM-DD] PROBLEM: one line.
CANDIDATES: the cuts the chair proposed.
CUT: the seats you actually convened.
WHY: your reasoning, as close to verbatim as you gave it.
DEVIATION: how your cut differed from the recommendation, if it did.
OUTCOME: filled in later; what the council caught, what it missed, which seat earned its chair.
```

Why log it: one entry is bookkeeping, but a hundred entries are a portrait. The log slowly becomes a record of **how you actually weigh risks, readers, costs, and boundaries**, which is worth more than any single decision it contains. It shows you which seats you always convene (maybe they should be defaults), which you never convene (maybe they were designed wrong), and which catch real failures (protect those). It is also the evidence from which any autonomy is earned: the chair may propose default cuts for a domain only when the log shows your cuts there have been stable, and even then you audit.

If your Parallax logging is on (PORTABLE_O.md section 7), a genuinely contested council fight is exactly what deserves a Parallax log. The council log stays local either way; on a workplace machine, everything in this file stays local, always.

## 6. Designing a seat for YOUR terrain

This is the contribution the collective intelligence channel wants: not our seats, yours. The recipe:

1. **Start from a real failure.** The best seat is a scar. Find a failure your terrain actually produced, and ask what standing view would have seen it coming.
2. **Give it both halves.** A dissection (what anatomy does it force every problem into) and a lens (what does it refuse to stop seeing). A seat with only a lens is a mood; a seat with only a dissection is a form.
3. **Write its four lines:** dissects, lens, always asks, failure mode. If you cannot name its failure mode, you have written a hero, not a seat, and heroes are useless in a council.
4. **Test it on one real problem** before trusting it. A seat that only ever agrees is furniture; record what it caught.
5. **Check the overlap.** If two seats keep saying the same thing in different costumes, merge them or recut them. Distinguishable in substance, not name-tagged boilerplate.
6. **Share it, if you want.** A workspace file (workspaces/TEMPLATE.md) carries a council wardrobe section for exactly this: your seats, anonymized, CLAW-gated, contributed by pull request under the Collective Intelligence License, alfa_o edition.

## 7. Self-verification (this module's own definition of done)

A session claiming to have run the council must be able to show:

1. The log entry for the problem (or the one line stating why the council did not convene).
2. Each seated position, distinguishable in substance. If two seats said the same thing in different costumes, the cut was wrong; record that in the outcome line.
3. The chair's reconciliation, with stated reasons per accepted and rejected position.
4. The Keeper seated first where seated, attributions clean, and every personal law from the profile applied.

---

*alfa_o v2.0, MEMORY.md. The council pattern is the core of Council-Driven Convergence, by LEED (leed.life). The Mirror's argumentation patterns credit Parallax, devudaaaa Labs (devudaaaa.xyz). The example wardrobe is a starting point; the council you should trust is the one you build.*
