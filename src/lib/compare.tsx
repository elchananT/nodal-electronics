"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "nodal.compare.v1";
export const MAX_COMPARE = 3;

type Ctx = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
  set: (slugs: string[]) => void;
};
const CompareContext = createContext<Ctx | null>(null);

const clean = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? Array.from(new Set(raw.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,80}$/.test(s)))).slice(0, MAX_COMPARE)
    : [];

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSlugs(clean(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {
      /* ignore */
    }
  }, [slugs, ready]);

  const toggle = useCallback(
    (slug: string) => {
      if (slugs.includes(slug)) {
        setSlugs(slugs.filter((s) => s !== slug));
        return true;
      }
      if (slugs.length >= MAX_COMPARE) return false;
      setSlugs([...slugs, slug]);
      return true;
    },
    [slugs],
  );
  const value = useMemo<Ctx>(
    () => ({
      slugs,
      has: (s) => slugs.includes(s),
      toggle,
      remove: (s) => setSlugs((c) => c.filter((x) => x !== s)),
      clear: () => setSlugs([]),
      set: (s) => setSlugs(clean(s)),
    }),
    [slugs, toggle],
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const c = useContext(CompareContext);
  if (!c) throw new Error("useCompare must be used inside <CompareProvider>");
  return c;
}
