"use client";

/**
 * @file AnimatedPage.tsx
 * @description Wrapper de pagina com animacao padrao de entrada/saida.
 *
 * Eu criei isso para evitar copiar initial/animate/exit em toda page.tsx.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { ReactNode } from "react";

// - Framer Motion
import { motion } from "framer-motion";

// - Motion config
import { pageTransition, pageVariants } from "@/lib/motion";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.main
      className={className}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.main>
  );
}
