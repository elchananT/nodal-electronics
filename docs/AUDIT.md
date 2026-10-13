# Nodal - independent audit (2026-10-13)

Method: source read-only. Build, tests and probes ran against a copy of the repo in a scratch dir (own SQLite DB, own server on port 3123, now stopped). The supervisor server on 3103 and the real `prisma/dev.db` were not touched, so no re-seed was needed there. Lighthouse and 60 fps scroll checks were NOT run.

## 1. API vs contract

| # | Check | Result | Evidence |
|---|---|---|---|
| 1.1 | Six contract routes exist, no extras | PASS | `find src/app/api -name route.ts` gives exactly 6; GET /api/orders, DELETE /api/products and GET /api/assistant return 405 |
| 1.2 | GET /api/products shape, facets, pagination | PASS | `total,page,pageSize,items,facets{categories[{slug,name,count}],priceMin:6900,priceMax:189900}`; 16 items, counts 3/3/2/2/2/1/3 |
| 1.3 | Filters: category, q, min/maxPrice (cents), inStock, sort incl. battery | PASS | `q=ring` returns Loop ring; `minPrice=10000&maxPrice=20000&inStock=true` returns 4 items, all in range; `sort=battery` returns longest first, products without battery last |
| 1.4 | pageSize cap | DEVIATION | cap is 48, but `pageSize=9999` returns 400 ("must be between 1 and 48") rather than clamping. Defensible, and the contract is silent. |
| 1.5 | Bad params validated | PASS | sort=bogus, page=0 and category=nope all return 400 `{error,details[]}` |
| 1.6 | Product detail + related | PASS | halo gives related `[pebble-buds, cairn-speaker]` (same category, max 4); unknown slug gives 404 `{error:"Product not found"}` |
| 1.7 | Product shape fields | PASS | all contract fields present; `compareAtCents` absent on every product; battery `{hours}` and weightGrams present |
| 1.8 | Catalog: 16 products, 4 featured, 2 New, 1 Low stock | PASS | featured = ridge-12, meridian-14, halo, aperture-mini; New = loop-ring, hearth-hub; Low stock = vault-ssd (stock 3) |
| 1.9 | cart/price with unknown product and over-stock line | PASS | unknown goes to `dropped` with "Product not found"; vault-ssd x9 dropped with "Only 3 of Vault SSD 2 TB left in stock"; empty items, missing items and bad JSON return 400 |
| 1.10 | Shipping rules | PASS | standard $6.90 on a $69 cart; $0 on a $129 cart; express $18; `src/server/pricing.ts:15` uses strict `>` 7500 (an exact-$75 cart gets $6.90) |
| 1.11 | Order totals recomputed server-side | PASS | a POST with bogus `priceCents`, `unitPriceCents`, `price`, `total`, `totalCents` and `subtotalCents` of 1 returned subtotal 6900, shipping 690, total 7590 |
| 1.12 | Order validation (400) | PASS | missing fields lists all 9 issues; empty items, malformed JSON, unknown product, negative quantity and bad method all return 400 |
| 1.13 | Stock conflict (409) | PASS | qty 99 returns 409 with `details[{productId,slug,name,requested,available}]` |
| 1.14 | Order id format and GET order | PASS | ids look like `NDL-YNDDNBA40O`; generated with `crypto.randomInt` (checkout.ts:68), 36^10 space; unknown id returns 404 |
| 1.15 | Concurrency | PASS | 5 parallel POSTs, qty 3 each (the Low-stock product has stock 3): results 201,409,409,409,409; stock went 3 to 0. Test suite also has a concurrent-checkout test. |
| 1.16 | Assistant: 11 probes | PASS with notes | Real products and prices only: "under $100" gives Slab $69 and Hearth $99; "waterproof camera" gives Orbit $329; "headphones under $200" gives Pebble Buds $129 and Cairn $149; gibberish gives the fallback with /shop; empty returns 400; 5000+ chars returns 400 (max 500); "laptop with 32GB under $1000" gives an honest "nothing under $1000"; the injection string is only keyword-matched ("Halo" from the input) and nothing was echoed or invented; no LLM. |
| 1.17 | Assistant answer quality | DEVIATION | (a) "headphones under $200" returned Pebble Buds and Cairn Speaker, a speaker rather than headphones. (b) "best battery life" returns Halo (40 h), Ridge 12 (48 h) and Meridian 14 (18 h), skipping Kite (2160 h), Loop ring (144 h), Tern (120 h) and Ridge 12 Pro (52 h), so the ranking is not by hours. No fabrication, but not "longest first" either. (c) A query naming a real brand ("Sony headphones") is silently answered with generic audio products. |
| 1.18 | Low stock badge at stock 0 | DEVIATION | after the last unit sold, vault-ssd still shows `badge:"Low stock"` with stock 0 (seed badge is static). Should read out of stock. |
| 1.19 | Error leakage | PASS | error bodies are `{error,details}` only; no stack traces seen |
| 1.20 | Order with unknown product | DEVIATION | /api/orders returns 400 for an unknown productId. cart/price drops it. Sensible, but different from the cart behaviour. |

## 2. Honesty rules

| # | Check | Result | Evidence |
|---|---|---|---|
| 2.1 | No testimonials, logos, customer counts, urgency, countdowns, "x viewing", fake discounts | PASS | grep over src (excluding fancy/) found none; rendered home text contains none. Only urgency-adjacent copy is stock reasons in cart/pricing ("Only 3 of X left in stock"), which is real data. |
| 2.2 | compare-at prices not shown | PASS (dormant code) | no product has `compareAtCents`, so nothing renders. The strike-through branch still exists at `components/product/product-view.tsx:112,136` and `components/site/product-card.tsx:31,79`, plus the DB column and mapper. Dead code is a P2 clean-up. |
| 2.3 | Demo disclosure in footer and checkout | PASS | `footer.tsx:65`, `checkout-view.tsx:137,203`; also order page and product page |
| 2.4 | Home copy cites only catalog numbers (10 claims) | PASS with 2 overclaims | Verified: Seven aisles = 7 categories; Sixteen products = 16; compare up to 3; sort by battery exists; free shipping over $75 matches the API; Free standard shipping threshold = 7500; 3-5 and 1-2 day windows match; Tax "None" matches; spec lab data comes from the API; featured grid = the 4 featured products. Overclaims (see 2.5). |
| 2.5 | Process-step copy accuracy | DEVIATION | (a) "Battery hours, grams, ports and storage sit on every product page" is not true for every product (cameras, charger and Hearth Hub have no battery; "ports" appear only on some). (b) "Weight and battery life are first-class filters" - shop has battery sort only, no weight or battery filter (`src/lib/site.ts` PROCESS_STEPS). |
| 2.6 | "online" status label in the Ask Nodal header | DEVIATION (minor) | a static "online" indicator on a deterministic bot is harmless but is a status claim; consider removing |
| 2.7 | No real brand names/logos in imagery references | PASS | prompts only mention brands as prohibitions ("NO Apple/Samsung/Sony/Google look-alike marks"); QA.md notes ridge-12-pro reads "generic-flagship" |

## 3. Frontend vs brief

| # | Check | Result | Evidence |
|---|---|---|---|
| 3.1 | Pages exist and render | PASS | /, /shop, /product/[slug], /compare, /cart, /checkout, /order/[id], 404 (real 404 status) all 200/404 as expected at 1440 and 390; no horizontal scroll on any |
| 3.2 | Home sections | PASS | nav, hero with orb, category rail, featured, Spec lab, Ask Nodal, How we pick, footer wordmark |
| 3.3 | /shop URL-synced filters | PASS | `?category=audio&sort=price-asc&inStock=true` renders "Audio" heading and filtered list |
| 3.4 | End to end purchase | PASS | add to cart, checkout; empty submit shows 6 inline `role=alert` errors with `aria-invalid` and focus moves to the first field; filled form creates an order, redirects to /order/NDL-..., cart cleared, totals correct |
| 3.5 | Defensive localStorage cart | PASS | `{garbage` and an array of wrong-shaped objects (null, numbers, string quantities) both give an empty cart with no page errors |
| 3.6 | Unknown product / order pages | DEVIATION | /product/zzz and /order/NDL-XXXXXXXXXX render friendly "not found" UI but respond HTTP 200 (soft 404; the PPR page streams). Matters for SEO only. |
| 3.7 | metal-fx placement | PASS | one preset "chromatic" (`site/metal.tsx:7,28`); used only by the nav badge (`nav.tsx:63`) and the place-order button (`checkout-view.tsx:201`); reduced-motion fallbacks present |
| 3.8 | border-beam placement | PASS | primary CTA (`primary-button.tsx:22`) and the Ask Nodal input, active only while busy (`ask-nodal.tsx:179`) |
| 3.9 | Heavy libs lazy-loaded | PARTIAL | orb (three), metal-fx and bot-avatars are `dynamic()` with ssr:false (`site/lazy.tsx`). `border-beam`, `thinking-orbs` and `liquid-gooey` are static imports in section components. |
| 3.10 | Reduced motion | PASS | CSS `@media (prefers-reduced-motion)` in globals.css:168,187,200; Lenis, orb, hero parallax and metal/beam check it |
| 3.11 | Place-order button visibility on mobile | DEVIATION (investigate) | At 390 px the metal button computed `visibility:hidden` until it was scrolled into view (full-page screenshot shows a blank gap; after scrollIntoView it is visible). Looks like metal-fx IntersectionObserver gating, so real users likely see it on scroll, but the button is invisible to a full-page capture and to a script clicking it without scrolling first. |
| 3.12 | Accessibility basics | PASS | all images have alt; all inputs have labels (`labels` or aria-label) on every page; skip link present; log region `aria-live` on chat. Lighthouse not run. |
| 3.13 | Fonts self-hosted | FAIL | BRIEF says fonts are self-hosted in public/fonts and warns against Google fonts. `src/app/layout.tsx:28,34` links `fonts.googleapis.com` (Geist, Instrument Serif, JetBrains Mono) and preconnects. Runtime requests to fonts.gstatic.com observed. This leaks visitor IPs to Google, is a privacy/GDPR flag for a public repo, breaks offline, and the pages show net errors when offline or behind a proxy. |

## 4. Tooling (run in the scratch copy)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS, 0 errors |
| `npm run lint` | PASS with 4 warnings, 0 errors (all in `components/fancy/text/scramble-hover.tsx` and `vertical-cut-reveal.tsx`: unused var and exhaustive-deps) |
| `npm run test:api` | PASS 48/48, 10 suites, 0 fail, ~1.2 s |
| `npm run build` | PASS, 18 static pages, 6 API routes dynamic. Logs print `NEXT_PRERENDER_INTERRUPTED` "Route /api/products needs to bail out of prerendering ... nextUrl.searchParams" (`src/app/api/products/route.ts:7`) on every build: the route's catch-all `errorResponse` swallows the prerender bail-out. Build still exits 0, but this is noise and indicates the catch should rethrow framework errors. |

## 5. Security and robustness

| # | Check | Result | Evidence |
|---|---|---|---|
| 5.1 | Input validation (orders, assistant) | PASS | length caps (name 120, address 120, message 500), email, country and postal code validators, qty 1-99 integer, method enum |
| 5.2 | Prototype/extra field handling | PASS | extra client price fields ignored (1.11) |
| 5.3 | Stack traces | PASS | none observed in 400/404/405/409 bodies |
| 5.4 | Secrets in history | PASS | `git log -p -S` for key patterns and `git log --all -- .env` returned nothing; `.env` only holds `DATABASE_URL="file:./dev.db"` |
| 5.5 | .gitignore | PASS | covers node_modules, .next, `.env*` (with `!.env.example`), tsbuildinfo, `prisma/dev.db*`, .DS_Store; `git ls-files` shows no db or .env (only `.env.example`) |
| 5.6 | Test DB not tracked | PASS | tests use a temporary DB (`tests/helpers/test-db.ts`); no db files tracked |
| 5.7 | Rate limiting / abuse | DEVIATION (acceptable for demo) | no rate limit on /api/orders; anyone can drain stock of all products. Fine for a demo but worth one line in the README. |
| 5.8 | Order id enumeration | PASS | 36^10 random space, CSPRNG |
| 5.9 | PII on public order page | NOTE | GET /api/orders/[id] returns name, email and address to anyone holding the id. Acceptable given the unguessable id, and the page is `robots: noindex`. |

## 6. Public-release hygiene

| # | Check | Result | Evidence |
|---|---|---|---|
| 6.1 | README run instructions | FAIL | README says `npm install`, then `npx prisma migrate deploy && npm run db:seed`, and never mentions creating `.env`. `.env` is gitignored, so on a fresh clone prisma has no `DATABASE_URL` and `db:seed` uses `tsx --env-file=.env` (hard error). Verified: with `cp .env.example .env` first, migrate deploy and seed work ("Seeded 7 categories and 16 products") and the app runs. Fix: add `cp .env.example .env` to Run. |
| 6.2 | README honesty | PASS | clearly labels demo and real parts. Does not mention that fonts come from Google (see 3.13). |
| 6.3 | LICENSE | PASS | MIT, tracked |
| 6.4 | Uncommitted changes | DEVIATION | `next-env.d.ts` modified (adds `.next/types/root-params.d.ts` import; tooling-generated, should be committed or the file untracked/gitignored); `AGENTS.md` untracked (Next.js agent-rules block written by `next dev`; commit or gitignore it; its text "This is NOT the Next.js you know" is fine but is agent chatter in a public repo). Working tree changed during the audit (other agents are still editing). |
| 6.5 | art/ folder | PASS with notes | `art/.gitignore` ignores `raw/` (39 MB of PNGs and logs, untracked); prompts, MANIFEST, QA, gen_prompts.py and run_one.sh are tracked. Prompts contain no secrets. `art/MANIFEST.md` tells readers to use "the Codex CLI". `art/todo.txt` and `art/prompts/_list.txt` are scratch lists, and `p-ridge-12-pro.v2.txt` is a rejected re-roll; QA.md references `p-ridge-12-pro.v1.png` which does not exist in the repo (raw is ignored). |
| 6.6 | Repo size and large files | PASS | `.git` 5.2 MB; tracked images 4.7 MB; no large tracked files; 169 tracked files |
| 6.7 | "supervisor" / agent chatter in docs | PASS (mild) | grep for supervisor, haiku, sonnet and claude in docs, README and art found only `docs/MASTER_PROMPT.txt:8` ("Paste the whole file into Claude Code..."), which is intended. `docs/BACKEND_NOTES.md` and `docs/FRONTEND_NOTES.md` are internal implementation notes; check they read OK for outsiders. |
| 6.8 | Git history | NOTE | 18 commits, clean messages; a duplicate "Scaffold Next.js 16 app" commit exists |

## Tally

PASS 37, FAIL 2 (3.13 Google Fonts, 6.1 README missing `.env` step), DEVIATION 11 (1.4, 1.17, 1.18, 1.20, 2.5, 2.6, 3.6, 3.11, 5.7, 6.4, plus 3.9 partial), NOTE-only items not counted.

## Prioritised fix list

P0
1. README: add `cp .env.example .env` before migrate/seed (6.1). A fresh clone cannot run otherwise.
2. Fonts (3.13): remove the Google Fonts `<link>` in `src/app/layout.tsx:28-34` and self-host Geist, Instrument Serif and JetBrains Mono through `@font-face` in `public/fonts` as the brief says, or state the Google dependency in README.

P1
3. Product badge at stock 0: derive "Low stock" and "Out of stock" from the live `stock` value, not the seed (1.18).
4. Fix process-step copy (2.5): drop "on every product page", "ports", and "first-class filters" (weight/battery) or build those filters.
5. Assistant: honour the category noun ("headphones" must not return a speaker), and make "battery life" rank by actual hours (1.17).
6. `/api/products` route: rethrow Next's prerender bail-out in `errorResponse` (or add `export const dynamic = "force-dynamic"` equivalent for Cache Components) so the build log is clean (section 4).
7. Commit or ignore `next-env.d.ts` and `AGENTS.md` (6.4).
8. Verify the mobile place-order button appears on scroll in a real device or emulator; add a plain fallback (`<button>`) if metal-fx fails to reveal it (3.11).

P2
9. Return real 404 status for unknown /product/[slug] and /order/[id] via `notFound()` (3.6).
10. Remove dormant compare-at code paths (2.2) and the "online" label (2.6).
11. Lazy-load border-beam, thinking-orbs and liquid-gooey (3.9); fix the 4 lint warnings.
12. Tidy art/ (scratch lists, rejected v2 prompt, QA reference to a missing file) and note in README that demo stock can be drained, with no rate limit (5.7).
13. Run Lighthouse (a11y/best-practices/SEO >= 95) and a scroll-performance pass on the production build; not done in this audit.
