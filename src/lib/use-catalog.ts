"use client";

import { useCallback, useEffect, useState } from "react";
import { getCatalog } from "./api";
import type { Product } from "./types";

export function useCatalog() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    getCatalog().then(setItems, (e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return { items, error, retry: load };
}
