# Contributing

Everything below is how this project already works, collected in one place. The authoritative
sources are [`docs/00_MASTER_PLAN.md`](docs/00_MASTER_PLAN.md) and the `README.md` in each
code folder.

---

## The rule that governs everything
**Every read or write of patient data goes through `authorize()`**, which also writes the audit
row. Pages, Route Handlers and Server Actions call data functions in
`src/server/<domain>/`, never `prisma` directly for clinical tables.

It exists so Harshita and Vivek can build in parallel, and so one person's shortcut can't
open a hole in another person's feature.

---

## Frozen conventions
1. All patient data through `authorize()`.
2. Doctor without consent → `403 CONSENT_REQUIRED`; everyone else who can't see it → `404`.
   Never render consent-required as an empty list.
3. UTC in the database, ISO 8601 with `Z` in the API, `formatIST()` on screen.
4. ABHA number stored as 14 digits, shown via `formatAbha()`. Fake range `91-1000-0000-xxxx` only.
5. One error shape: `{ error: { code, message, details? } }`.
6. Shapes come from `src/contracts/`. Changing one is its own PR, approved by the other person.
7. No tokens in browser storage.
8. Node 22, Next.js 16, Prisma 7. New dependency = pinned + justified in the PR + announced.

---

## Branches and PRs
- One branch per person per phase: `harshita/p3-authorize`, `vivek/p2-upload`.
- Push daily, even unfinished (draft PR). A laptop failure should cost hours, not days.
- PR to `main`, **reviewed by the other person**. Harshita merges. PRs touching `prisma/` or
  `src/contracts/` are reviewed before either of you builds on them.
- Fill in the PR template. Every box is there because skipping it broke something.
- Rebase on `main` before asking for review; don't merge `main` into your branch repeatedly.

## Before you open a PR
```bash
npm run check
```
Must pass. Then the **access gate**: your feature works as the right role and fails correctly as
a wrong role, with `DEV_FAKE_USER` unset.

## Commit messages
`<area>: <what changed>`, for example `consent: narrow scopes on approve`, `pharmacy: dispense 409 state`.

**Every commit is made by hand.** You run `git add`, `git commit` and `git push` yourself. No
commits, pushes or PRs are made by an AI agent; an agent may only suggest the commands.

---

## Working rules
- **Stub first.** Right shape, fake data, then logic.
- **One pasteable command per handover**, plus the demo step it enables.
- **45-minute rule** on tooling, auth, deploy: post what you tried + exact error + minimal repro.
- **Never hand-edit the database** to make a screen work. Fix `seed.ts` or the code.
- **Log every phase** in `docs/updates/<you>.md` ([template](docs/updates/TEMPLATE.md)).
- **Read before you write.** Each phase has a reading list in [`docs/LEARNING.md`](docs/LEARNING.md).

## Code is written by hand
We're learning React and Next.js, and each of us explains our code in the viva (Master D16).
- **You can explain every line you commit.** If you can't, it isn't done.
- Snippets from anywhere (AI, Stack Overflow, a tutorial) are **retyped from understanding**, never pasted.
- AI tools are optional and only for **debugging, review and learning**. The root `CLAUDE.md`
  makes Claude Code act as a tutor rather than an author.
- **Commits are made by hand**, never by an AI agent.
- Every PR says what AI was used for (`none` is a perfectly good answer).

## The honesty rule
This is a health-data project. No real ABHA numbers, names or medical documents, in seeds,
screenshots, tests or the demo. If a screenshot will go in the report, take it with seed personas.
