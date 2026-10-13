"use client";

import Link from "next/link";
import { BorderBeam } from "border-beam";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./hooks";

type Common = { size?: "md" | "lg"; className?: string; children: ReactNode; full?: boolean };
type AsLink = Common & { href: string; onClick?: () => void } & { type?: never; disabled?: never };
type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

const base =
  "relative flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-cream font-medium text-ink transition-transform duration-500 ease-[var(--ease-spring)] hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100";

/** The ONE primary button of the store: cream pill + breathing border-beam. Same component everywhere. */
export function PrimaryButton(props: AsLink | AsButton) {
  const reduced = usePrefersReducedMotion();
  const { size = "md", className, children, full } = props;
  const cls = cn(base, size === "lg" ? "h-[3.6rem] px-8 text-[1rem]" : "h-11 px-5 text-sm", full && "w-full", className);
  const wrapper = (inner: ReactNode) => (
    <BorderBeam
      size="pulse-inner"
      colorVariant="colorful"
      theme="dark"
      strength={0.8}
      active={!reduced}
      style={{ borderRadius: 999, display: full ? "block" : "inline-block", width: full ? "100%" : undefined }}
    >
      {inner}
    </BorderBeam>
  );
  if ("href" in props && props.href) {
    return wrapper(
      <Link href={props.href} onClick={props.onClick} className={cls}>
        {children}
      </Link>,
    );
  }
  const { size: _s, className: _c, children: _ch, full: _f, href: _h, ...rest } = props as AsButton;
  return wrapper(
    <button {...rest} className={cls}>
      {children}
    </button>,
  );
}

export function GhostButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[3.6rem] items-center gap-2 rounded-full border border-cream/20 px-7 text-[1rem] text-cream/85 transition-colors hover:border-cream/50 hover:text-cream",
        className,
      )}
    >
      {children}
    </Link>
  );
}
