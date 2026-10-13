"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  onChange,
  max,
  min = 1,
  label,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  min?: number;
  label: string;
  className?: string;
}) {
  const btn =
    "grid size-9 place-items-center rounded-full text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream disabled:opacity-35 disabled:hover:bg-transparent";
  return (
    <div role="group" aria-label={`Quantity of ${label}`} className={cn("inline-flex items-center rounded-full border border-cream/15 p-0.5", className)}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease quantity of ${label}`}>
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center font-mono text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase quantity of ${label}`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
