"use client";

import Link from "next/link";
import { AlertTriangle, PackageSearch } from "lucide-react";
import { PrimaryButton } from "./primary-button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[2rem] border border-cream/10 bg-ink-2 px-8 py-12 text-center">
      <AlertTriangle className="size-8 text-plasma-2" strokeWidth={1.5} />
      <p className="text-lg font-medium">Something went wrong</p>
      <p className="text-cream/70">{message ?? "We couldn't load this right now."}</p>
      {onRetry && <PrimaryButton type="button" onClick={onRetry}>Try again</PrimaryButton>}
    </div>
  );
}

export function EmptyState({ title, body, href = "/shop", cta = "Browse the shop" }: { title: string; body?: string; href?: string; cta?: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[2rem] border border-cream/10 bg-ink-2 px-8 py-14 text-center">
      <PackageSearch className="size-9 text-cream/55" strokeWidth={1.4} />
      <p className="text-xl font-medium">{title}</p>
      {body && <p className="text-cream/70">{body}</p>}
      <Link href={href} className="mt-1 rounded-full border border-cream/20 px-6 py-3 text-cream/90 transition-colors hover:border-cream/50">{cta}</Link>
    </div>
  );
}
