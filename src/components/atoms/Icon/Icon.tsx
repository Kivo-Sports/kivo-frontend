"use client";

import type { LucideIcon } from "lucide-react";

export interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  color?: string;
}

export function Icon({ icon: IconComponent, size = 20, className, color = "currentColor" }: IconProps) {
  return (
    <IconComponent size={size} color={color} strokeWidth={1.8} className={className} />
  );
}
