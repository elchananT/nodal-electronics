import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/logo.png" alt="" width={64} height={64} priority={priority} className={cn("size-9 rounded-[28%]", className)} />;
}
