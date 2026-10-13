"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** True once mounted on the client: gate WebGL / canvas libraries behind it. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/* True while the page is actively scrolling (and ~200ms after): non-essential canvases pause. */
let scrolling = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
function onScroll() {
  if (!scrolling) {
    scrolling = true;
    emit();
  }
  clearTimeout(timer);
  timer = setTimeout(() => {
    scrolling = false;
    emit();
  }, 200);
}
function subscribe(cb: () => void) {
  if (subs.size === 0) window.addEventListener("scroll", onScroll, { passive: true });
  subs.add(cb);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) window.removeEventListener("scroll", onScroll);
  };
}
export function useScrolling() {
  return useSyncExternalStore(subscribe, () => scrolling, () => false);
}
