import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";
type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  style?: CSSProperties;
}

type VariantStyle = {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-xs",
  md: "text-sm",
};

const sizeStyles: Record<BadgeSize, CSSProperties> = {
  sm: { height: "1.5rem", paddingInline: "0.625rem", lineHeight: 1 },
  md: { height: "1.75rem", paddingInline: "0.75rem", lineHeight: 1 },
};

const variantStyles: Record<BadgeVariant, VariantStyle> = {
  success: {
    textColor: "var(--color-feedback-success)",
    backgroundColor: "color-mix(in srgb, var(--color-feedback-success) 15%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-feedback-success) 35%, transparent)",
  },
  warning: {
    textColor: "var(--color-feedback-warning)",
    backgroundColor: "color-mix(in srgb, var(--color-feedback-warning) 15%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-feedback-warning) 35%, transparent)",
  },
  danger: {
    textColor: "var(--color-feedback-danger)",
    backgroundColor: "color-mix(in srgb, var(--color-feedback-danger) 15%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-feedback-danger) 35%, transparent)",
  },
  info: {
    textColor: "var(--color-feedback-info)",
    backgroundColor: "color-mix(in srgb, var(--color-feedback-info) 15%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-feedback-info) 35%, transparent)",
  },
  default: {
    textColor: "var(--color-text-muted)",
    backgroundColor: "color-mix(in srgb, var(--color-border-default) 15%, transparent)",
    borderColor: "var(--color-border-default)",
  },
};

export function Badge({ children, variant = "default", size = "md", className, style }: BadgeProps) {
  const styleVariant: VariantStyle = variantStyles[variant];

  const badgeStyle: CSSProperties = {
    ...sizeStyles[size],
    color: styleVariant.textColor,
    backgroundColor: styleVariant.backgroundColor,
    borderColor: styleVariant.borderColor,
    ...style,
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-semibold leading-none",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={badgeStyle}
    >
      {children}
    </span>
  );
}
