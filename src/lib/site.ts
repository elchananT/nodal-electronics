/** Everything personal / site-wide lives here — change it once, the whole store follows. */
export const SITE = {
  name: "Nodal",
  tagline: "Electronics, considered.",
  description:
    "Phones, audio, laptops and the small things that make them better — chosen by people who read the spec sheets.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3103",
  email: "elchanantreistman@gmail.com",
  github: "https://github.com/elchananT/",
  demoNote: "Demo store — fictional products, no real payments",
  freeShippingOverCents: 7500,
} as const;

export const CATEGORIES = [
  { slug: "audio", name: "Audio", hero: "halo-anc-headphones" },
  { slug: "phones-tablets", name: "Phones & tablets", hero: "ridge-12-pro" },
  { slug: "laptops", name: "Laptops", hero: "meridian-14" },
  { slug: "wearables", name: "Wearables", hero: "tern-watch" },
  { slug: "cameras", name: "Cameras", hero: "aperture-mini" },
  { slug: "smart-home", name: "Smart home", hero: "hearth-hub" },
  { slug: "accessories", name: "Accessories", hero: "kite-75-keyboard" },
] as const;

export const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/#lab", label: "Spec lab" },
  { href: "/#ask", label: "Ask Nodal" },
  { href: "/compare", label: "Compare" },
] as const;

export const PROCESS_STEPS = [
  {
    n: "01",
    img: "/process/process-1.webp",
    title: "Read the sheet",
    serif: "before the photo",
    body: "Every product page lists its specs in the same order, so two products are easy to compare side by side.",
    out: ["same table, every product"],
  },
  {
    n: "02",
    img: "/process/process-2.webp",
    title: "Check the numbers",
    serif: "against each other",
    body: "Compare up to three products spec by spec, with the best value in each row highlighted.",
    out: ["compare up to 3"],
  },
  {
    n: "03",
    img: "/process/process-3.webp",
    title: "Weigh and measure",
    serif: "what you carry",
    body: "Battery life is more than a footnote: sort the whole shop by battery hours, and compare weight side by side.",
    out: ["sort by battery"],
  },
  {
    n: "04",
    img: "/process/process-4.webp",
    title: "Keep what earns",
    serif: "its place",
    body: "Sixteen products. If something doesn't beat what we already stock, it doesn't get a shelf.",
    out: ["16 products"],
  },
] as const;
