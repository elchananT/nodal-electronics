"use client";

import { motion, type HTMLMotionProps } from "motion/react";

/** Fade + rise when scrolled into view. */
export function Reveal({
  delay = 0,
  y = 40,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      // opacity + transform only: animating filter:blur repaints every frame
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
