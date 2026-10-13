"use client";

import Image from "next/image";
import StackingCards, { StackingCardItem } from "@/components/fancy/blocks/stacking-cards";
import { Reveal } from "@/components/site/reveal";
import { PROCESS_STEPS } from "@/lib/site";
import { cn } from "@/lib/utils";

const STYLES = [
  { cls: "bg-plasma text-ink", sub: "text-ink/90", chip: "bg-ink/10" },
  { cls: "bg-arc text-ink", sub: "text-ink/90", chip: "bg-ink/10" },
  { cls: "bg-cream text-ink", sub: "text-ink/70", chip: "bg-ink/[0.07]" },
  { cls: "bg-ink-3 text-cream border border-cream/10", sub: "text-cream/70", chip: "bg-cream/[0.08]" },
];

export function Process() {
  return (
    <section aria-labelledby="pick-h" className="relative bg-ink pt-6 md:pt-10">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="mb-6 max-w-3xl">
          <p className="eyebrow mb-5 text-plasma-2">How we pick</p>
          <h2 id="pick-h" className="text-section">
            Four rules, <span className="serif-accent text-gradient-light">no filler.</span>
          </h2>
        </Reveal>
      </div>

      <StackingCards totalCards={PROCESS_STEPS.length} scaleMultiplier={0.04} className="relative h-[420vh] px-3 md:px-8">
        {PROCESS_STEPS.map((s, i) => (
          <StackingCardItem key={s.n} index={i} className="h-screen" topPosition={`${12 + i * 2.5}%`}>
            <div className={cn("mx-auto grid h-[72vh] max-w-6xl gap-6 overflow-hidden rounded-[3rem] p-6 shadow-[0_-30px_80px_-30px_rgba(0,0,0,.7)] md:grid-cols-[1.25fr_1fr] md:p-8", STYLES[i].cls)}>
              <div className="flex min-w-0 flex-col justify-between p-2 md:p-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm opacity-70">{s.n} / 04</span>
                    <span className="h-px flex-1 bg-current opacity-20" />
                  </div>
                  <h3 className="mt-6 text-[clamp(2.2rem,5vw,4.6rem)] font-medium leading-[0.94] tracking-[-0.03em]">
                    {s.title}
                    <br />
                    <span className="serif-accent">{s.serif}</span>
                  </h3>
                </div>
                <div>
                  <p className={cn("max-w-md text-lg leading-relaxed", STYLES[i].sub)}>{s.body}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.out.map((o) => (
                      <span key={o} className={cn("rounded-full px-3.5 py-1.5 font-mono text-xs", STYLES[i].chip)}>{o}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-center max-md:min-h-[9rem]">
                <span aria-hidden data-n={s.n} className="absolute font-[family-name:var(--font-display)] text-[14rem] font-medium leading-none opacity-[0.08] before:content-[attr(data-n)] max-md:hidden" />
                <Image
                  src={s.img}
                  alt=""
                  width={900}
                  height={870}
                  sizes="(min-width:768px) 40vw, 60vw"
                  className="relative max-h-[86%] w-auto max-w-[92%] object-contain drop-shadow-[0_40px_50px_rgba(12,13,16,.45)] max-md:max-h-40"
                  style={{ animation: "float-y 6s ease-in-out infinite" }}
                />
              </div>
            </div>
          </StackingCardItem>
        ))}
      </StackingCards>
    </section>
  );
}
