/**
 * @file Input.tsx
 * @description Atom de input padrao.
 *
 * Mantive simples de proposito para usar tanto em formulario de auth
 * quanto nas telas internas sem acoplamento de regra de negocio.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

// FIXME: em tema dark esse input ainda usa paleta clara, revisar depois
export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${className}`}
      {...props}
    />
  );
}
