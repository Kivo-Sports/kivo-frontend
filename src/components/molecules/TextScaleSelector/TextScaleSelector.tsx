"use client";

import { useRef, type KeyboardEvent } from "react";
import { useTextScale, type TextScale } from "@/components/providers/TextScaleProvider";

const OPTIONS: { value: TextScale; label: string }[] = [
  { value: 1, label: "Padrão" },
  { value: 1.15, label: "Grande" },
  { value: 1.3, label: "Maior" },
];

export function TextScaleSelector() {
  const { scale, setScale } = useTextScale();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const nextIndex = (index + step + OPTIONS.length) % OPTIONS.length;
    setScale(OPTIONS[nextIndex].value);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Tamanho do texto" style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
      {OPTIONS.map((option, index) => {
        const checked = option.value === scale;
        return (
          <button
            key={option.value}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => setScale(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            style={{ minHeight: 44, minWidth: 44, padding: "0 16px", borderRadius: "var(--radius-md)", border: `1px solid ${checked ? "var(--color-border-focus)" : "var(--color-border-default)"}`, background: "var(--color-bg-surface)", color: "var(--color-text-primary)", fontWeight: checked ? 700 : 500, cursor: "pointer" }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
