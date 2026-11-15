# Changelog

Newest first. One entry per merged phase that changes what a user can do, or what a contract says.
Contract changes are marked **[contract]**.

## Unreleased
- **v2.1 (15 Nov 2026):** team is four (Harshita, Vivek, Madhav, Ravuri), Harshita and Vivek build; full scope restored, Master Part 12 is a build order, not a cut line. **[contract]** `createEncounter`, `createInstitution`, `updateInstitution` back in.
- **v2 (15 Nov 2026):** pure Next.js, one app at the repo root (D20); console app, bearer tokens and CORS removed; Madhav's and Ravuri's planned work reassigned to Harshita and Vivek (D21); entry-point rule (D22).
- **[contract]** Session is cookie-only; `StaffLoginRequest` loses `client`, gains `redirectTo` in the response. Server Actions return `ActionResult<T>`. Contracts live in `src/contracts/`.
- Docs revised for hand-written code: AI policy (D16), `LEARNING.md`, cut line (Master Part 12), folder `README.md`s replace per-folder `CLAUDE.md`.
- **[contract]** List endpoints use offset pagination `{ items, page, pageSize, total }` (D17).
- **[contract]** Domain owners write their own schemas in the contracts package (D18).
- Documentation set, master plan v1, contracts v1, team briefs.
