"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  placeholder,
  error,
  disabled = false,
  type = "text",
  icon,
  id,
  className,
  style,
  ...props
}: InputProps) {
  const generatedId: string = useId();
  const inputId: string = id ?? generatedId;
  const errorId: string = `${inputId}-error`;
  const hasError: boolean = Boolean(error);
  const inputSpacingStyle: CSSProperties = {
    paddingLeft: icon ? "3rem" : "1rem",
    paddingRight: "1rem",
    ...style,
  };

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute left-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-(--color-text-muted)"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}

        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          style={inputSpacingStyle}
          className={[
            "h-11 w-full rounded-md border bg-(--color-bg-input) text-sm text-(--color-text-primary) outline-none transition-all duration-200",
            "placeholder:text-(--color-text-muted)",
            hasError
              ? "border-(--color-feedback-danger) focus-visible:border-(--color-feedback-danger) focus-visible:ring-2 focus-visible:ring-(--color-feedback-danger-bg)"
              : "border-(--color-border-default) focus-visible:border-(--color-border-focus) focus-visible:ring-2 focus-visible:ring-(--color-feedback-success-bg)",
            disabled ? "cursor-not-allowed opacity-60" : "hover:border-(--color-border-strong)",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>

      <AnimatePresence initial={false}>
        {hasError ? (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-2 text-sm text-(--color-feedback-danger)"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
