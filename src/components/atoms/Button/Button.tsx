"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import { buttonHover } from "@/lib/motion";
import { Spinner } from "@/components/atoms/Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const baseClasses: string =
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border font-semibold leading-none outline-none transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-[var(--text-md)]",
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { height: "2.5rem", minWidth: "6.75rem", paddingInline: "1.25rem", gap: "0.5rem" },
  md: { height: "2.75rem", minWidth: "8.5rem", paddingInline: "1.5rem", gap: "0.625rem" },
  lg: { height: "3rem", minWidth: "10rem", paddingInline: "1.75rem", gap: "0.75rem" },
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--color-brand-primary)] text-[var(--color-bg-base)] shadow-[0_6px_18px_rgba(0,230,118,0.24)] hover:opacity-95 hover:shadow-[0_8px_22px_rgba(0,230,118,0.3)]",
  secondary:
    "border-transparent bg-[var(--color-brand-secondary)] text-[var(--color-bg-base)] shadow-[0_6px_18px_rgba(0,191,165,0.22)] hover:opacity-95 hover:shadow-[0_8px_22px_rgba(0,191,165,0.28)]",
  ghost:
    "border-[var(--color-border-default)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-secondary)]",
  danger:
    "border-transparent bg-[var(--color-feedback-danger)] text-[var(--color-text-primary)] shadow-[0_6px_18px_rgba(255,23,68,0.24)] hover:opacity-95 hover:shadow-[0_8px_22px_rgba(255,23,68,0.3)]",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const isDisabled: boolean = disabled || loading;
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  return (
    <motion.div
      className={fullWidth ? "w-full" : "inline-flex"}
      whileHover={!isDisabled ? buttonHover.whileHover : undefined}
      whileTap={!isDisabled ? buttonHover.whileTap : undefined}
      transition={buttonHover.transition}
      onHoverStart={() => setIsInteracting(true)}
      onHoverEnd={() => setIsInteracting(false)}
      onTapStart={() => setIsInteracting(true)}
      onTapCancel={() => setIsInteracting(false)}
      onTap={() => setIsInteracting(false)}
      style={{
        willChange: isInteracting ? "transform" : "auto",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <button
        type={type}
        className={[
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          fullWidth ? "w-full" : "w-auto",
          "active:brightness-95",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={isDisabled}
        aria-busy={loading}
        style={{ ...sizeStyles[size], ...style }}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size} color="currentColor" ariaLabel="Carregando" className="shrink-0" />
            <span>Carregando...</span>
          </>
        ) : (
          children
        )}
      </button>
    </motion.div>
  );
}
