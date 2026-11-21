# CLAUDE.md — how AI tools help in this repo
*Claude Code reads this automatically. With any other AI tool, paste it at the top of a new chat.
This file is about **how AI is allowed to help**. The project rules for people are in
`CONTRIBUTING.md`, `docs/00_MASTER_PLAN.md` Part 5, and the `README.md` in each folder.*

## Read this first, AI
This is a **course project (INT257, Next.js)**. Your job is to **write the code**: components,
pages, route handlers, Server Actions, data functions, schemas, seed and tests, following the
plan in `docs/` and the rules below. Students review what you write and present it in a viva.

### What you do
- **Build:** implement the phase or feature asked for, end to end, in the files the plan names
  (`docs/team/<person>.md`, Master §4.3 layout). Match `docs/CONTRACTS.md` exactly.
- **Test:** write the tests the phase lists (Vitest) and run `npm run check` before saying done.
- **Write simple, human-like code.** The plainest version that works: clear names, small
  functions, straightforward control flow, short comments only where the *why* isn't obvious. No
  clever one-liners, needless abstractions, or generic helpers nobody asked for. Simplicity never
  overrides the protocols: `authorize()`, session + Zod checks, field-by-field DTOs, error codes,
  tests and the rules below stay in. **Test:** could a student explain every line in the viva?
  If a line needs more than a sentence to explain (type tricks, inline conditional spreads,
  chained one-liners), rewrite it in plain steps, even if it gets longer.
- **Explain after every component or file.** Once it's written, explain it in three parts:
  1. **Why** it exists: which phase/feature needs it and what breaks without it.
  2. **What** you did: walk through how it works, step by step, in plain language.
  3. **What was used:** the APIs, libraries, Next.js/React features and patterns (e.g. Server
     Action, `useEffect` cleanup, Prisma transaction, Zod schema), and which TRAPS item it avoids.

  Keep it short enough that the owner can repeat it in the viva.
- **Debug and review:** find the cause of failures and fix them; check code against the rules
  below and `docs/TRAPS.md`.

### What you don't do
- Don't change a contract in `src/contracts/` or `docs/CONTRACTS.md`, or the Prisma schema's shape,
  without saying so first. Harshita, Vivek and Ravuri all depend on them.
- Don't add dependencies beyond what the plan names without asking.
- Don't "fix" a failing check by loosening it (`z.any()`, removing an `authorize()` call,
  catching and ignoring an error).
- **Don't commit, push, or open PRs.** Every commit is made by hand by a student. Give the `git`
  commands for them to run; never run `git commit`/`git push` yourself.

## Project in five lines
Unified health-record portal (problem statement G4). Patients log in with ABHA (mocked, D1);
doctors read a patient's records from every participating institution **only under an active,
scoped, time-bound consent**; pharmacy, lab and admin each get a narrow slice. **One Next.js 16 app
at the repo root** holds every screen and the whole backend (no separate React app). Team of four;
Harshita (identity, access, consent, audit), Vivek (records, patient and doctor portals, lab) and
Ravuri (pharmacy, admin, deployment, CI) write the code.
Full context: `docs/00_MASTER_PLAN.md`.

## Rules every line of code follows
1. **Every read/write of patient data goes through `authorize()`** in
   `src/server/auth/authorize.ts`. Pages, Route Handlers and Server Actions never call
   `prisma` for clinical tables; they call a data function in `src/server/<domain>/`.
2. `proxy.ts` is a coarse redirect gate, **not** the security check (TRAPS §1).
3. Every Server Action starts with `requireSession()` + `authorize()` + Zod parse (TRAPS §2).
4. Doctor without consent → `403 CONSENT_REQUIRED`, rendered as "Consent required", **never** as
   an empty list. Non-doctors who can't see something → `404` (D10).
5. Nothing under `patient/`, `doctor/`, `lab/`, `pharmacy/` or `admin/` is cached (TRAPS §3).
6. Responses are built field by field; never spread a Prisma row (TRAPS §17).
7. Timestamps UTC/`Z` in the API, shown with `formatIST()`. ABHA shown with `formatAbha()`.
8. No tokens in `localStorage`/`sessionStorage`.
9. Shapes come from `src/contracts/` (Zod).
10. Versions: Node 22, Next.js 16 (`proxy.ts`, not `middleware.ts`), Prisma 7 (`prisma-client`
    generator with `output`, `prisma.config.ts`, `@prisma/adapter-pg`). Older tutorials are wrong here.
11. Nothing under `src/server/` is imported into a `'use client'` file (TRAPS §18).

## Where the detail is
- Folder rules: `src/app/README.md`, `src/server/README.md`, `src/contracts/README.md`. Read the one
  for the folder you're helping in.
- Contracts: `docs/CONTRACTS.md`. Known bugs: `docs/TRAPS.md`.
