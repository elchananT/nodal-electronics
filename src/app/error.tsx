"use client";

import { ErrorState } from "@/components/site/states";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 pb-10 pt-40">
      <ErrorState message="This page hit a snag. Try again." onRetry={reset} />
    </div>
  );
}
