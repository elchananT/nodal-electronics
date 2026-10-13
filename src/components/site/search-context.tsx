"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const Ctx = createContext<{ open: boolean; setOpen: (o: boolean) => void } | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  const v = useMemo(() => ({ open, setOpen }), [open]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useSearch() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSearch outside provider");
  return c;
}
