# Learning path

What to read **before** you write each phase, in official docs. Read the section so you can review and
explain the AI-written code for that phase. "Search for" means use the search box
on that docs site. Phase numbers match your brief.

Course text (INT257 syllabus): *Modern Web Applications with Next.js*, Shubham Jain and Mathew Dony.

---

## Both of you, before day 1
| Topic | Where |
|---|---|
| React fundamentals: components, props, state, effects | [react.dev/learn](https://react.dev/learn) (the whole "Learn" track) |
| Next.js App Router basics | [nextjs.org/learn](https://nextjs.org/learn) dashboard course: routing, data fetching, Server Actions |
| Server vs Client Components | Next.js docs: search "server and client components" |
| Tailwind | [tailwindcss.com/docs](https://tailwindcss.com/docs): utility-first, responsive design |
| Zod | [zod.dev](https://zod.dev): basic usage, objects, `safeParse`, error formatting |
| Our rules | [`00_MASTER_PLAN.md`](00_MASTER_PLAN.md) Parts 1–5, [`TRAPS.md`](TRAPS.md) |

---

## Harshita
| Phase | Read | Where |
|---|---|---|
| 0 App, schema, seed | `create-next-app` options; Prisma schema, relations, enums, migrations, seeding; **Upgrade to v7** guide (config file, generator output, driver adapter) | Next.js docs: search "installation" · [prisma.io/docs](https://www.prisma.io/docs) |
| 0 Contracts | Zod enums, `z.infer`, refinements | [zod.dev](https://zod.dev) |
| 1 Mock ABHA | TypeScript interfaces; `Map` with expiry timestamps | [TypeScript handbook: object types](https://www.typescriptlang.org/docs/handbook/2/objects.html) |
| 2 Sessions | Cookies (`HttpOnly`, `Secure`, `SameSite`); JWT sign/verify with `jose`; Next.js `cookies()` | [MDN: Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) · [jose](https://github.com/panva/jose) · Next.js docs: search "cookies" |
| 2 Proxy | Next.js 16 `proxy.ts`, matchers | Next.js docs: search "proxy" |
| 3 authorize() | Role-based vs attribute-based access; deny by default | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) |
| 3 Tests | Vitest basics, `test.each` for table tests | [vitest.dev/guide](https://vitest.dev/guide/) |
| 4 Consent | Server Actions + returning errors to forms; Prisma transactions, date comparisons in `where` | Next.js docs: search "updating data" · Prisma docs: search "transactions", "filtering" |
| 5 Screens | `useEffect` cleanup; custom hooks; `useActionState` for form errors | [react.dev: useEffect](https://react.dev/reference/react/useEffect) · [react.dev: custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) · [react.dev: useActionState](https://react.dev/reference/react/useActionState) |

## Vivek
| Phase | Read | Where |
|---|---|---|
| 0 Shells | Layouts, `page.tsx`, route groups; Zod for your own DTOs | Next.js docs: search "layouts and pages", "route groups" · [zod.dev](https://zod.dev) |
| 1 Records API | Route Handlers; `searchParams`; Prisma `findMany` with `skip`/`take`/`orderBy`, `count` | Next.js docs: search "route handlers" · Prisma docs: search "pagination" |
| 2 Uploads | Server Actions, `FormData`, `revalidatePath`; `serverActions.bodySizeLimit`; uncontrolled inputs | Next.js docs: search "updating data", "bodySizeLimit" · [react.dev: `<input>`](https://react.dev/reference/react-dom/components/input) |
| 3 Doctor viewer | React Query `useQuery`, query keys, refetch on window focus, error handling; `useMemo`; `next/dynamic` | [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) · [react.dev: useMemo](https://react.dev/reference/react/useMemo) · Next.js docs: search "lazy loading" |
| 4 Clinical writes | Controlled forms with dynamic rows; updating arrays in state; `useOptimistic`; Prisma transactions | [react.dev: updating arrays in state](https://react.dev/learn/updating-arrays-in-state) · [react.dev: useOptimistic](https://react.dev/reference/react/useOptimistic) |
| 5 Lab | Server Actions with files; transactions | Next.js docs: search "updating data" |
| 6 Routing extras | `loading.tsx`, `error.tsx`, parallel routes (`@slot`), intercepting routes (`(.)`) | Next.js docs: search "error handling", "parallel routes", "intercepting routes" |
| 7 Public pages | ISR / `revalidate`, `generateStaticParams`, `generateMetadata`, `next/image` | Next.js docs: search "ISR", "metadata", "image" |
| 8 i18n + Lighthouse | Internationalization in the App Router; reading a cookie on the server; Lighthouse audits | Next.js docs: search "internationalization" · [Chrome: Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) |

## Ravuri
| Phase | Read | Where |
|---|---|---|
| 0 Schemas + first deploy | Zod objects and enums; deploying Next.js to Vercel; environment variables | [zod.dev](https://zod.dev) · Next.js docs: search "deploying", "environment variables" |
| 1 Pharmacy | Dynamic segments (`[code]`); `notFound()` | Next.js docs: search "dynamic routes", "notFound" |
| 2 Admin | `searchParams` for URL-driven filters and paging | Next.js docs: search "searchParams" |
| 2 Admin forms | Server Actions with `useActionState`; Prisma `create` / `update` | [react.dev: useActionState](https://react.dev/reference/react/useActionState) · Prisma docs: search "CRUD" |
| 3 Platform | Edge runtime limits; logging in route handlers | Next.js docs: search "edge runtime", "route handlers" |
| 4 CI | GitHub Actions workflows, service containers for Postgres | [GitHub Actions docs](https://docs.github.com/actions) |
| 5 Production | Prisma `migrate deploy` in production; Vercel logs and analytics | Prisma docs: search "deploy migrations" · Vercel docs: search "logs" |

---

## How to study one topic (30–60 minutes)
1. Read the docs section once, fully.
2. Build the smallest possible version in a scratch file, not the project.
3. Break it on purpose (remove the cleanup, drop the query key, skip `authorize()`) and watch what happens.
4. Write one line in your update log under **Learned**: what surprised you.
5. Now build the real feature.
