# Nodal

An animated electronics store: catalog, search, filters, product pages, compare, cart, checkout and order pages.
**It is a demo.** Products are fictional, no payments are taken and nothing ships.

## Run

```bash
npm install
npx prisma migrate deploy && npm run db:seed   # SQLite at prisma/dev.db
npm run dev        # http://localhost:3103
npm run build && npm run start
npm run test:api   # backend tests
```

## What is real

- Next.js 16 (App Router), React 19, Tailwind v4, TypeScript.
- Backend: route handlers under `src/app/api`, Prisma + SQLite. Orders validate stock atomically and recompute totals on the server. See `docs/BACKEND_NOTES.md`.
- Frontend: `src/app`, `src/components`, `src/lib`. All site-wide data lives in `src/lib/site.ts`. See `docs/FRONTEND_NOTES.md`.

## What is demo

- Catalog, specs and prices are invented. There is no payment step and no email is sent.
- Order status always reads "placed"; the later steps are shown as pending.
