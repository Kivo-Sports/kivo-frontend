"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";
import styles from "./ThemeSelector.module.css";

const options = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
] as const;

export function ThemeSelector({ variant = "compact" }: { variant?: "compact" | "inline" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const current = options.find((option) => option.value === theme)!;
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (value: Theme) => {
    setTheme(value);
    if (variant === "compact") {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  const choices = (
    <div className={variant === "inline" ? styles.inlineChoices : styles.choices} role="group" aria-label="Escolher tema">
      {options.map(({ value, label, icon: Icon }) => (
        <button key={value} type="button" className={styles.option} aria-pressed={theme === value} onClick={() => select(value)}>
          <Icon size={17} aria-hidden="true" />
          <span>{label}</span>
          {theme === value && <Check className={styles.check} size={16} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );

  if (variant === "inline") return choices;

  return (
    <div className={styles.root} ref={rootRef}>
      <button ref={buttonRef} type="button" className={styles.trigger} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={panelId} aria-label={`Aparência: ${current.label}`}>
        <CurrentIcon size={17} aria-hidden="true" />
        <span>{current.label}</span>
        <ChevronDown size={15} aria-hidden="true" className={open ? styles.chevronOpen : undefined} />
      </button>
      {open && <div id={panelId} className={styles.panel}><span className={styles.caption}>Aparência</span>{choices}</div>}
    </div>
  );
}
