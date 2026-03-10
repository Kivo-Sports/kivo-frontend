/**
 * @file motion.ts
 * @description Biblioteca central de animacoes do projeto.
 *
 * Decidi concentrar TODOS os variants aqui para evitar animacao inline espalhada.
 * No inicio parecia exagero, mas quando comecei a reaproveitar em varios componentes,
 * ficou claro que centralizar reduz retrabalho e inconsistencias de timing.
 *
 * @author Kivo Sports - TCC
 */

// - Tipos do Framer Motion
import type { Transition, Variants } from "framer-motion";

// - Tipos do AutoAnimate
import type { AutoAnimateOptions } from "@formkit/auto-animate";

export type FadeDirection = "up" | "down" | "left" | "right";

// easing base que tentei manter no estilo Apple: rapido no inicio e suave no final
export const appleEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// Entradas de pagina
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export const pageTransition: Transition = {
  duration: 0.4,
  ease: appleEase,
};

// Entradas de elementos
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

// Listas e stagger
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      // mantive abaixo de 0.08 para nao ficar "efeito cascata" exagerado
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

// Cards e superficies
export const cardHover = {
  scale: 1.02,
  boxShadow: "var(--shadow-lg)",
};

export const cardTap = {
  scale: 0.98,
};

// Modais e overlays
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.6 },
  exit: { opacity: 0 },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 8 },
};

// Notificacoes / Toast
export const toastVariants: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

// Numero animado (placar)
export const scoreVariants: Variants = {
  idle: {
    scale: 1,
    color: "var(--color-text-primary)",
  },
  animate: {
    scale: [1, 1.03, 1],
    color: ["var(--color-text-primary)", "var(--color-brand-primary)", "var(--color-text-primary)"],
    transition: {
      duration: 0.5,
      ease: appleEase,
    },
  },
};

export const defaultMotionTransition: Transition = {
  duration: 0.3,
  ease: appleEase,
};

export const quickMotionTransition: Transition = {
  duration: 0.2,
  ease: appleEase,
};

export const mediumMotionTransition: Transition = {
  duration: 0.4,
  ease: appleEase,
};

export const scoreCountTransition: Transition = {
  duration: 0.6,
  ease: appleEase,
};

export const autoAnimateOptions: Partial<AutoAnimateOptions> = {
  duration: 280,
  easing: "ease-out",
};

const fadeDirectionToVariants: Record<FadeDirection, Variants> = {
  up: fadeInUp,
  down: fadeInDown,
  left: fadeInLeft,
  right: fadeInRight,
};

export function getFadeDirectionVariants(direction: FadeDirection): Variants {
  return fadeDirectionToVariants[direction];
}

export function getFadeTransition(delayInSeconds = 0, durationInSeconds = 0.4): Transition {
  return {
    delay: delayInSeconds,
    duration: durationInSeconds,
    ease: appleEase,
  };
}

// TODO: quando tiver modal real no fluxo de compra, validar se modalVariants precisa de spring
