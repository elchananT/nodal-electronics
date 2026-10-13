"use client";

import { useEffect, useState } from "react";
import BreathingText from "@/components/fancy/text/breathing-text";
import { Link000 } from "@/components/ui/skiper-ui/skiper40";
import { CATEGORIES, SITE } from "@/lib/site";
import { LogoMark } from "./logo";

function LocalTime() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 20_000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{t || " "}</span>;
}

export function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink px-5 pb-10 pt-24 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 text-sm text-cream/60 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-2.5 text-cream">
            <LogoMark className="size-9" />
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">Nodal</span>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-cream/70">{SITE.tagline} {SITE.description}</p>
        </div>
        <div className="space-y-2">
          <p className="eyebrow mb-3 text-cream/55">Shop</p>
          {CATEGORIES.slice(0, 5).map((c) => (
            <Link000 key={c.slug} href={`/shop?category=${c.slug}`} className="w-fit hover:text-cream">
              {c.name}
            </Link000>
          ))}
          <Link000 href="/compare" className="w-fit hover:text-cream">Compare</Link000>
        </div>
        <div className="space-y-2">
          <p className="eyebrow mb-3 text-cream/55">Elsewhere</p>
          <a href={SITE.github} target="_blank" rel="noreferrer" className="block w-fit hover:text-cream">GitHub</a>
          <a href={`mailto:${SITE.email}`} className="block w-fit hover:text-cream">Email</a>
          <p className="pt-2 font-mono text-xs text-cream/60">Local time · <LocalTime /></p>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl select-none overflow-hidden" aria-hidden>
        <BreathingText
          as="p"
          fromFontVariationSettings="'wght' 300"
          toFontVariationSettings="'wght' 800"
          staggerDuration={0.08}
          staggerFrom="center"
          className="block text-center font-[family-name:var(--font-geist)] text-[32vw] leading-[0.8] tracking-[-0.07em] text-cream md:text-[26vw]"
        >
          nodal
        </BreathingText>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-cream/10 pt-6 font-mono text-[11px] text-cream/60 md:flex-row">
        <span>© {year ?? ""} {SITE.name}</span>
        <span>{SITE.demoNote}</span>
      </div>
    </footer>
  );
}
