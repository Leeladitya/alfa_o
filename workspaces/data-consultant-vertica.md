# WORKSPACE: Data consultant, warehouse pipelines
## Vertica + JupiterOne + Python: building the data layer that risk and analytics consultants model on.
### v1.0, alfa_o v2.0, 2026-08-05. The first worked example of a workspace model.

> **Provenance (evidence ladder, stated honestly):** this workspace was built from a verbal description of a real consultant's setup, not from mining their actual files. Every specific below sits at rung 3 or lower ("reads as though it should work") until the workspace owner corrects it; their corrections become law and get dated. That is not a weakness of the file; it is how every contributed workspace starts. Run it, correct it, keep what survives.

```
--- CLAW ---
consent: yes
tier: public
anonymized: yes
license: Collective Intelligence License, alfa_o edition v1.0
contributed_by: LEED (method author, on the consultant's behalf, anonymized)
--- END ---
```

## 1. Who works here (anonymized)

A data consultant inside a consulting practice. Their product is not analysis; it is **the data layer other consultants stand on**: pipelines that land, clean, and shape data so that the risk team and other practices can build their own models and dashboards downstream, in Alteryx and Tableau among other tools. When the pipeline is wrong, every model built on it is wrong, quietly, which is what makes this terrain dangerous.

## 2. The terrain map

| Tool or system | Role in the work |
|---|---|
| Vertica | The analytics warehouse: columnar SQL database where landed data is shaped into consumable tables. The heavy lifting (joins, aggregation) belongs here, not in Python. |
| JupiterOne | Cyber asset and security data platform, queried with J1QL: the graph of assets, identities, findings, and relationships that feeds security and risk datasets. A major upstream source. |
| Python | The pipeline glue: extraction from sources (JupiterOne API and others), transformation that SQL handles badly, orchestration, validation, and load into Vertica. |
| Alteryx | Downstream consumer tool: risk and other consultants build their own workflows and models on the delivered tables. Not this workspace's tool, but its reader. |
| Tableau | Downstream consumer tool: dashboards built on the delivered tables. Also a reader, not a tool of this desk. |
| Scheduler | Unknown from the description (could be cron, Airflow, or manual runs). Stated as unknown; the workspace owner should fill this in, because half the laws below get teeth from it. |

## 3. The flow of value

Sources (JupiterOne and whatever else the engagement feeds) are pulled by Python, validated, and landed in Vertica; Vertica shapes the landed data into contract tables; the risk team and other consultants pull those tables into Alteryx and Tableau to build models and dashboards for their own clients and activities.

The critical objects in that sentence are the **contract tables**: the named tables or views that downstream teams are promised. Everything upstream of them may be rebuilt freely; the contract tables change only by agreement (law 1).

## 4. The laws of this terrain

1. **The handoff contract comes first.** Before building any pipeline, agree with the consuming team on the table name, the columns with types, the grain (what one row means), the refresh cadence, and the lateness rule (what happens when data is delayed). Why: downstream models break silently on shape changes; a contract makes the break loud and attributable.
2. **A load is not done when it exits zero; it is done when it reconciles.** Every load ends with a printed reconciliation: source count, landed count, rejected count, and the delta explained. Why: a tool reporting success is rung 4 on the evidence ladder; an empty load can exit clean. Print the artifact, not the verdict.
3. **Idempotent loads only.** Running the same pipeline twice must not double the data. Merge or delete-and-reload by partition, never blind append. Why: reruns are not an exception in consulting; they are Tuesday.
4. **Schema changes are announced, never discovered.** Any change to a contract table (column added, renamed, retyped, grain changed) is communicated to every consumer before it lands, with a date. Why: an Alteryx workflow or Tableau extract fails days later with someone else's name on the incident.
5. **Asset and identity data is sensitive by default.** JupiterOne data describes an organization's systems, people, and weaknesses. It never enters alfa memory, logs, or any file outside the client's systems; in alfa terms, this workspace runs with workplace mode's data rule always on, even on a personal machine. Why: the pseudonym law, applied to organizations.
6. **Push the work to the warehouse.** Python moves and validates; Vertica joins and aggregates. A Python loop over millions of rows is a smell. Why: the warehouse is built for it, and the pipeline stays debuggable when each stage does one kind of work.
7. **Test queries on real volume before promising a cadence.** A query that is fine on a sample can be unrunnable at scale on a busy cluster. Why: the refresh promise in the contract (law 1) is only honest if it was measured, not assumed.
8. **Every delivered number is traceable to its source.** From any figure in a downstream dashboard, it must be possible to walk back: which contract table, which load, which source extract, which day. Keep load metadata (run id, source, timestamp, counts) on every landed row or in a run log table. Why: "where did this number come from" is the one question a consultant must never fail in front of a client.

## 5. The council wardrobe for this terrain

The core seats from MEMORY.md that pull the most weight here are the Commander, the Skeptic, and the Keeper. This terrain adds three of its own:

### 5.1 The Contract Keeper
- **Dissects:** every handoff into its promise: table, columns, types, grain, cadence, lateness rule, and who signed for it.
- **Lens:** the downstream consumer's Monday morning. A pipeline is judged by the moment someone opens Alteryx and their workflow either runs or does not.
- **Always asks:** who consumes this and did they agree to its shape; what breaks downstream if this changes; when was the contract last confirmed against what actually ships.
- **Failure mode:** freezing contracts so hard that the warehouse can never improve. Contracts are amended by announcement, not forbidden.

### 5.2 The Lineage Skeptic
- **Dissects:** any delivered number backward: contract table, transformation, landed data, extract, source system, and the day it was pulled.
- **Lens:** every figure is guilty until traced. Aggregates hide their inputs; joins silently drop and silently duplicate.
- **Always asks:** what is the grain here and did the join preserve it; how many rows entered and left each stage, and where is that printed; would we notice if the source quietly sent us half a day.
- **Failure mode:** demanding full lineage tooling on day one. The floor is counts printed per stage and load metadata on rows; the ceiling can wait.

### 5.3 The Volume Warden
- **Dissects:** every pipeline at production scale: data volume, query cost, cluster contention, retry behavior, backfill blast radius.
- **Lens:** what works at ten thousand rows and dies at a hundred million. Scale failures arrive exactly when the work is finally visible.
- **Always asks:** what does this query cost on the real cluster at the real volume; what happens when the API paginates past its rate limit; can this backfill run without starving everyone else.
- **Failure mode:** gold-plating a one-off engagement extract into infrastructure. The Treasurer's question (cheapest experiment that buys the same information) applies to pipelines too.

## 6. Memory seeds

Facts worth writing into memory/ on day one of running this workspace. Each is a seed at rung 3; promote it when this terrain confirms it, delete it if it proves wrong.

- The contract tables and their consumers, one entry each: name, grain, cadence, who signed. Why: this is the map of what must never break silently.
- The J1QL queries that feed each dataset, with what each returns and its typical volume. Why: J1QL is graph-shaped and non-obvious; a working query is a small asset.
- The reconciliation ritual (law 2) as a reusable snippet or function. Why: a law with a copy-paste implementation actually gets followed.
- The scheduler and its failure notification path, once known. Why: a pipeline that fails silently on a machine nobody watches is the classic scar of this terrain.
- Which downstream tools read which tables (Alteryx workflows, Tableau extracts), as far as consumers will say. Why: law 4 is only executable if you know who to announce to.

## 7. The autopsy table (grows forever)

Seed rows: these are the classic failure shapes of this terrain, offered as expected patterns (rung 1, "obvious behavior") until this workspace's own scars replace them. The real table is the one the owner grows.

| # | What happened (expected pattern) | The cheapest test that would have caught it |
|---|---|---|
| S1 | A load exited zero having landed nothing; downstream dashboards showed stale data for days before anyone noticed. | End every load by printing the reconciliation counts (law 2), and alert when landed count is zero or far below the trailing average. |
| S2 | A join changed the grain (one row became three) and an aggregate tripled quietly. | Assert the expected row-count relationship across the join, and print counts before and after every stage. |
| S3 | A source column was renamed upstream; the pipeline dropped it as unknown and filled the contract column with nulls. | Validate the extract against the expected schema at landing time; unknown or missing columns fail the load loudly, never pass through silently. |
| S4 | A rerun after a partial failure doubled a day of data. | Idempotency test on day one: run the load twice on the same window and diff the counts (law 3). |
| S5 | A query tuned on a sample ran for hours on the production cluster during the consumers' busiest morning. | Measure on real volume off-peak before committing to the cadence (law 7). |

## 8. First-session checklist

1. Read PORTABLE_O.md, then this file, then the memory index (MY_LIBRARY.md).
2. Confirm the real date, and which engagement or client context this session is inside.
3. Workplace rules on: no client data, no asset data, no identifying details in any alfa file, regardless of machine setting (law 5).
4. Before touching any pipeline: find its contract entry in memory. No contract entry, no changes; write the contract first.
5. Before claiming any load works: run it and read the printed reconciliation. "Verified" is rung 6 only.

---

*Workspace: data consultant, warehouse pipelines. alfa_o v2.0. Method: Council-Driven Convergence by LEED (leed.life). Parallax and CLAW: devudaaaa Labs (devudaaaa.xyz).*
