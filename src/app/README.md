# src/app — every screen, plus the Route Handlers

Owners per route below (H = Harshita, V = Vivek). Backend rules live in
[`../server/README.md`](../server/README.md). Where code goes (Master D22): **Server Components
read, Server Actions write, Route Handlers** for auth, client-side React Query reads, files and health.

## Non-negotiable
- **Pages never query `prisma`.** A Server Component calls a data function from `src/server/<domain>/`.
- **Every Server Action starts with** `const user = await requireSession()`, then Zod-parses its
  input, then calls a data function (which calls `authorize()`). A Server Action is a public endpoint
  (TRAPS §2). It returns `ActionResult<T>`; it never throws to the client.
- **Only `(public)/` is cached.** `patient/`, `doctor/`, `lab/`, `pharmacy/`, `admin/` read the session
  in their layout and are always dynamic. `"use cache"`, `revalidate` exports and ISR are for
  `(public)/` only (TRAPS §3).
- **`'use client'` files never import from `src/server/`** (TRAPS §18). They get data from props, a
  Server Action, or a Route Handler.
- **Three states, always distinct:** `CONSENT_REQUIRED` → `<ConsentRequired/>` with a request button ·
  empty `items` → `<EmptyState/>` · data → the list (TRAPS §4).
- Dates through `formatIST()`, ABHA through `formatAbha()`, both from `@/contracts/format`.
- No `localStorage`/`sessionStorage`. The session is the `portal_session` httpOnly cookie.

## Route map
```
src/app/
├─ (public)/                 page.tsx (landing) · institutions/ + [id]/ (ISR, revalidate 3600)    V
├─ (auth)/                   login/ (ABHA) · login/otp/ · staff/login/ (redirects by role)         H
├─ patient/                  layout.tsx (role gate) · page.tsx (dashboard)                          V
│  ├─ records/               page.tsx (timeline, searchParams filters) · [id]/page.tsx              V
│  ├─ @modal/(.)records/[id]/  intercepted detail modal                                            V
│  ├─ upload/                form → uploadDocument                                                  V
│  ├─ consents/              Consent Center → approve/deny/revoke actions                           H
│  └─ access-log/            who viewed my records                                                  H
├─ doctor/                   layout.tsx · dashboard with @pending + @recent                         V
│  ├─ patients/              search by ABHA                                                         V
│  └─ patients/[patientId]/  viewer (React Query) · request-consent/ · encounter/ · prescribe/ · lab-order/  V
├─ lab/                      pending orders · orders/[orderId]/ (upload result)                     V
├─ pharmacy/                 share-code form · rx/[code]/ (prescription + dispense)                 H
├─ admin/                    staff/ (verify) · audit/ (filters in searchParams) · institutions/ (create/edit)  H
└─ api/v1/                   auth/ · consents/latest · health/ (Edge)                               H
                             patients/[patientId]/records · patients/lookup · patients/[id]/summary
                             records/[id] · files/[id]                                              V
```
Every segment that fetches gets a `loading.tsx` and an `error.tsx`. `error.tsx` renders
`CONSENT_REQUIRED` as the consent state, not as a generic error.

## UI conventions
- Tailwind only; tokens in `app/globals.css`. No raw hex in components.
- Shared components in `src/components/ui/` (Button, Card, Badge, EmptyState, ConsentRequired,
  RecordCard). Check there first; tell the other person when you add one.
- Forms: Zod schema from `@/contracts`, field errors under the field, submit disabled while pending.
- Accessibility: every input has a `<label>`, every icon button an `aria-label`, focus visible.

## Performance and SEO (INT257 Unit V)
`next/image` for every image. `generateMetadata` on public pages. `next/dynamic` for the PDF viewer
(only loaded when a lab report is opened).
