"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./AuthorPicker.module.css";

export interface AuthorOption {
  id: string;
  nome: string;
  logoUrl?: string | null;
  detalhe?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Logo({ option, large }: { option: AuthorOption; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={large ? `${styles.logo} ${styles.logoLarge}` : styles.logo} aria-hidden>
      {option.logoUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={option.logoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        initials(option.nome)
      )}
    </span>
  );
}

export function AuthorPicker({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder = "Selecione um perfil",
}: {
  label: string;
  options: AuthorOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.id === value),
      ),
    );
    list.current?.focus();
    return () => document.removeEventListener("mousedown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(option: AuthorOption) {
    onChange(option.id);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
  }

  return (
    <div className={styles.picker} ref={wrapper}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label`}
        className={styles.trigger}
        data-open={open || undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {selected ? (
          <>
            <Logo option={selected} large />
            <span className={styles.text}>
              <span className={styles.name}>{selected.nome}</span>
              {selected.detalhe && <span className={styles.detail}>{selected.detalhe}</span>}
            </span>
          </>
        ) : (
          <span className={`${styles.text} ${styles.placeholder}`}>{placeholder}</span>
        )}
        <ChevronDown size={18} className={styles.chevron} aria-hidden />
      </button>

      {open && (
        <div className={styles.popover}>
          <ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            tabIndex={0}
            className={styles.list}
            onKeyDown={onKeyDown}
            aria-activedescendant={options[active] ? `${id}-${options[active].id}` : undefined}
          >
            {options.map((option, index) => {
              const isSelected = option.id === value;
              return (
                <li
                  key={option.id}
                  id={`${id}-${option.id}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  data-active={index === active || undefined}
                  className={styles.option}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <Logo option={option} />
                  <span className={styles.text}>
                    <span className={styles.name}>{option.nome}</span>
                    {option.detalhe && <span className={styles.detail}>{option.detalhe}</span>}
                  </span>
                  {isSelected && <Check size={16} className={styles.check} aria-hidden />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
