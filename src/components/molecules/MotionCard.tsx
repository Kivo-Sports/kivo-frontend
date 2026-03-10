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

// - Motion config
import { cardHover, cardTap, quickMotionTransition } from "@/lib/motion";

type MotionCardProps = HTMLMotionProps<"div">;

export function MotionCard({ children, className, ...props }: MotionCardProps) {
  return (
    <motion.div
      className={className ?? "card"}
      whileHover={cardHover}
      whileTap={cardTap}
      transition={quickMotionTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}
