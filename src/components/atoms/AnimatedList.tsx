"use client";

/**
 * @file AnimatedList.tsx
 * @description Wrapper para listas com auto animacao em add/remove/reorder.
 *
 * Eu testei fazer isso no Framer Motion puro, mas para listas simples
 * o AutoAnimate resolveu com muito menos codigo.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { ReactNode } from "react";

// - AutoAnimate
import { useAutoAnimate } from "@formkit/auto-animate/react";

// - Motion config
import { autoAnimateOptions } from "@/lib/motion";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  const [parent] = useAutoAnimate<HTMLDivElement>(autoAnimateOptions);

  return (
    <div ref={parent} className={className}>
      {children}
    </div>
  );
}

// TODO: avaliar se vale expor opcao de disable animacao por props
