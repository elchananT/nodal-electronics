"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowDownRight } from "lucide-react";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";
import TextRotate from "@/components/fancy/text/text-rotate";
import { LazyOrb } from "@/components/site/lazy";
import { PrimaryButton, GhostButton } from "@/components/site/primary-button";
import { SITE } from "@/lib/site";

const spring = { type: "spring" as const, stiffness: 160, damping: 24 };
const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const { scrollY } = useScroll();
  const headY = useTransform(scrollY, [0, 700], [0, -90]);
  const headOpacity = useTransform(scrollY, [0, 600], [1, 0.25]);
  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0]);

  const sectionRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const line1 = useTransform(sx, (v) => v * -6);
  const line2 = useTransform(sx, (v) => v * -12);
  const line3 = useTransform(sx, (v) => v * -18);
  const lineY = useTransform(sy, (v) => v * -5);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0, px = 0, py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        mx.set((px / window.innerWidth) * 2 - 1);
        my.set((py / window.innerHeight) * 2 - 1);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, [mx, my]);

  return (
    <section ref={sectionRef} id="top" className="relative overflow-hidden bg-ink pb-16 pt-28 md:pb-24 md:pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-15%] size-[1000px] rounded-full bg-[radial-gradient(circle,rgba(255,61,129,.14),transparent_62%)]" />
        <div className="absolute bottom-[-25%] left-[-15%] size-[1000px] rounded-full bg-[radial-gradient(circle,rgba(46,168,255,.12),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
      </div>

      {/* the glowing orb, with its painted atmosphere. The hollow of the atmosphere is centred on the orb. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.2, ease }}
        className="absolute left-1/2 top-[4rem] z-0 size-[min(112vw,520px)] -translate-x-1/2 md:left-auto md:right-[-4%] md:top-[2rem] md:size-[min(60vw,820px)] md:translate-x-0 lg:right-[-1%]"
      >
        <div className="pointer-events-none absolute inset-0 max-md:opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/atmosphere.webp"
            alt=""
            aria-hidden
            decoding="async"
            fetchPriority="low"
            className="hero-atmosphere absolute left-[-24.3%] top-[-4%] h-auto w-[150%] max-w-none select-none"
          />
        </div>
        <div className="pointer-events-none absolute inset-[26%] rounded-full bg-[radial-gradient(circle,rgba(46,168,255,0.28),transparent_68%)]" />
        <LazyOrb className="relative h-full w-full max-md:opacity-35" />
      </motion.div>

      <div className="pointer-events-none relative mx-auto grid max-w-[1440px] items-center gap-6 px-6 md:px-12 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[1.05fr_1fr]">
        <motion.div style={{ y: headY, opacity: headOpacity }} className="pointer-events-auto relative z-10">
          <motion.p
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease }}
            className="mb-7 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/70"
          >
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-plasma/70" />
              <span className="relative size-2 rounded-full bg-plasma" />
            </span>
            {SITE.name}
            <span className="h-px w-6 bg-cream/25" />
            <span>Online electronics</span>
          </motion.p>

          <h1 className="font-[family-name:var(--font-display)] text-[clamp(3rem,min(7.2vw,12svh),7.8rem)] font-semibold leading-[0.9] tracking-[-0.035em] text-cream">
            <span className="sr-only">Electronics, considered. Built to last, to listen, to disappear, to impress.</span>
            <span aria-hidden>
              <motion.span style={{ x: line1, y: lineY }} className="block">
                <VerticalCutReveal splitBy="characters" staggerDuration={0.022} transition={{ ...spring, delay: 0.15 }}>
                  Electronics,
                </VerticalCutReveal>
              </motion.span>
              <motion.span style={{ x: line2, y: lineY }} className="block">
                <VerticalCutReveal
                  splitBy="characters"
                  staggerDuration={0.03}
                  transition={{ ...spring, delay: 0.45 }}
                  containerClassName="serif-accent font-normal pr-[0.06em]"
                  elementLevelClassName="sheen-ink"
                >
                  considered.
                </VerticalCutReveal>
              </motion.span>
              <motion.span style={{ x: line3, y: lineY }} className="mt-2 flex flex-wrap items-center gap-x-[0.22em] gap-y-2 text-[0.56em] leading-none tracking-[-0.02em]">
                <VerticalCutReveal splitBy="characters" staggerDuration={0.022} transition={{ ...spring, delay: 0.8 }}>
                  built to
                </VerticalCutReveal>
                <motion.span
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15, delay: 1.1 }}
                  className="inline-flex overflow-hidden rounded-[0.3em] bg-plasma px-[0.2em] pb-[0.08em] pt-[0.04em] text-ink shadow-[0_22px_60px_-12px_rgba(255,61,129,.55)]"
                >
                  <TextRotate
                    texts={["last.", "listen.", "disappear.", "impress."]}
                    mainClassName="overflow-hidden"
                    splitLevelClassName="overflow-hidden pb-[0.06em]"
                    staggerFrom="last"
                    staggerDuration={0.025}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    transition={{ type: "spring", damping: 26, stiffness: 380 }}
                    rotationInterval={2800}
                  />
                </motion.span>
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0.01, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease }}
            className="mt-8 max-w-[31rem] text-lg leading-relaxed text-cream/85 md:text-xl md:text-cream/75"
          >
            {SITE.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0.01, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <PrimaryButton href="/shop" size="lg">Shop all</PrimaryButton>
            <GhostButton href="/#ask">
              Ask Nodal
              <ArrowDownRight className="size-4" />
            </GhostButton>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        style={{ opacity: cueOpacity }}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[calc(100svh-4.5rem)] hidden -translate-x-1/2 flex-col items-center gap-2 md:flex [@media(max-height:780px)]:hidden"
      >
        <span className="relative h-9 w-px overflow-hidden bg-cream/15">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-plasma" style={{ animation: "scroll-cue 1.8s cubic-bezier(.16,1,.3,1) infinite" }} />
        </span>
      </motion.div>
    </section>
  );
}
