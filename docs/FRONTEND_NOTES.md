# Frontend notes

## What is built
- Home: hero (vertical-cut-reveal headline, text-rotate pill, three.js orb with premultiplied additive atmosphere shell, painted atmosphere image centred on the orb), category rail, featured, Spec lab (metric tabs with a liquid-gooey "move" indicator, rows from the real catalog), Ask Nodal chat (bot avatar, thinking orb, word-by-word stream, border-beam on the input while answering, product mini-cards from `productSlugs`), How we pick (stacking cards with the process objects), footer (breathing wordmark, local time in an effect, demo note).
- Pages: `/shop` (URL-synced category, q, min/max in dollars, in stock, sort, page), `/product/[slug]`, `/compare?items=`, `/cart` + slide-over, `/checkout`, `/order/[id]`, 404, error, robots, sitemap.
- One primary button (`PrimaryButton`, cream pill + border-beam pulse-inner). Metal-fx: one `chromatic` preset, used on the nav "New" badge and the checkout "Place demo order" button, paused for reduced motion.
- Cart and compare state: React context + localStorage (try/catch, validated on load), cart re-priced through `/api/cart/price`.
- Fancy components (vertical-cut-reveal, text-rotate, stacking-cards, breathing-text, float, letter-swap, scramble-hover) and Skiper40 are copied from the polaris-ml reference (registry installs were not needed).

## Verified (production build, `next start`, port 3113)
- `npm run build` passes; `tsc --noEmit` clean; eslint 0 errors (4 warnings inside copied Fancy components).
- Lighthouse: home desktop a11y 97 / BP 96 / SEO 100 (one contrast failure fixed afterwards); mobile home 100/96/100, product 100/96/100, shop 98/96/100. Best-practices 96 is only the `fonts.gstatic.com` certificate error of this sandbox (fonts load fine elsewhere).
- Scroll fps (rAF counted during a Lenis smooth scroll, 8 positions): 58-60 everywhere, also with 4x CPU throttle. The hero measured ~47 fps only in the first second after load while intro animations run; the orb now skips frames while scrolling.
- Real flows tested end to end in a browser: filters/URL, add to cart, drawer, compare, Ask Nodal ("noise cancelling headphones under $300" returned Halo and Pebble mini-cards), checkout validation (bad ZIP caught client side), real order created, `/order/NDL-...` page. No horizontal scroll at 390 px on any page.

## Backend mismatches / gaps
- API caps `pageSize` at 48 (handled).
- The brief mentions a "brand-line" filter; the API has none, so it is not offered.
- `images.scene` is never present, so the product page shows only the lit cutout stage.
- Pebble Buds has no `weightGrams`, so it shows "—" in Spec lab and compare.
- Order status is always "placed"; the order page shows the later steps as pending, not as progress.
- Build logs print "Route /api/products needs to bail out of prerendering" from the backend route; the build still succeeds.
- Product page title is set on the client after fetch (static title "Product" in the HTML): per-product SSR metadata would need a server-side data call.

## Gaps
- OriginKit not used (needs login). Dev server for the frontend and backend share one `.next`, so only one `next dev` can run per folder.
