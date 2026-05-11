"use client";

/**
 * @file MotionCard.tsx
 * @description Card base com interacao de hover e tap padronizada.
 *
 * Preferi criar um componente proprio em vez de repetir whileHover/whileTap
 * toda hora. Assim fica mais dificil fugir do padrao de animacao definido.
 *
 * @author Kivo Sports - TCC
 */

// - Framer Motion
import { motion, type HTMLMotionProps } from "framer-motion";
import { useState } from "react";

// - Motion config
import { cardHover, cardTap, quickMotionTransition } from "@/lib/motion";

type MotionCardProps = HTMLMotionProps<"div">;

export function MotionCard({ children, className, style, ...props }: MotionCardProps) {
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  return (
    <motion.div
      className={className ?? "card"}
      whileHover={cardHover}
      whileTap={cardTap}
      transition={quickMotionTransition}
      onHoverStart={() => setIsInteracting(true)}
      onHoverEnd={() => setIsInteracting(false)}
      onTapStart={() => setIsInteracting(true)}
      onTapCancel={() => setIsInteracting(false)}
      onTap={() => setIsInteracting(false)}
      style={{
        willChange: isInteracting ? "transform" : "auto",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
