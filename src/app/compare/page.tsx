import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare up to three products spec by spec.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-6 pt-36 md:px-12"><div className="skeleton h-96" /></div>}>
      <CompareView />
    </Suspense>
  );
}
