"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2 12C3.8 8.4 7.4 6 12 6s8.2 2.4 10 6c-1.8 3.6-5.4 6-10 6s-8.2-2.4-10-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 6.3A10.4 10.4 0 0 1 12 6c4.6 0 8.2 2.4 10 6a11.6 11.6 0 0 1-4.4 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 8.4A11.9 11.9 0 0 0 2 12c1.8 3.6 5.4 6 10 6 1 0 2-.1 2.9-.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const inputId: string = id ?? generatedId;
  const errorId: string = `${inputId}-error`;
  const hasError: boolean = Boolean(error);
  const isPasswordType: boolean = type === "password";
  const resolvedType: InputHTMLAttributes<HTMLInputElement>["type"] =
    isPasswordType && isPasswordVisible ? "text" : type;
  const inputSpacingStyle: CSSProperties = {
    paddingLeft: icon ? "3rem" : "1rem",
    paddingRight: isPasswordType ? "3rem" : "1rem",
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
          type={resolvedType}
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

        {isPasswordType ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            disabled={disabled}
            aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-(--color-text-muted) transition-colors duration-200 hover:text-(--color-text-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
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
