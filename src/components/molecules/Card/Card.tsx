"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

type CardPadding = "sm" | "md" | "lg";

export interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  hoverable?: boolean;
  className?: string;
  style?: CSSProperties;
}

const paddingStyles: Record<CardPadding, CSSProperties> = {
  sm: { padding: "var(--space-4)" },
  md: { padding: "var(--space-5)" },
  lg: { padding: "var(--space-6)" },
};

export function Card({ children, padding = "md", hoverable = false, className, style }: CardProps) {
  return (
    <motion.div
      className={[
        "rounded-lg border border-(--color-border-default) bg-(--color-bg-surface)",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...paddingStyles[padding],
        ...style,
      }}
      whileHover={hoverable ? { y: -2, boxShadow: "var(--shadow-lg)" } : undefined}
      whileTap={hoverable ? { y: 0 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
