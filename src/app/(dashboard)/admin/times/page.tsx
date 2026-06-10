/**
 * @file (dashboard)/admin/times/page.tsx
 * @description Gestão administrativa de todos os times: editar, ativar/desativar,
 * reatribuir dono e excluir.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { Select } from "@/components/atoms/Select";
import { useToast } from "@/components/atoms/Toast";
import {
  useListarTodosTimesQuery,
  useAtualizarTimeMutation,
  useToggleStatusTimeMutation,
  useReatribuirTimeMutation,
} from "@/store/api/timeApi";
import { useListarEsportesQuery } from "@/store/api/esporteApi";
import { useListarOrganizadoresTimeQuery } from "@/store/api/adminApi";
import type { TimeResponse } from "@/types/time";

const inputStyle: React.CSSProperties = {
  height: "3rem",
  width: "100%",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-default)",
  background: "var(--color-bg-input)",
  color: "var(--color-text-primary)",
  fontSize: "var(--text-sm)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  marginBottom: "var(--space-2)",
  fontWeight: 600,
};

export default function AdminTimesPage() {
  const { success, error } = useToast();
  const { data: times = [], isLoading } = useListarTodosTimesQuery();
  const { data: esportes = [] } = useListarEsportesQuery();
  const { data: organizadores = [] } = useListarOrganizadoresTimeQuery();

  const [atualizar, { isLoading: salvando }] = useAtualizarTimeMutation();
  const [toggleStatus, { isLoading: alternandoStatus }] = useToggleStatusTimeMutation();
  const [reatribuir, { isLoading: reatribuindo }] = useReatribuirTimeMutation();

  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<TimeResponse | null>(null);
  const [form, setForm] = useState({ nome: "", cidade: "", estado: "", esporteId: "" });
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [novoDono, setNovoDono] = useState("");

  useEffect(() => {
    if (editando) {
      setForm({ nome: editando.nome, cidade: editando.cidade, estado: editando.estado, esporteId: editando.esporteId });
      setNovoDono(editando.organizadorTimeId);
      setLogo(undefined);
    }
  }, [editando]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return times;
    return times.filter((t) => t.nome.toLowerCase().includes(termo) || t.cidade.toLowerCase().includes(termo));
  }, [times, busca]);

  const handleSalvar = async () => {
    if (!editando) return;
    // Validações
    if (!form.nome.trim()) return error("Informe o nome do time.");
    if (!form.cidade.trim()) return error("Informe a cidade.");
    if (!/^[A-Z]{2}$/.test(form.estado)) return error("Informe a UF (2 letras, ex: PR).");
    if (!form.esporteId) return error("Selecione um esporte.");

    try {
      await atualizar({ id: editando.id, nome: form.nome, cidade: form.cidade, estado: form.estado, esporteId: form.esporteId, logo }).unwrap();
      if (novoDono && novoDono !== editando.organizadorTimeId) {
        await reatribuir({ id: editando.id, novoOrganizadorTimeId: novoDono }).unwrap();
      }
      success("Time atualizado.");
      setEditando(null);
    } catch {
      error("Não foi possível salvar o time.");
    }
  };

  const handleToggle = async (t: TimeResponse) => {
    try {
      await toggleStatus(t.id).unwrap();
      success(t.ativo ? "Time desativado." : "Time ativado.");
    } catch (e) {
      const msg = (e as { data?: string })?.data;
      error(typeof msg === "string" && msg ? msg : "Não foi possível alterar o status.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Todos os Times</h2>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          style={{ ...inputStyle, maxWidth: "360px", flex: "1 1 240px" }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="lg" ariaLabel="Carregando times" />
        </div>
      ) : lista.length === 0 ? (
        <Card padding="lg">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Nenhum time encontrado.</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {lista.map((t) => (
            <Card key={t.id} padding="md" style={{ border: "1px solid rgba(0,230,118,0.12)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>{t.nome}</h3>
                    <Badge variant={t.ativo ? "success" : "danger"}>{t.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {t.cidade}/{t.estado} · {t.esporteNome ?? "—"}
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  <Button variant="ghost" size="sm" onClick={() => setEditando(t)}>Editar</Button>
                  <Button variant="secondary" size="sm" loading={alternandoStatus} onClick={() => handleToggle(t)}>{t.ativo ? "Desativar" : "Ativar"}</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de edição */}
      <Modal
        isOpen={!!editando}
        onClose={() => setEditando(null)}
        title="Editar time"
        maxWidth={520}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={salvando || reatribuindo} onClick={handleSalvar}>Salvar</Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "var(--space-3)" }}>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input style={inputStyle} value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input style={inputStyle} value={form.estado} maxLength={2} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} />
            </div>
          </div>
          <Select
            label="Esporte"
            value={form.esporteId}
            onChange={(v) => setForm({ ...form, esporteId: v })}
            placeholder="Selecione o esporte"
            options={esportes.map((esp) => ({ value: esp.id, label: esp.nome }))}
          />
          <Select
            label="Dono (organizador de time)"
            value={novoDono}
            onChange={setNovoDono}
            placeholder="Selecione o organizador"
            options={organizadores.map((org) => ({ value: org.id, label: `${org.nome} (${org.email})` }))}
          />
          <div>
            <label style={labelStyle}>Novo logo (opcional)</label>
            <input type="file" accept="image/*" style={inputStyle} onChange={(e) => setLogo(e.target.files?.[0])} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
