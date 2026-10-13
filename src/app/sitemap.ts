import type { MetadataRoute } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const dir = path.join(process.cwd(), "public", "products");
  const slugs = readdirSync(dir)
    .filter((f) => /^[a-z0-9-]+\.webp$/.test(f))
    .map((f) => f.replace(".webp", ""));
  const pages = ["", "/shop", "/compare"].map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 }));
  return [...pages, ...slugs.map((s) => ({ url: `${SITE.url}/product/${s}`, changeFrequency: "weekly" as const, priority: 0.7 }))];
}
