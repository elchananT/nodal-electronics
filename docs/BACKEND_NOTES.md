# Backend notes

Backend for Nodal: Prisma 6 on SQLite, route handlers under `src/app/api/*`, service layer under `src/server/*`, catalog under `src/data/catalog.ts`.

## Layout

- `prisma/schema.prisma`, `prisma/migrations/` (migration `init`), `prisma/seed.ts` (calls `src/server/seed-catalog.ts`).
- `src/data/catalog.ts`: the 16 products and 7 categories. Source of truth for seeding and tests.
- `src/server/`: `db.ts` (client singleton), `types.ts` (public API shapes), `mappers.ts` (DB row to `Product`), `products.ts`, `pricing.ts`, `cart.ts`, `checkout.ts` (orders), `assistant.ts` and `assistant-intent.ts`, `validation.ts`, `errors.ts`, `http.ts`.
- `src/app/api/`: `products`, `products/[slug]`, `cart/price`, `orders`, `orders/[id]`, `assistant`. Handlers are thin.
- `tests/`: `node:test` suites run with `npm run test:api`. Each file creates its own temporary SQLite database (`os.tmpdir()`), runs `prisma migrate deploy`, and seeds it. The dev database is never used by tests.

## Scripts

- `npm run db:migrate` (`prisma migrate dev`), `npm run db:seed` (idempotent upsert by slug; re-running resets catalog-owned fields including stock).
- `npm run test:api` (`tsx --test tests/*.test.ts`). No separate `test` script existed, so none was changed.
- `.env` holds `DATABASE_URL="file:./dev.db"`. `.env.example` is committed.

## Contract decisions

- Errors: `{ "error": string, "details"?: unknown }`. 400 validation (`details` is a list of "field: problem" strings), 404 unknown product or order, 409 stock shortage (`details` lists each short line with `requested` and `available`), 500 generic.
- `minPrice` and `maxPrice` query parameters are integer cents, consistent with the money rule and the facet `priceMin` / `priceMax`.
- Standard shipping is free only when the subtotal is strictly over 7500 cents. Standard costs 690 cents otherwise. Express is always 1800 cents. No tax.
- Order ids: `NDL-` followed by 10 characters from `A-Z0-9`, generated with `crypto.randomInt`. Order creation retries on Prisma `P2034` and `P2002` up to four attempts. The test run does not record whether a retry fired.
- Order JSON: `{id, status:"placed", createdAt, customer:{name,email}, shipping:{line1,line2?,city,region,postalCode,country,method}, delivery:{minDays,maxDays}, lines:[{productId,slug,name,unitPriceCents,quantity,lineTotalCents}], subtotalCents, shippingCents, totalCents}`. The brief did not define the order shape, so this is my reading.
- Cart pricing (`POST /api/cart/price`): duplicate product ids are merged. Lines are dropped with a reason for unknown products, out-of-stock products, and quantities above stock. Lines are not capped.
- Order creation with an unknown product id returns 400 (not 409). Shortages return 409.
- Postal codes: US uses a ZIP pattern (`12345` or `12345-1234`). Other countries use a generic 3 to 10 letter or digit pattern. Country must be a two-letter code.
- Stock is checked and decremented in one interactive transaction. Each line is a conditional `updateMany` (`stock >= quantity`), so a racing request cannot drive stock below zero.
- Product `related` is up to 4 products from the same category, ordered as the featured sort.

## Assistant

- Deterministic, no LLM calls. Budget phrases ("under", "below", "max", "up to", "budget of") are read as cents. Category synonyms map to the seven categories. Feature keywords: noise cancelling / ANC, waterproof / water resistant, battery, light / lightweight, 120 Hz, portable.
- Features are judged from catalog fields only (specs, highlights, description, battery hours, weight).
- Product names: distinctive words only (for example "Halo", "Ridge", "Meridian"). Category words such as "headphones" never count as a name match.
- Results: at most 3 slugs. Budget and category are hard filters. If any candidate matches a feature, only feature matches are kept. A name match restricts results to that product.
- Replies are at most two sentences and quote real names and prices.

## Invented data

The brief left some values open, so these are invented but kept internally consistent:
- Ridge 12 Pro battery "Up to 52 h", Ridge 12 "Up to 48 h" (the brief gave "2 days").
- Kite 75 battery is 2160 h (3 months), which makes it first in battery sort.
- Weights for Hearth Hub, Kite 75, Slab 140 and Aperture Mini; camera battery shot counts; Orbit sensor and battery life.
- `compareAtCents` on Halo ($279) and Orbit ($379).
- `createdAt` dates (drives "newest"; Loop Smart Ring is newest).
- Descriptions and highlights.
- Stock values other than the brief's featured, New and Low stock flags (Vault SSD has stock 3).

## Known gaps

- `Product.images` only holds the cutout path. There is no scene image, because `public/products` has no scene files.
- Order status is always `"placed"`. There is no status progression endpoint, since the brief did not define one.
- `package.json` has frontend dependency changes that are not committed by this agent. The backend only committed its own script lines.

## Verification

Environment: dev server on port 3103 (`npx next dev -p 3103`), then stopped. Responses below were captured from the live server. Seed data changed by the orders placed during verification; the dev database was re-seeded afterwards.

### Test suite (`npm run test:api`)

```
✔ assistant parser (49.072875ms)
✔ assistant answers (9.956208ms)
✔ catalog integrity (5.315ms)
✔ order creation (117.175042ms)
✔ checkout validation (0.92175ms)
✔ shipping rules (54.86025ms)
✔ cart pricing (4.605958ms)
✔ GET /api/products service (86.471ms)
✔ GET /api/products/[slug] service (2.441917ms)
✔ HTTP status mapping (89.625458ms)
ℹ tests 48
ℹ suites 10
ℹ pass 48
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Typecheck and lint

```
tsc exit 0
eslint (src/server src/data src/app/api tests prisma/seed.ts): exit 0
```

### Live endpoints (curl and fetch)

```
$ curl -s 'http://localhost:3103/api/products?sort=featured&pageSize=2&inStock=true' | jq-style summary
{"total":16,"page":1,"pageSize":2,"items":[["ridge-12",69900,true,null,57],["meridian-14",119900,true,null,14]],"facets":{"categories":[{"slug":"audio","name":"Audio","count":3},{"slug":"phones-tablets","name":"Phones & tablets","count":3},{"slug":"laptops","name":"Laptops","count":2},{"slug":"wearables","name":"Wearables","count":2},{"slug":"cameras","name":"Cameras","count":2},{"slug":"smart-home","name":"Smart home","count":1},{"slug":"accessories","name":"Accessories","count":3}],"priceMin":6900,"priceMax":189900}}

$ curl -s 'http://localhost:3103/api/products?category=audio&sort=price-asc'
{"total":3,"slugs":[["pebble-buds",12900],["cairn-speaker",14900],["halo-anc-headphones",24900]]}

$ curl -s 'http://localhost:3103/api/products?sort=battery&pageSize=48' (first 4 and last 2 battery values)
[["kite-75-keyboard",2160],["loop-smart-ring",144],["tern-watch",120],["ridge-12-pro",52],["ridge-12",48],["halo-anc-headphones",40],["cairn-speaker",20],["meridian-14",18],["slate-11-tablet",14],["meridian-16-studio",11],["pebble-buds",8],["aperture-mini",null],["hearth-hub",null],["orbit-action-cam",null],["slab-140-charger",null],["vault-ssd",null]]

$ curl -s 'http://localhost:3103/api/products/halo-anc-headphones' (summary)
{"slug":"halo-anc-headphones","priceCents":24900,"compareAtCents":27900,"images":{"cutout":"/products/halo-anc-headphones.webp"},"battery":{"hours":40},"weightGrams":254,"specs":{"Type":"Over-ear, closed-back","Connectivity":"Bluetooth 5.3","Battery":"40 h","Weight":"254 g","Water resistance":"Not rated","Noise cancelling":"Yes, adaptive"},"related":["pebble-buds","cairn-speaker"]}

$ curl -s -w 'HTTP %{http_code}' 'http://localhost:3103/api/products/nope'
{"error":"Product not found"}
HTTP 404

$ curl -s -w 'HTTP %{http_code}' 'http://localhost:3103/api/products?sort=bogus&minPrice=abc'
{"error":"Invalid request","details":["sort: must be one of featured, price-asc, price-desc, newest, battery","minPrice: must be a whole number"]}
HTTP 400

$ curl -s -X POST http://localhost:3103/api/cart/price (ridge-12, meridian-14, unknown id)
{"lines":[{"productId":"cmv66uqcj0003zruaxlytcso8","slug":"ridge-12","name":"Ridge 12","unitPriceCents":69900,"quantity":1,"lineTotalCents":69900},{"productId":"cmv66uqcl0006zrua0peuu3de","slug":"meridian-14","name":"Meridian 14","unitPriceCents":119900,"quantity":1,"lineTotalCents":119900}],"subtotalCents":189800,"shippingOptions":[{"method":"standard","label":"Standard shipping","priceCents":0,"minDays":3,"maxDays":5},{"method":"express","label":"Express shipping","priceCents":1800,"minDays":1,"maxDays":2}],"dropped":[{"productId":"nope","reason":"Product not found"}]}

$ curl -s -X POST http://localhost:3103/api/cart/price (empty items)
{"error":"Invalid request","details":["items: must be a non-empty array"]}
HTTP 400

$ curl -s -w HTTP POST http://localhost:3103/api/orders (1 x ridge-12, standard, subtotal over 75)
{"id":"NDL-WS2H7ZQOQY","status":"placed","createdAt":"2026-10-13T09:27:51.880Z","customer":{"name":"Ada Lovelace","email":"ada@example.com"},"shipping":{"line1":"1 Main St","city":"Springfield","region":"IL","postalCode":"62701","country":"US","method":"standard"},"delivery":{"minDays":3,"maxDays":5},"lines":[{"productId":"cmv66uqcj0003zruaxlytcso8","slug":"ridge-12","name":"Ridge 12","unitPriceCents":69900,"quantity":1,"lineTotalCents":69900}],"subtotalCents":69900,"shippingCents":0,"totalCents":69900}
HTTP 201

$ curl -s -w HTTP GET http://localhost:3103/api/orders/NDL-WS2H7ZQOQY
{"id":"NDL-WS2H7ZQOQY","status":"placed","createdAt":"2026-10-13T09:27:51.880Z","customer":{"name":"Ada Lovelace","email":"ada@example.com"},"shipping":{"line1":"1 Main St","city":"Springfield","region":"IL","postalCode":"62701","country":"US","method":"standard"},"delivery":{"minDays":3,"maxDays":5},"lines":[{"productId":"cmv66uqcj0003zruaxlytcso8","slug":"ridge-12","name":"Ridge 12","unitPriceCents":69900,"quantity":1,"lineTotalCents":69900}],"subtotalCents":69900,"shippingCents":0,"totalCents":69900}
HTTP 200

$ curl -s -w HTTP GET http://localhost:3103/api/orders/NDL-XXXXXXXXXX
{"error":"Order not found"}
HTTP 404

$ curl -s -w HTTP POST http://localhost:3103/api/orders (99 x ridge-12, insufficient stock)
{"error":"Not enough stock: Ridge 12 (wanted 99, 56 left)","details":[{"productId":"cmv66uqcj0003zruaxlytcso8","slug":"ridge-12","name":"Ridge 12","requested":99,"available":56}]}
HTTP 409

$ curl -s -w HTTP POST http://localhost:3103/api/orders (invalid fields)
{"error":"Invalid request","details":["customer.name: is required","customer.email: must be a valid email address","shipping.line1: is required","shipping.city: is required","shipping.region: is required","shipping.postalCode: must be a US ZIP code like 10001 or 10001-1234","method: must be one of standard, express"]}
HTTP 400

$ POST /api/assistant {"message":"headphones under $200"}  -> HTTP 200
{"reply":"Best matches audio under $200: Pebble Buds ($129) and Cairn Portable Speaker ($149). Browse everything at /shop.","productSlugs":["pebble-buds","cairn-speaker"]}

$ POST /api/assistant {"message":"phone with 120hz"}  -> HTTP 200
{"reply":"Best matches phones & tablets with a 120 Hz screen: Ridge 12 ($699), Slate 11 Tablet ($549) and Ridge 12 Pro ($999). Browse everything at /shop.","productSlugs":["ridge-12","slate-11-tablet","ridge-12-pro"]}

$ POST /api/assistant {"message":"waterproof camera"}  -> HTTP 200
{"reply":"Best matches cameras with water resistance: Orbit Action Cam ($329). Browse everything at /shop.","productSlugs":["orbit-action-cam"]}

$ POST /api/assistant {"message":"tell me about the Halo"}  -> HTTP 200
{"reply":"Here is what matches that name: Halo ANC Headphones ($249). Browse everything at /shop.","productSlugs":["halo-anc-headphones"]}

$ POST /api/assistant {"message":"hello"}  -> HTTP 200
{"reply":"Hi, I can help you find a product. Try something like \"headphones under $200\" or browse the full range at /shop.","productSlugs":[]}

$ POST /api/assistant {"message":"what is the weather"}  -> HTTP 200
{"reply":"I could not match that to our catalog. Try a category such as laptops or wearables, or browse everything at /shop.","productSlugs":[]}

```
