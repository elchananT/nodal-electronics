const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Money is integer cents everywhere; format only at the edge. */
export function money(cents: number, whole = false) {
  const v = cents / 100;
  return whole && Number.isInteger(v) ? usd0.format(v) : usd.format(v);
}

export function formatHours(h: number) {
  if (h >= 72) return `${Math.round(h / 24)} days`;
  return `${h} h`;
}

export function formatWeight(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(g % 100 === 0 ? 1 : 2)} kg` : `${g} g`;
}

export function titleCase(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}
