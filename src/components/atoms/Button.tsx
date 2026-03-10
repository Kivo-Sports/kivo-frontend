/**
 * @file Button.tsx
 * @description Atom de botao reutilizavel para a aplicacao.
 *
 * No inicio eu pensei em usar lib externa de UI, mas preferi manter um botao
 * proprio para controlar melhor identidade visual do projeto.
 *
 * @author Kivo Sports - TCC
 */

// - React
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

// TODO: migrar variantes para semantic tokens e remover classes hardcoded
export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
