"use client";

/**
 * @file FadeIn.tsx
 * @description Componente utilitario para entrada suave por viewport.
 *
 * Decidi deixar a direcao configuravel porque em algumas telas faz mais
 * sentido entrar da esquerda/direita do que sempre de baixo pra cima.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { ReactNode } from "react";

// - Framer Motion
import { motion } from "framer-motion";

// - Motion config
import { getFadeDirectionVariants, getFadeTransition, type FadeDirection } from "@/lib/motion";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: FadeDirection;
  duration?: number;
  once?: boolean;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  duration = 0.35,
  once = true,
  className,
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      variants={getFadeDirectionVariants(direction)}
      initial="initial"
      whileInView="animate"
      exit="exit"
      viewport={{ once, amount: 0.25 }}
      transition={getFadeTransition(delay, duration)}
      style={{
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </motion.div>
  );
}
