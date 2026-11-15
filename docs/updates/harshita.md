# Harshita — update log
*Newest entry at the top. Format: [TEMPLATE.md](TEMPLATE.md). Brief: [`../team/`](../team/README.md).*

---

## [2026-11-15 18:45] Phase −1 (v2.1) — correction: team of four, full scope

**Done:** Corrected v2. The team is still Harshita, Vivek, Madhav and Ravuri; Harshita and Vivek
build the app. Full v1 scope restored: Master Part 12 is now a build order, not a cut line. Added
back to the briefs: OTP rate limit, duplicate consent requests, institution create/edit, Edge health
route and a CI phase (Harshita); encounter form, optimistic prescription, intercepting modal,
parallel dashboard, Hindi/English and Lighthouse (Vivek).

**Files touched:** `docs/00_MASTER_PLAN.md`, `docs/CONTRACTS.md`, `docs/team/*`, `docs/LEARNING.md`,
`docs/evaluation/syllabus-coverage.md`, `src/app/README.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
`CHANGELOG.md`, `docs/updates/_INTEGRATION.md`

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Learned:** —

**AI used:** review: updating the docs for the correction.

**Open issues:**
- Start and demo dates still blank in the Master header.
- Repo is local only: needs a GitHub remote before Vivek can clone.

**Next:** Phase 0: `create-next-app` at the repo root, Prisma schema + seed, shared contracts, auth
stubs. Deadline end of day 2.

## [2026-11-15 18:30] Phase −1 (v2) — pure Next.js, team of two, work reassigned

**Done:** Restructured the plan for two changes: the React/Vite console is gone (one Next.js app at
the repo root, D20) and Madhav and Ravuri are off the project (D21). Madhav's doctor portal went to
Vivek; Ravuri's pharmacy, admin and deployment came to me. Master plan v2, contracts v2 (cookie-only
session, Server Components read / Server Actions write / Route Handlers for auth + client reads,
D22), new briefs `team/harshita.md` and `team/vivek.md`, scope re-cut for two (Master Part 12),
INT257-only syllabus coverage. Repo initialised with the docs in place.

**Files touched:** every doc · `src/app/README.md`, `src/server/README.md`, `src/contracts/README.md`
(moved from `apps/` and `packages/`) · removed Madhav/Ravuri briefs and logs, console README

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Learned:** —

**AI used:** review: restructuring and consistency-checking the docs.

**Open issues:**
- Tell the INT257 teacher the team is now two and the console is gone (Master Part 13).
- Start and demo dates still blank in the Master header.
- Repo is local only: needs a GitHub remote before Vivek can clone.

**Next:** Phase 0: `create-next-app` at the repo root, Prisma schema + seed, shared contracts, auth
stubs. Deadline end of day 2.

## [2026-10-19 15:10] Phase −1 (rev) — docs revised for hand-written code

**Done:** Reframed the documentation set for a team that writes code by hand and uses AI only for
debugging, review and learning (D16). Root `CLAUDE.md` now tells AI tools to act as tutor and
reviewer, not author; per-folder `CLAUDE.md` files became `README.md` for humans; the prompting
playbook became `operations/ai-usage.md`; added `LEARNING.md` (official-docs reading list per
person per phase). Scope adjusted for hand-coding: a Must/Should/Could cut line (Master Part 12),
offset pagination (D17), each owner writes their own Zod schemas (D18), bcryptjs instead of
argon2 (D19). Update-log template gained **Learned** and **AI used** lines; PR template gained
an explain-every-line checkbox.

**Files touched:** `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `.github/PULL_REQUEST_TEMPLATE.md` ·
`apps/*/README.md`, `packages/contracts/README.md` (renamed from CLAUDE.md) ·
`docs/00_MASTER_PLAN.md`, `docs/CONTRACTS.md`, `docs/README.md`, `docs/LEARNING.md` (new),
`docs/operations/ai-usage.md` (new, replaces prompting-playbook), `docs/team/*`, `docs/updates/TEMPLATE.md`,
`docs/architecture/*`

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Learned:** —

**AI used:** review: drafting and consistency-checking the documentation.

**Open issues:**
- Same as previous entry: teachers' confirmation on D1/D2, lab module owner, start and demo dates.
- Team hasn't yet agreed the cut line (Master Part 12): walk through it at kickoff.

**Next:** Kickoff: walk the team through Master Parts 2, 7, 8, 12, then Phase 0.

## [2026-10-19 14:30] Phase −1 — system design + documentation set

**Done:** System design agreed: two apps (Next.js web + Vite console), one backend, `authorize()`
as the single security boundary, scoped time-bound consent, mock ABHA provider (D1). Wrote the
master plan, contracts, traps, four team briefs, per-directory CLAUDE.md files and templates,
modelled on the Udgam repo layout.

**Files touched:** `docs/**` (new) · `CLAUDE.md`, `README.md`, `QUICKSTART.md`, `CONTRIBUTING.md`,
`SECURITY.md`, `.env.example`, `.github/*` (new) · `apps/*/CLAUDE.md`, `packages/contracts/CLAUDE.md` (new)

**Run command:** none yet: no code.

**Access check:** n/a

**Demo steps enabled:** none yet

**Open issues:**
- Teachers have not yet confirmed two apps in one repo (D2) or a mocked ABHA login (D1).
- Lab module owner (Vivek vs Ravuri) not settled; currently Vivek.
- Start date and demo date not filled in Master header.

**Next:** Phase 0: workspaces, Next.js app, Prisma schema + seed, contracts stubs,
`getSession`/`authorize` stubs. Deadline end of day 2.
