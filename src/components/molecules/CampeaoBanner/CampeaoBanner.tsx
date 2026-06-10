"use client";

import { motion } from "framer-motion";
import { Trophy, Crown } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Icon } from "@/components/atoms/Icon";

export interface CampeaoBannerProps {
  nome: string;
  logoUrl: string | null;
}

/** Faixa de destaque do campeão, exibida em campeonatos finalizados. */
export function CampeaoBanner({ nome, logoUrl }: CampeaoBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid rgba(255,196,0,0.35)",
        background: "linear-gradient(135deg, rgba(255,196,0,0.16) 0%, rgba(20,16,4,0.6) 45%, rgba(0,0,0,0.72) 100%)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        padding: "var(--space-5)",
        marginBottom: "var(--space-6)",
      }}
    >
      {/* Brilho decorativo */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-45%",
          right: "-6%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,196,0,0.25), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
        {/* Logo do campeão com coroa */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <span
            style={{
              position: "absolute",
              top: "-14px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
            }}
          >
            <Icon icon={Crown} size={22} style={{ color: "#FFC400" }} />
          </span>
          <div
            style={{
              borderRadius: "50%",
              padding: "3px",
              background: "linear-gradient(135deg, #FFD24A, #B8860B)",
              boxShadow: "0 8px 24px rgba(255,196,0,0.3)",
            }}
          >
            <Avatar name={nome} src={logoUrl || undefined} size="lg" />
          </div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--text-xs)",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "#FFC400",
            }}
          >
            <Icon icon={Trophy} size={13} />
            Campeão
          </p>
          <h2
            style={{
              margin: "var(--space-1) 0 0",
              fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {nome}
          </h2>
        </div>
      </div>
    </motion.div>
  );
}
