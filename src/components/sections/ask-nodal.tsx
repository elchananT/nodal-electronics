"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BorderBeam } from "border-beam";
import { ThinkingOrb } from "thinking-orbs";
import { ArrowUp, Sparkles } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { InView, LazyBotAvatar } from "@/components/site/lazy";
import { useMounted, usePrefersReducedMotion, useScrolling } from "@/components/site/hooks";
import { askAssistant, ApiError } from "@/lib/api";
import { money } from "@/lib/format";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

const CHIPS = [
  "Noise cancelling headphones under $300",
  "A waterproof speaker",
  "Longest battery life",
  "A light laptop for travel",
  "Something under $100",
];

const now = () => Date.now();

type Msg = { id: number; role: "user" | "bot"; text: string; done: boolean; slugs?: string[] };

export function AskNodal() {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const scrolling = useScrolling();
  const { items } = useCatalog();
  const bySlug = new Map((items ?? []).map((p) => [p.slug, p]));
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: "bot", text: "Hi, I'm Nodal. Tell me what you need and what you'd like to spend.", done: true },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const busy = thinking || msgs.some((m) => !m.done);
  const thread = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  useEffect(() => {
    const el = thread.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [msgs, thinking, reduced]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    const uid = idRef.current++, bid = idRef.current++;
    setMsgs((m) => [...m, { id: uid, role: "user", text, done: true }]);
    setInput("");
    setThinking(true);
    const started = now();
    let reply = "";
    let slugs: string[] = [];
    try {
      const r = await askAssistant(text);
      reply = r.reply;
      slugs = r.productSlugs ?? [];
    } catch (e) {
      reply = e instanceof ApiError && e.status === 0 ? "I can't reach the catalog right now. Please try again in a moment." : "Something went wrong on my side. Try asking again, or browse the shop directly.";
    }
    const wait = Math.max(0, 1000 - (now() - started));
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [...m, { id: bid, role: "bot", text: "", done: false }]);
      const words = reply.split(" ");
      let i = 0;
      timer.current = setInterval(() => {
        i += 1;
        const done = i >= words.length;
        setMsgs((m) => m.map((x) => (x.id === bid ? { ...x, text: words.slice(0, i).join(" "), done, slugs: done ? slugs : undefined } : x)));
        if (done && timer.current) clearInterval(timer.current);
      }, reduced ? 0 : 34);
    }, wait);
  };

  return (
    <section id="ask" aria-labelledby="ask-h" className="relative bg-ink px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="flex min-w-0 flex-col">
          <Reveal>
            <p className="eyebrow mb-5 text-plasma-2">Ask Nodal</p>
            <h2 id="ask-h" className="text-section">
              Not sure? <span className="serif-accent text-gradient-light">Just ask.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/70">
              A product finder that answers from the real catalog, by budget and by feature.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => ask(c)}
                disabled={busy}
                className="rounded-full border border-cream/15 bg-cream/[0.03] px-4 py-2.5 text-left text-[0.92rem] text-cream/80 transition-all duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-cream/40 hover:text-cream disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.1} className="min-w-0">
          <div className="flex h-[680px] flex-col rounded-[2.6rem] border border-cream/10 bg-ink-2 p-3 shadow-[0_60px_120px_-50px_rgba(46,168,255,.25)]">
            <div className="flex items-center justify-between px-4 pb-3 pt-4">
              <div className="flex items-center gap-4">
                <div className="pt-2">
                  <InView idle className="size-16" fallback={<span className="block size-16" />}>
                    <LazyBotAvatar type="hexagon" state={busy ? "working" : "default"} paused={scrolling && !busy} size={64} aria-label={busy ? "Nodal, answering" : "Nodal, idle"} />
                  </InView>
                </div>
                <div>
                  <p className="font-medium">Nodal</p>
                  <p className="font-mono text-[11px] text-cream/60">product finder</p>
                </div>
              </div>
              <span className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px]", busy ? "bg-plasma/15 text-plasma-2" : "bg-cream/5 text-cream/60")}>
                <i className={cn("size-1.5 rounded-full", busy ? "bg-plasma" : "bg-arc")} style={busy ? { animation: "pulse-dot 1s infinite" } : undefined} />
                {thinking ? "thinking" : busy ? "typing" : "online"}
              </span>
            </div>

            <div ref={thread} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto rounded-[1.8rem] bg-ink p-4 [scrollbar-width:none]" role="log" aria-live="polite" aria-label="Conversation">
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}
                  >
                    <div className={cn("max-w-[88%] rounded-[1.4rem] px-4 py-3 text-[0.95rem] leading-relaxed", m.role === "user" ? "rounded-br-md bg-cream text-ink" : "rounded-bl-md bg-ink-3 text-cream/90")}>
                      {m.role === "bot" && (
                        <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-arc-2">
                          <Sparkles className="size-3" /> Nodal
                        </span>
                      )}
                      {m.text}
                      {!m.done && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-blink bg-plasma" />}
                    </div>
                    {m.slugs && m.slugs.length > 0 && (
                      <ul className="grid w-full max-w-[88%] gap-2 sm:grid-cols-2">
                        {m.slugs.slice(0, 4).map((s) => {
                          const p = bySlug.get(s);
                          return p ? (
                            <motion.li key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                              <Link href={`/product/${p.slug}`} className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-ink-2 p-2 pr-4 transition-colors hover:border-cream/30">
                                <span className="room relative block size-14 shrink-0 overflow-hidden rounded-xl"><Image src={p.images.cutout} alt="" fill sizes="56px" className="object-contain p-1" /></span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium">{p.name}</span>
                                  <span className="block font-mono text-xs text-cream/65">{money(p.priceCents, true)}</span>
                                </span>
                              </Link>
                            </motion.li>
                          ) : null;
                        })}
                      </ul>
                    )}
                  </motion.div>
                ))}
                {thinking && (
                  <motion.div key="thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 px-1" role="status">
                    {mounted && <ThinkingOrb state="searching" size={20} theme="dark" paused={reduced} aria-hidden="true" />}
                    <span className="font-mono text-xs text-cream/65">Searching the catalog…</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <BorderBeam size="line" colorVariant="colorful" theme="dark" active={busy && !reduced} style={{ borderRadius: "1.8rem" }} className="mt-3">
              <form onSubmit={(e) => { e.preventDefault(); void ask(input); }} className="flex items-center gap-2 rounded-[1.8rem] bg-ink p-2 pl-5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Budget, category, features…"
                  aria-label="Ask Nodal about a product"
                  maxLength={300}
                  className="min-w-0 flex-1 bg-transparent text-[0.98rem] text-cream outline-none placeholder:text-cream/50"
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-plasma text-ink transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-110 disabled:opacity-40 disabled:hover:scale-100">
                  <ArrowUp className="size-5" strokeWidth={2.4} />
                </button>
              </form>
            </BorderBeam>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
