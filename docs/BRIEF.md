# Nodal — Brief (fills the master prompt's "ABOUT MY WEBSITE" block)

The master prompt is `docs/MASTER_PROMPT.txt` (stack, libraries, taste rules, performance
rules, known bugs). It is law. This file only adapts it to an electronics store.

## About my website

- **What it is:** Nodal — an online electronics store ("Electronics, considered."). A fully
  working e-commerce app: catalog, search, filters, product pages, compare, cart, checkout,
  order tracking. **Explicitly a demo store**: products are fictional, no real payments or
  shipping. A small honest "Demo store" note lives in the footer and checkout.
- **Brand name:** Nodal (logo text). Original brand; never use real brand names/logos.
- **Hero headline idea:** "Electronics, *considered.*" — `considered` as the single Instrument
  Serif italic accent word; a text-rotate pill after it: "built to last / to listen / to
  disappear / to impress".
- **One-sentence hero description:** "Phones, audio, laptops and the small things that make them
  better — chosen by people who read the spec sheets."
- **Sections wanted:** floating nav (with search + cart), hero (orb + eclipse atmosphere),
  category rail, featured products, interactive "Spec lab" (live comparison bars: battery life,
  weight, price — real catalog data), "Ask Nodal" product-finder chat (FAQ-chat recipe, answers
  from the REAL catalog by keyword/budget matching, thinking orb + bot avatar), "How we pick"
  stacking cards, footer with giant breathing wordmark.
- **Sections NOT wanted:** testimonials, press logos, customer counts, fake reviews, fake
  "x people viewing", countdown timers, newsletter spam. No instructional text on the page.
- **Real facts I can stand behind:** only the catalog numbers in `src/data` (they are the
  source of truth; marketing copy may only cite them). Prices in USD.
- **Links:** GitHub https://github.com/elchananT/ (footer), email elchanantreistman@gmail.com
  (footer mailto). No social links otherwise.
- **Two primaries:** PLASMA `#ff3d81` (energy, CTAs, price accents) and ARC `#2ea8ff`
  (intelligence, focus, links). Neutrals: INK `#0c0d10 / #14161b / #1d2027` and CREAM
  `#f4efe6 / #ebe4d6` (warm). Everything is a token; dark page, cream "rooms" (radius ~3.5rem).
- **Type:** Clash Display + General Sans (Fontshare, self-hosted in public/fonts), Instrument
  Serif italic accent, JetBrains Mono for specs/SKUs. (Fonts via @font-face — next/font/google
  breaks with the Turbopack Tailwind loader.)

## Pages / app behaviour

`/` home · `/shop` (category, price range, brand-line, in-stock, sort, text search; URL-synced
filters) · `/product/[slug]` (gallery with the cutout + Codex lifestyle image, spec table,
add-to-cart, related, "compare") · `/compare?items=a,b,c` (up to 3, spec-by-spec with winner
highlights) · `/cart` + slide-over cart · `/checkout` (address form with validation, shipping
method, order summary, "Place demo order" — no card fields; server validates stock and
recomputes totals) · `/order/[id]` (confirmation + status timeline) · `/404`.
Cart persists (localStorage, validated on load) and syncs prices from the server.

## Architecture (agreed split)

Single Next.js 16 app (App Router, TypeScript strict, Tailwind v4) in this folder.
**Backend = route handlers under `src/app/api/*` + `src/server/*` + Prisma 6 with SQLite
(`prisma/dev.db`, gitignored; seed script committed).** Frontend = everything else.

### API contract (backend must match; frontend may call only these)

All JSON. Money is integer cents. Errors `{ error: string, details?: unknown }`.

| Method | Path | Notes |
|---|---|---|
| GET | /api/products | `?category=&q=&minPrice=&maxPrice=&inStock=true&sort=featured\|price-asc\|price-desc\|newest\|battery&page=1&pageSize=12` → `{items:Product[],total,page,pageSize,facets:{categories:[{slug,name,count}],priceMin,priceMax}}` |
| GET | /api/products/[slug] | `Product` + `related: Product[]` (same category, up to 4) |
| POST | /api/cart/price | `{items:[{productId,quantity}]}` → priced lines, subtotal, shipping options, drops unknown/out-of-stock with a reason |
| POST | /api/orders | `{items,[{productId,quantity}], customer:{name,email}, shipping:{line1,line2?,city,region,postalCode,country}, method:"standard"\|"express"}` → 201 `Order`; validates, decrements stock **atomically in a transaction**, recomputes totals server-side (never trusts client prices), 409 on insufficient stock |
| GET | /api/orders/[id] | `Order` with lines (public id is a random unguessable `NDL-` + 10 chars) |
| POST | /api/assistant | `{message}` → `{reply:string, productSlugs:string[]}` — deterministic parser over the real catalog (budget "under $200", category words, features like "noise cancelling", "waterproof", "battery"); unknown → polite fallback + `/shop` suggestion. No LLM calls. |

`Product`: `{id,slug,name,tagline,category:{slug,name},priceCents,compareAtCents?,stock,featured,
badge?:"New"|"Low stock",images:{cutout:string,scene?:string},specs:Record<string,string|number>,
highlights:string[],battery?:{hours:number},weightGrams?:number,description,createdAt}`.
Shipping: standard $0 over $75 else $6.90, 3–5 days; express $18, 1–2 days. Tax: none (state it).

## Catalog (seed exactly these 16; original names; specs are invented, plausible, internally consistent)

Audio: Halo ANC Headphones $249 (40 h, 254 g) · Pebble Buds $129 (8 h + 24 h case, 5.4 g/bud)
· Cairn Portable Speaker $149 (20 h, IP67, 640 g).
Phones & tablets: Ridge 12 $699 (6.4″ OLED 120 Hz, 256 GB, 188 g, 2 days) · Ridge 12 Pro $999
(6.8″, periscope zoom, 512 GB, 221 g) · Slate 11 Tablet $549 (11″ 120 Hz, 256 GB, 480 g, 14 h).
Laptops: Meridian 14 $1199 (14″, 16 GB/512 GB, 1.2 kg, 18 h) · Meridian 16 Studio $1899
(16″ 2.5K mini-LED, discrete GPU, 32 GB/1 TB, 1.9 kg, 11 h).
Wearables: Tern Watch $299 (AMOLED, GPS, 5 days, 38 g) · Loop Smart Ring $249 (6 days, 3 g).
Cameras: Aperture Mini $899 (24 MP mirrorless, 5-axis IBIS, 390 g) · Orbit Action Cam $329
(5.3K, waterproof 18 m, 154 g).
Smart home: Hearth Hub $99.
Accessories: Kite 75 Keyboard $139 (wireless mechanical, 3 mo battery) · Vault SSD 2 TB $179
(2000 MB/s, 52 g) · Slab 140 GaN Charger $69 (140 W, 3 ports).
Categories: `audio, phones-tablets, laptops, wearables, cameras, smart-home, accessories`.
Mark 4 as featured, 2 as New, 1 as Low stock (stock 3). Others 8–60 in stock.

## Imagery

Generated by the image-model pipeline described in the master prompt §3 (Codex CLI). The
manifest is `art/MANIFEST.md`; generated files land in `art/` then are compressed into
`public/` (WebP for opaque, WebP with alpha for cutouts). Style: soft studio light from the
top and sides, matte graphite and warm cream materials with tiny plasma/arc accents, no text,
no real brands/logos, no UI, consistent camera angle per category.

## Definition of done

`next build` passes; `tsc` clean; ESLint clean; API tests (node:test or vitest) green incl.
concurrent-checkout stock test; Lighthouse a11y/best-practices/SEO ≥ 95 on prod build; every
page checked at 1440×900 and 390×844 with Playwright; no horizontal scroll; 60 fps scroll on
the production build; honest README (what's real, what's demo, how to run).
