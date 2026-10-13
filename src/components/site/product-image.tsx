import Image from "next/image";
import { cn } from "@/lib/utils";

/** Transparent cutout, contained, with room to breathe. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-contain", className)} />;
}
