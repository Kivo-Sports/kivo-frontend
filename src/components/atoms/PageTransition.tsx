"use client";

/**
 * @file PageTransition.tsx
 * @description Controla transicao entre rotas no App Router.
 *
 * A chave por pathname garante que cada mudanca de rota dispare exit/enter.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { ReactNode } from "react";

// - Framer Motion
import { motion } from "framer-motion";

// - Next.js
import { usePathname } from "next/navigation";

// - Motion config
import { pageTransition, pageVariants } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const rotaAtual = usePathname();

  return (
    <motion.div
      key={rotaAtual}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={pageTransition}
      style={{
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </motion.div>
  );
}
