import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* metal-fx shares one WebGL renderer; StrictMode double-mount freezes it in dev */
  reactStrictMode: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: { formats: ["image/avif", "image/webp"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
