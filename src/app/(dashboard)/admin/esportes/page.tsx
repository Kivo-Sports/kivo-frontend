/**
 * @file (dashboard)/admin/esportes/page.tsx
 * @description Gestão de esportes (modalidades) dentro do painel admin.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { EsporteList } from "@/components/molecules/EsporteList";
import { EsporteFormModal } from "@/components/molecules/EsporteFormModal";
import type { EsporteResponse } from "@/types/esporte";

export default function AdminEsportesPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedEsporte, setSelectedEsporte] = useState<EsporteResponse | undefined>(undefined);

  const handleNew = () => {
    setSelectedEsporte(undefined);
    setIsFormModalOpen(true);
  };

  const handleEdit = (esporte: EsporteResponse) => {
    setSelectedEsporte(esporte);
    setIsFormModalOpen(true);
  };

  const handleClose = () => {
    setIsFormModalOpen(false);
    setSelectedEsporte(undefined);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 var(--space-2)" }}>
            Gerenciar Esportes
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            Modalidades disponíveis para times e campeonatos no Kivo Sports
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleNew}>
          + Novo Esporte
        </Button>
      </div>

      <EsporteList onEditClick={handleEdit} />

      <EsporteFormModal isOpen={isFormModalOpen} onClose={handleClose} esporte={selectedEsporte} />
    </div>
  );
}
