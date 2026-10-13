// Nodal demo catalog. Products are fictional; specs are invented but internally consistent.
// This file is the source of truth for the seed script (prisma/seed.ts) and the test suite.
// Money is integer cents (USD). Image files live at public/products/<slug>.webp.

export const CATEGORY_SLUGS = [
  "audio",
  "phones-tablets",
  "laptops",
  "wearables",
  "cameras",
  "smart-home",
  "accessories",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type SpecValue = string | number;
export type ProductBadge = "New" | "Low stock";

export interface CatalogCategory {
  slug: CategorySlug;
  name: string;
  sortOrder: number;
}

export interface CatalogProduct {
  slug: string;
  name: string;
  tagline: string;
  category: CategorySlug;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  featured: boolean;
  badge?: ProductBadge;
  specs: Record<string, SpecValue>;
  highlights: string[];
  batteryHours?: number;
  weightGrams?: number;
  description: string;
  createdAt: string;
}

export const CATEGORIES: CatalogCategory[] = [
  { slug: "audio", name: "Audio", sortOrder: 1 },
  { slug: "phones-tablets", name: "Phones & tablets", sortOrder: 2 },
  { slug: "laptops", name: "Laptops", sortOrder: 3 },
  { slug: "wearables", name: "Wearables", sortOrder: 4 },
  { slug: "cameras", name: "Cameras", sortOrder: 5 },
  { slug: "smart-home", name: "Smart home", sortOrder: 6 },
  { slug: "accessories", name: "Accessories", sortOrder: 7 },
];

export const PRODUCTS: CatalogProduct[] = [
  {
    slug: "halo-anc-headphones",
    name: "Halo ANC Headphones",
    tagline: "Over-ear noise cancelling for long days.",
    category: "audio",
    priceCents: 24900,
    stock: 24,
    featured: true,
    specs: {
      Type: "Over-ear, closed-back",
      Connectivity: "Bluetooth 5.3",
      Battery: "40 h",
      Weight: "254 g",
      "Water resistance": "Not rated",
      "Noise cancelling": "Yes, adaptive",
    },
    highlights: [
      "Adaptive noise cancelling with a transparency mode",
      "Up to 40 hours of playback on one charge",
      "Aluminium sliders and cream leather-look ear cushions",
      "Multipoint Bluetooth connects two devices at once",
    ],
    batteryHours: 40,
    weightGrams: 254,
    description:
      "Halo is a closed-back over-ear pair built around a deep, even seal. Adaptive noise cancelling tracks the room and eases off when you want to hear the street. The cushions are fitted with a magnetic clip so the headphones stay folded and flat in a bag.",
    createdAt: "2025-09-02T09:00:00Z",
  },
  {
    slug: "pebble-buds",
    name: "Pebble Buds",
    tagline: "Small, quiet, charged in a pebble-shaped case.",
    category: "audio",
    priceCents: 12900,
    stock: 42,
    featured: false,
    specs: {
      Type: "In-ear, true wireless",
      Connectivity: "Bluetooth 5.4",
      Battery: "8 h buds, 24 h with case",
      Weight: "5.4 g per bud",
      "Water resistance": "IPX4",
      "Noise cancelling": "Yes",
    },
    highlights: [
      "Noise cancelling in each bud",
      "8 hours per charge, 24 hours with the case",
      "IPX4 splash resistance for runs and commutes",
      "Case glows softly while charging",
    ],
    batteryHours: 8,
    description:
      "Pebble Buds are light enough to forget about once they are in. Each bud runs noise cancelling on its own microphone pair, and the case is good for three full recharges. A short press on either bud switches between listening modes.",
    createdAt: "2025-03-14T09:00:00Z",
  },
  {
    slug: "cairn-speaker",
    name: "Cairn Portable Speaker",
    tagline: "Rugged sound for the trail and the table.",
    category: "audio",
    priceCents: 14900,
    stock: 36,
    featured: false,
    specs: {
      Type: "Portable Bluetooth speaker",
      Connectivity: "Bluetooth 5.3",
      Battery: "20 h",
      Weight: "640 g",
      "Water resistance": "IP67",
      "Noise cancelling": "No",
    },
    highlights: [
      "IP67 dust and water resistance",
      "20 hours of playback at moderate volume",
      "Woven loop strap and cream rubber end caps",
      "Stereo pairing with a second Cairn",
    ],
    batteryHours: 20,
    weightGrams: 640,
    description:
      "Cairn is a cylindrical speaker with a graphite fabric grille and a full-range driver behind it. It is sealed well enough to survive rain and sand, and the strap makes it easy to carry. Two units can be paired for stereo.",
    createdAt: "2024-11-20T09:00:00Z",
  },
  {
    slug: "ridge-12",
    name: "Ridge 12",
    tagline: "A 6.4-inch phone with a 120 Hz screen.",
    category: "phones-tablets",
    priceCents: 69900,
    stock: 58,
    featured: true,
    specs: {
      Display: "6.4 in OLED, 120 Hz",
      Storage: "256 GB",
      Battery: "Up to 48 h",
      Weight: "188 g",
      Camera: "Dual rear, 48 MP main",
    },
    highlights: [
      "6.4-inch OLED display at 120 Hz",
      "256 GB storage",
      "Up to 48 hours of battery on light use",
      "Dual rear camera with a 48 MP main sensor",
    ],
    batteryHours: 48,
    weightGrams: 188,
    description:
      "Ridge 12 is a compact phone with a bright OLED panel that scrolls at 120 Hz. The frame is aluminium and the back is matte graphite glass. The battery is sized for two days of mixed use.",
    createdAt: "2026-08-05T09:00:00Z",
  },
  {
    slug: "ridge-12-pro",
    name: "Ridge 12 Pro",
    tagline: "A bigger screen, periscope zoom and more room.",
    category: "phones-tablets",
    priceCents: 99900,
    stock: 19,
    featured: false,
    specs: {
      Display: "6.8 in OLED, 120 Hz",
      Storage: "512 GB",
      Battery: "Up to 52 h",
      Weight: "221 g",
      Camera: "Triple rear with periscope zoom",
    },
    highlights: [
      "6.8-inch OLED display at 120 Hz",
      "Periscope telephoto lens for optical zoom",
      "512 GB storage",
      "Cream titanium frame with a matte back",
    ],
    batteryHours: 52,
    weightGrams: 221,
    description:
      "Ridge 12 Pro adds a larger screen and a periscope lens that folds the telephoto path sideways inside the body. The cream titanium frame has a matte back, and storage starts at 512 GB.",
    createdAt: "2026-08-05T09:00:00Z",
  },
  {
    slug: "slate-11-tablet",
    name: "Slate 11 Tablet",
    tagline: "Eleven inches of quiet, fast reading.",
    category: "phones-tablets",
    priceCents: 54900,
    stock: 27,
    featured: false,
    specs: {
      Display: "11 in LCD, 120 Hz",
      Storage: "256 GB",
      Battery: "Up to 14 h",
      Weight: "480 g",
      Camera: "Rear 13 MP",
    },
    highlights: [
      "11-inch display at 120 Hz",
      "256 GB storage",
      "Up to 14 hours of video playback",
      "Aluminium body at 480 g",
    ],
    batteryHours: 14,
    weightGrams: 480,
    description:
      "Slate 11 is a thin tablet with an 11-inch panel that refreshes at 120 Hz for smooth scrolling. It is built for reading, notes and video rather than heavy editing. The aluminium body stays cool under long sessions.",
    createdAt: "2026-01-22T09:00:00Z",
  },
  {
    slug: "meridian-14",
    name: "Meridian 14",
    tagline: "Light enough to carry all day.",
    category: "laptops",
    priceCents: 119900,
    stock: 14,
    featured: true,
    specs: {
      Display: "14 in IPS, 2K",
      Memory: "16 GB",
      Storage: "512 GB SSD",
      Battery: "Up to 18 h",
      Weight: "1.2 kg",
      Graphics: "Integrated",
    },
    highlights: [
      "14-inch 2K display",
      "16 GB memory and a 512 GB SSD",
      "1.2 kg aluminium unibody",
      "Up to 18 hours of battery on web and documents",
    ],
    batteryHours: 18,
    weightGrams: 1200,
    description:
      "Meridian 14 is a thin aluminium laptop with a 2K screen and a keyboard sized for long writing sessions. Memory and storage are fixed to the board for a sealed, quiet build. It is aimed at writing, browsing, spreadsheets and light photo work.",
    createdAt: "2025-10-08T09:00:00Z",
  },
  {
    slug: "meridian-16-studio",
    name: "Meridian 16 Studio",
    tagline: "A creator screen and a discrete GPU.",
    category: "laptops",
    priceCents: 189900,
    stock: 9,
    featured: false,
    specs: {
      Display: "16 in mini-LED, 2.5K",
      Memory: "32 GB",
      Storage: "1 TB SSD",
      Battery: "Up to 11 h",
      Weight: "1.9 kg",
      Graphics: "Discrete GPU, 8 GB",
    },
    highlights: [
      "16-inch 2.5K mini-LED display",
      "Discrete GPU for rendering and colour grading",
      "32 GB memory and a 1 TB SSD",
      "Vent slits for sustained load",
    ],
    batteryHours: 11,
    weightGrams: 1900,
    description:
      "Meridian 16 Studio pairs a 2.5K mini-LED panel with a discrete GPU for rendering, grading and large timelines. The graphite aluminium chassis has vent slits along the hinge to keep clocks steady under load. Battery life drops with the GPU active, so plan to keep it plugged in for heavy work.",
    createdAt: "2025-10-08T09:00:00Z",
  },
  {
    slug: "tern-watch",
    name: "Tern Watch",
    tagline: "GPS and five days of battery on the wrist.",
    category: "wearables",
    priceCents: 29900,
    stock: 33,
    featured: false,
    specs: {
      Display: "1.4 in AMOLED",
      Battery: "Up to 5 days",
      Weight: "38 g",
      Connectivity: "Bluetooth, GPS",
      "Water resistance": "5 ATM",
    },
    highlights: [
      "1.4-inch AMOLED display with an always-on mode",
      "Built-in GPS for routes and runs",
      "Up to 5 days of battery",
      "38 g case with a cream silicone strap",
    ],
    batteryHours: 120,
    weightGrams: 38,
    description:
      "Tern Watch is a round watch with a graphite case, a bright AMOLED face and GPS for recording routes. The always-on mode keeps the time visible without draining the battery. It is rated to 5 ATM for swimming, not for diving.",
    createdAt: "2025-06-17T09:00:00Z",
  },
  {
    slug: "loop-smart-ring",
    name: "Loop Smart Ring",
    tagline: "Sleep and activity tracking in a 3 g band.",
    category: "wearables",
    priceCents: 24900,
    stock: 48,
    featured: false,
    badge: "New",
    specs: {
      Display: "None",
      Battery: "Up to 6 days",
      Weight: "3 g",
      Connectivity: "Bluetooth",
      "Water resistance": "IP68",
    },
    highlights: [
      "Titanium shell at 3 g",
      "Up to 6 days per charge",
      "Sleep and heart-rate sensing",
      "IP68 water resistance",
    ],
    batteryHours: 144,
    weightGrams: 3,
    description:
      "Loop is a smart ring with a brushed titanium shell and sensors on the inner band. It records sleep, resting heart rate and daily activity, and syncs to the companion app over Bluetooth. Sizing kits are sold separately so you can match your finger at home.",
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    slug: "aperture-mini",
    name: "Aperture Mini",
    tagline: "A compact mirrorless camera with stabilised 24 MP.",
    category: "cameras",
    priceCents: 89900,
    stock: 11,
    featured: true,
    specs: {
      Sensor: "24 MP APS-C",
      Video: "4K 30 fps",
      Stabilisation: "5-axis in-body",
      Battery: "About 410 shots",
      Weight: "390 g",
      "Water resistance": "Not rated",
    },
    highlights: [
      "24 MP APS-C sensor",
      "5-axis in-body image stabilisation",
      "Tilting touchscreen and a small prime lens",
      "Cream leather-look grip on a graphite body",
    ],
    weightGrams: 390,
    description:
      "Aperture Mini is a small mirrorless body with a 24 MP sensor and five-axis stabilisation built into the camera. The grip is shaped for a single lens, and the mode dial has unmarked ticks so it can be set by feel. It is designed for everyday photos and short 4K clips.",
    createdAt: "2025-04-09T09:00:00Z",
  },
  {
    slug: "orbit-action-cam",
    name: "Orbit Action Cam",
    tagline: "5.3K video in a body you can drop.",
    category: "cameras",
    priceCents: 32900,
    stock: 22,
    featured: false,
    specs: {
      Sensor: "1/1.9 in, 23 MP",
      Video: "5.3K at 60 fps",
      Stabilisation: "Gyro horizon lock",
      Battery: "About 90 min",
      Weight: "154 g",
      "Water resistance": "18 m, no case",
    },
    highlights: [
      "5.3K video at 60 fps",
      "Waterproof to 18 m without a housing",
      "Front display for framing your own shot",
      "154 g body with a cream-and-pink record button",
    ],
    weightGrams: 154,
    description:
      "Orbit is a small action camera with a front-facing screen and a gyro that keeps the horizon level while you move. It records 5.3K at 60 fps and is sealed for 18 m without an extra housing. Battery life is about 90 minutes of continuous recording.",
    createdAt: "2025-12-03T09:00:00Z",
  },
  {
    slug: "hearth-hub",
    name: "Hearth Hub",
    tagline: "A quiet hub for the rooms you live in.",
    category: "smart-home",
    priceCents: 9900,
    stock: 52,
    featured: false,
    badge: "New",
    specs: {
      Connectivity: "Wi-Fi, Bluetooth, Thread",
      Power: "Mains, 12 W",
      Weight: "420 g",
      Dimensions: "120 × 120 × 150 mm",
    },
    highlights: [
      "Hub for Wi-Fi, Bluetooth and Thread devices",
      "Glowing blue ring shows device status",
      "Fabric-topped cylinder for a low profile",
      "Runs local automations when the internet is down",
    ],
    weightGrams: 420,
    description:
      "Hearth Hub is a low cream cylinder that connects the smart devices in a home to one another. The ring around its base shows status with soft light instead of a screen. Routines run on the hub itself, so lights and locks keep working if the internet drops.",
    createdAt: "2026-09-18T09:00:00Z",
  },
  {
    slug: "kite-75-keyboard",
    name: "Kite 75 Keyboard",
    tagline: "A wireless 75% mechanical keyboard with blank keycaps.",
    category: "accessories",
    priceCents: 13900,
    stock: 31,
    featured: false,
    specs: {
      Type: "75% wireless mechanical",
      Connectivity: "Bluetooth, 2.4 GHz, USB-C",
      Power: "3 months per charge",
      Performance: "Hot-swap sockets, 1 kHz polling",
      Weight: "690 g",
    },
    highlights: [
      "75% layout with hot-swap sockets",
      "Three connections: Bluetooth, 2.4 GHz and USB-C",
      "Up to 3 months on one charge",
      "Rotary knob for volume and media",
    ],
    batteryHours: 2160,
    weightGrams: 690,
    description:
      "Kite 75 is a compact wireless keyboard with a gasket-mounted plate and blank cream and pink keycaps. Hot-swap sockets let you change switches without soldering. It runs for about three months between charges with the backlight off.",
    createdAt: "2026-07-22T09:00:00Z",
  },
  {
    slug: "vault-ssd",
    name: "Vault SSD 2 TB",
    tagline: "A pocket SSD that reads at 2000 MB/s.",
    category: "accessories",
    priceCents: 17900,
    stock: 3,
    featured: false,
    badge: "Low stock",
    specs: {
      Type: "Portable SSD, 2 TB",
      Connectivity: "USB-C 3.2 Gen 2×2",
      Power: "Bus-powered",
      Performance: "Up to 2000 MB/s",
      Weight: "52 g",
    },
    highlights: [
      "2 TB capacity in a pocket-sized slab",
      "Read speeds up to 2000 MB/s",
      "Brushed graphite aluminium shell at 52 g",
      "Braided cream USB-C cable included",
    ],
    weightGrams: 52,
    description:
      "Vault is a portable SSD with a brushed aluminium shell and rounded corners. It is bus-powered, so no separate adapter is needed for a laptop. Sustained speeds are lower than the peak figure once the drive is full.",
    createdAt: "2025-08-27T09:00:00Z",
  },
  {
    slug: "slab-140-charger",
    name: "Slab 140 GaN Charger",
    tagline: "140 W from one compact brick.",
    category: "accessories",
    priceCents: 6900,
    stock: 45,
    featured: false,
    specs: {
      Type: "GaN wall charger",
      Connectivity: "2× USB-C, 1× USB-A",
      Power: "140 W total",
      Performance: "Up to 140 W on one USB-C port",
      Weight: "145 g",
    },
    highlights: [
      "140 W total output across three ports",
      "Two USB-C ports and one USB-A port",
      "Foldable prongs for travel",
      "Gallium nitride design runs cooler than silicon",
    ],
    weightGrams: 145,
    description:
      "Slab 140 is a wall charger with three ports and a graphite body with a cream stripe. Gallium nitride electronics keep it small and cool under load. Total output is shared across the ports, so one laptop plus a phone gets the full wattage.",
    createdAt: "2025-02-11T09:00:00Z",
  },
];
