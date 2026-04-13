import type { CSSProperties } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  style?: CSSProperties;
}

export function PageHeader({ title, subtitle, style }: PageHeaderProps) {
  return (
    <header
      style={{
        marginBottom: "var(--space-6)",
        ...style,
      }}
    >
      <h1
        style={{
          marginBottom: subtitle ? "var(--space-2)" : 0,
          fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
          lineHeight: 1,
        }}
      >
        {title}
      </h1>

      {subtitle ? (
        <p
          className="text-secondary"
          style={{
            margin: 0,
            fontSize: "var(--text-md)",
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
