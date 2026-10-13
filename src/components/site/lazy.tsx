"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Heavy client-only libraries, split into their own chunks so they never block first paint. */
export const LazyBotAvatar = dynamic(() => import("bot-avatars").then((m) => m.BotAvatar), { ssr: false });
export const LazyOrb = dynamic(() => import("./orb").then((m) => m.Orb), { ssr: false });
export const LazyMetalBadge = dynamic(() => import("./metal").then((m) => m.NewBadge), { ssr: false });
export const LazyMetalButton = dynamic(() => import("./metal").then((m) => m.MetalSubmit), {
  ssr: false,
  loading: () => <span className="inline-flex h-14 min-w-[17rem] rounded-full border border-cream/15 bg-ink-3" aria-hidden />,
});

type RIC = (cb: () => void, o?: { timeout: number }) => number;

/** Renders its children only once they come near the viewport, and keeps them mounted afterwards. */
export function InView({
  children,
  fallback = null,
  margin = "300px",
  idle = false,
  className,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  margin?: string;
  /** also mount during browser idle time after load, so heavy setup never lands mid-scroll */
  idle?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (idle) {
      timer = setTimeout(() => {
        const ric = (window as Window & { requestIdleCallback?: RIC }).requestIdleCallback;
        if (ric) idleId = ric(() => setShow(true), { timeout: 4000 });
        else setShow(true);
      }, 2500);
    }
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      if (idleId !== undefined) (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId);
    };
  }, [margin, idle]);
  return (
    <div ref={ref} className={className}>
      {show ? children : fallback}
    </div>
  );
}
