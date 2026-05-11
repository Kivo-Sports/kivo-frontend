"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

export interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  color?: string;
  style?: CSSProperties;
}

export function Icon({ icon: IconComponent, size = 20, className, color, style }: IconProps) {
  return (
    <IconComponent
      size={size}
      color={color ?? "currentColor"}
      strokeWidth={1.8}
      className={className}
      style={style}
    />
  );
}
