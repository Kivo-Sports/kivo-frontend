"use client";

/**
 * @file AnimatedNumber.tsx
 * @description Anima transicao numerica para placar/estatistica.
 *
 * Aqui eu usei motionValue + useTransform porque queria transicao fluida
 * sem depender de setInterval manual.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

// - Framer Motion
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";

// - Motion config
import { scoreCountTransition, scoreVariants } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function AnimatedNumber({ value, duration = 0.6, className, style }: AnimatedNumberProps) {
  const valorAnimado = useMotionValue(value);
  const valorArredondado = useTransform(valorAnimado, (latest) => Math.round(latest));
  const [valorExibido, setValorExibido] = useState(value);

  useMotionValueEvent(valorArredondado, "change", (latest) => {
    setValorExibido(latest);
  });

  useEffect(() => {
    const controlsDaAnimacao = animate(valorAnimado, value, {
      ...scoreCountTransition,
      duration,
    });

    return () => controlsDaAnimacao.stop();
  }, [duration, valorAnimado, value]);

  return (
    <motion.span
      key={value}
      className={className}
      style={{ display: "inline-block", fontVariantNumeric: "tabular-nums", ...style }}
      variants={scoreVariants}
      initial="idle"
      animate="animate"
    >
      {valorExibido}
    </motion.span>
  );
}

// MELHORIA: no futuro, aceitar formatter para moedas/porcentagem
