/**
 * @file Label.tsx
 * @description Atom para rotulos de campos.
 *
 * Pode parecer bobeira ter um Label proprio, mas isso ajuda a manter
 * consistencia de fonte e peso em todos os formularios.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", ...props }: LabelProps) {
  return <label className={`text-sm font-medium text-slate-700 ${className}`} {...props} />;
}
