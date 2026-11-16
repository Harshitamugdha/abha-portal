# Harshita — update log
*Newest entry at the top. Format: [TEMPLATE.md](TEMPLATE.md). Brief: [`../team/`](../team/README.md).*

---

## [2026-11-16 19:00] Phase 0 (part 1) — Next.js scaffold, folder skeleton, AI policy change

**Done:** Next.js 16.4 app scaffolded at the repo root (TypeScript, Tailwind 4, App Router, `src/`,
`@/*` alias) and the Master §4.3 folder skeleton created (`.gitkeep` in each empty folder). Removed
`cacheComponents` and `partialPrefetching` from `next.config.ts` so caching matches TRAPS §3 and
Vivek's ISR plan. Fixed `.gitignore` (`src/generated/`, `next-env.d.ts`, `*.tsbuildinfo`). Docs:
removed `ai-usage.md` and `syllabus-coverage.md`; D16 changed to "AI writes the code, we review,
own and commit it"; `CLAUDE.md` now tells AI to write simple code and explain why / what / what was
used after every file; every commit is made by hand, never by an agent.

**Files touched:** `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`,
`eslint.config.mjs`, `public/`, `src/app/{layout,page}.tsx`, `src/app/globals.css` (new) ·
skeleton folders under `src/app/`, `src/server/`, `src/components/ui/`, `prisma/` (new) ·
`.gitignore`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/00_MASTER_PLAN.md`, `docs/CONTRACTS.md`,
`docs/README.md`, `docs/LEARNING.md`, `docs/team/*`, `docs/updates/TEMPLATE.md`,
`src/contracts/README.md`, `.github/PULL_REQUEST_TEMPLATE.md` (modified) ·
`docs/operations/ai-usage.md`, `docs/evaluation/syllabus-coverage.md` (deleted)

**Run command:**
```bash
npm install && npm run dev
```
Open http://localhost:3000 → Next.js starter page.

**Access check:** n/a (no auth yet)

**Demo steps enabled:** none yet

**Learned:** `create-next-app` refuses a non-empty folder, so scaffold in a temp folder and copy in;
and Next 16's `cacheComponents` flag bans `export const revalidate`, which would have broken the ISR plan.

**AI used:** code: folder skeleton and config fixes · review: checked the scaffold and flagged
`cacheComponents`, Node version and `.gitignore` gaps · docs: AI-policy and commit-rule edits.

**Open issues:**
- Node is still v24.22; project requires 22. `nvm use 22`, delete `node_modules` +
  `package-lock.json`, `npm install` again so the lockfile matches CI/Vercel.
- Starter `src/app/page.tsx` will clash with Vivek's `(public)/page.tsx`; he deletes it in Phase 7.
- Tell Vivek about the D16 change (AI writes code) and that he can clone now.
- Confirm INT257 allows AI-written code in project work.

**Next:** Phase 0 step 0.4 — Prisma 7 install, `prisma.config.ts`, `schema.prisma` from
CONTRACTS §2, `db.ts`, first migration.

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
