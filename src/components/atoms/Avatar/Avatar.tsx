"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, CSSProperties> = {
  sm: { width: "2rem", height: "2rem", fontSize: "0.75rem", lineHeight: 1 },
  md: { width: "2.5rem", height: "2.5rem", fontSize: "0.875rem", lineHeight: 1 },
  lg: { width: "3rem", height: "3rem", fontSize: "1rem", lineHeight: 1 },
};

function getInitials(name: string): string {
  const parts: string[] = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [imageError, setImageError] = useState<boolean>(false);

  const initials: string = useMemo(() => getInitials(name), [name]);
  const showImage: boolean = Boolean(src) && !imageError;

  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--color-border-default) align-middle",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...sizeStyles[size],
        backgroundColor: "var(--color-bg-elevated)",
        color: "var(--color-brand-primary)",
        fontWeight: "var(--font-bold)",
        boxShadow: "var(--shadow-sm)",
      }}
      aria-label={name}
      title={name}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name}
          fill
          sizes="48px"
          unoptimized
          className="object-cover object-center"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="select-none font-display uppercase tracking-[0.02em] leading-none">
          {initials}
        </span>
      )}
    </span>
  );
}
