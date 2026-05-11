"use client";

import { MotionConfig, motion } from "framer-motion";
import type { CSSProperties } from "react";

type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  ariaLabel?: string;
}

const spinnerSizeStyles: Record<SpinnerSize, CSSProperties> = {
  sm: { width: "0.875rem", height: "0.875rem", borderWidth: "2px" },
  md: { width: "1rem", height: "1rem", borderWidth: "2px" },
  lg: { width: "1.25rem", height: "1.25rem", borderWidth: "2px" },
};

export function Spinner({
  size = "md",
  color = "var(--color-brand-primary)",
  className,
  ariaLabel = "Carregando",
}: SpinnerProps) {
  return (
    <MotionConfig reducedMotion="never">
      <motion.span
        role="status"
        aria-label={ariaLabel}
        className={className}
        style={{
          ...spinnerSizeStyles[size],
          display: "inline-block",
          borderStyle: "solid",
          borderColor: color,
          borderTopColor: "transparent",
          borderRadius: "var(--radius-full)",
          transformOrigin: "50% 50%",
          backfaceVisibility: "hidden",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    </MotionConfig>
  );
}
