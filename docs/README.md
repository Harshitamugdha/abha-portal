# Documentation index

The ABHA portal lets patients sign in with ABHA and lets doctors read records from every
participating institution, but only under a scoped, time-bound consent the patient controls. This
directory holds the plan, the contracts, the design, the team briefs and the history.

**If you read nothing else:** [`00_MASTER_PLAN.md`](00_MASTER_PLAN.md) Parts 1–5, then
[`TRAPS.md`](TRAPS.md).

---

## Reading paths

**New to the project, about 30 minutes.**
[`00_MASTER_PLAN.md`](00_MASTER_PLAN.md) Parts 1–5 → [`architecture/README.md`](architecture/README.md)
→ your brief in [`team/`](team/README.md) → your reading list in [`LEARNING.md`](LEARNING.md)
→ the `README.md` in the folder you'll work in →
[`TRAPS.md`](TRAPS.md) → [`../CONTRIBUTING.md`](../CONTRIBUTING.md) before your first PR.

**Examiner / teacher.**
[`../README.md`](../README.md) → [`architecture/README.md`](architecture/README.md) →
[`../SECURITY.md`](../SECURITY.md) (what's guaranteed, where,
and how it's tested).

**Resuming your own work.**
Your log in [`updates/`](updates/): read the top entry and start from its **Next** line. Then your
brief in [`team/`](team/README.md).

**Learning a topic before you build it.** [`LEARNING.md`](LEARNING.md): official docs per person
per phase. AI writes the code (Master D16); you review it and can explain it. Every commit is
made by hand, never by an AI agent.

**Running the demo.** [`operations/demo-runbook.md`](operations/demo-runbook.md).

---

## The live contract
These are cited from code comments. **Their paths don't change.**

| Document | What it is |
|---|---|
| [`00_MASTER_PLAN.md`](00_MASTER_PLAN.md) | Single source of truth: scope, demo story, seed data, architecture, frozen conventions, ownership, dependencies, decision log. |
| [`CONTRACTS.md`](CONTRACTS.md) | Error codes, data model, `authorize()` policy matrix, every endpoint, session shape. Readable copy of `src/contracts/`; **the code wins** if they disagree. |
| [`TRAPS.md`](TRAPS.md) | The bugs that actually happen. Most of them run fine and show the wrong person the wrong data. |

Contracts are frozen. Changing one is its own PR (see [`../src/contracts/README.md`](../src/contracts/README.md)).

## Architecture
| Document | What it covers |
|---|---|
| [`architecture/README.md`](architecture/README.md) | The one-boundary design and why; a request end to end; one app with three entry points; data model diagram; what we deliberately don't build. |
| [`architecture/identity-and-consent.md`](architecture/identity-and-consent.md) | ABHA sign-in flow, sessions, consent state machine, the decision function, audit, what would change for real ABDM. |

Domain design for records, clinical, lab, pharmacy and admin lives in the briefs, next to the tasks.

## Operations
| Document | What it covers |
|---|---|
| [`operations/demo-runbook.md`](operations/demo-runbook.md) | Night-before checklist, the 11-step click path, seven access checks, what to do when something breaks. |

## The team
[`team/README.md`](team/README.md) maps each person to their brief, code, log and demo steps.
Briefs: [`harshita.md`](team/harshita.md) · [`vivek.md`](team/vivek.md).

## Work logs
[`updates/`](updates/): one file per person, newest entry at the top, appended after every phase
using [`updates/TEMPLATE.md`](updates/TEMPLATE.md). [`updates/_INTEGRATION.md`](updates/_INTEGRATION.md)
records every seam event. Logs are append-only.

## Learning
| Document | What it covers |
|---|---|
| [`LEARNING.md`](LEARNING.md) | What to read in the official docs before each phase, per person, plus a 30–60 minute study routine. |

## Folder rules
Each code folder has a `README.md` with the rules for working in it:
[`src/app/`](../src/app/README.md), [`src/server/`](../src/server/README.md),
[`src/contracts/`](../src/contracts/README.md).
The root [`CLAUDE.md`](../CLAUDE.md) tells AI tools how to write code in this repo and which rules
that code must follow.
