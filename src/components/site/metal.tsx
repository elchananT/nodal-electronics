"use client";

import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { MetalBadge, MetalFx, useMetalBend } from "metal-fx";
import { usePrefersReducedMotion } from "./hooks";

/* One metal preset for the whole store ("chromatic"): the nav badge and the checkout button. */

export function NewBadge() {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return (
      <span className="inline-flex h-[25px] w-[45px] items-center justify-center rounded-full bg-cream text-[12px] font-semibold text-ink">
        New
      </span>
    );
  }
  return <MetalBadge theme="dark" strength={0.9}>New</MetalBadge>;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; busy?: boolean };

export const MetalSubmit = forwardRef<HTMLButtonElement, Props>(function MetalSubmit({ children, busy, className, ...rest }, _ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useMetalBend(wrap);
  return (
    <MetalFx ref={wrap} preset="chromatic" theme="dark" strength={0.95} paused={reduced || busy} disableGlow={reduced}>
      <button
        type="submit"
        disabled={busy || rest.disabled}
        className={"inline-flex h-14 min-w-[17rem] items-center justify-center gap-2.5 rounded-full px-9 text-base font-medium text-cream disabled:opacity-70 " + (className ?? "")}
        {...rest}
      >
        {children}
      </button>
    </MetalFx>
  );
});
