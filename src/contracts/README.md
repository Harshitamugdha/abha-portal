# src/contracts — the executable contract

Imported as `@/contracts/...` by Server Components, Server Actions, Route Handlers **and** client
components. Readable copy: `docs/CONTRACTS.md`. **If they disagree, this folder wins and the doc is
the bug.**

## Who writes what (D18)
Each of you owns **your own** schemas (AI-written, D16), and the other reviews.

| File | Writer |
|---|---|
| `shared.ts`: enums, error codes, `ApiErrorBody`, `ActionResult<T>`, `SessionUser`, `Page<T>` | Harshita |
| `format.ts`: `formatIST`, `formatAbha`, `maskAbha`, `parseAbhaInput` | Harshita |
| `auth.ts`, `consent.ts`, `audit.ts` | Harshita |
| `records.ts`, `clinical.ts`, `lab.ts` | Vivek |
| `pharmacy.ts`, `admin.ts` | Ravuri |

Day 2: Harshita merges `shared.ts` + `format.ts`. Vivek adds his three files in his Phase 0; Ravuri adds his two in his Phase 0. Agree
`ConsentRequest` (in `consent.ts`) together on day 1, since Vivek's form sends it.

## What lives here
- Zod schemas for every request body, query, Server Action input and response DTO
- Enums mirroring `schema.prisma`
- Pure helpers (`format.ts`)
- Inferred types: `export type ConsentDTO = z.infer<typeof ConsentDTO>`

## What never lives here
- Anything that imports Prisma, `next/*`, `src/server/` or Node APIs. Client components import this
  folder, so it must run in the browser.
- Business logic. "Is this consent active" belongs in `src/server/consent/`.

## Changing a schema after it's merged
1. A PR that touches only this folder + `docs/CONTRACTS.md` (+ `prisma/schema.prisma` if the DB changes).
2. Harshita (contract keeper) and anyone whose code uses the shape approve before any code relies on it.
3. A line in `CHANGELOG.md` marked **[contract]**.
4. **Never** loosen a schema (`.passthrough()`, `z.any()`, optional-everything) to make a failing
   response pass. The failure is telling you the producer is wrong.

## Tests
One valid and one invalid example per DTO, next to its file (`records.test.ts` etc.).
`format.test.ts`: `formatIST` across a UTC midnight boundary, `formatAbha` round trip,
`parseAbhaInput` accepting a number (with or without hyphens) and an address.
