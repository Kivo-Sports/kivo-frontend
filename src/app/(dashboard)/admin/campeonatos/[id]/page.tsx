/**
 * @file (dashboard)/admin/campeonatos/[id]/page.tsx
 * @description Detalhe administrativo de um campeonato: visão geral + times participantes,
 * editar em qualquer etapa, descancelar, excluir e reatribuir dono (com confirmação por senha).
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { Select } from "@/components/atoms/Select";
import { SearchableSelect } from "@/components/atoms/SearchableSelect";
import { DateInput } from "@/components/atoms/DateInput";
import { PasswordConfirmModal } from "@/components/molecules/PasswordConfirmModal";
import { useToast } from "@/components/atoms/Toast";
import {
  useObterCampeonatoPorIdQuery,
  useEditarCampeonatoMutation,
  useDescancelarCampeonatoMutation,
  useExcluirCampeonatoMutation,
  useReatribuirCampeonatoMutation,
  useListarConvitesCampeonatoQuery,
} from "@/store/api/campeonatoApi";
import { useListarEsportesQuery } from "@/store/api/esporteApi";
import { useListarOrganizadoresCampeonatoQuery } from "@/store/api/adminApi";
import { FORMATO_CAMPEONATO, type FormatoCampeonato } from "@/types/campeonato";

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

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default" | "info"> = {
  Rascunho: "default",
  InscricoesAbertas: "success",
  InscricoesEncerradas: "warning",
  Pausado: "warning",
  EmAndamento: "info",
  Finalizado: "default",
  Cancelado: "danger",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function InfoItem({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>
        {rotulo}
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "white", fontWeight: 600 }}>{valor}</div>
    </div>
  );
}

export default function AdminCampeonatoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const { success, error } = useToast();

  const { data: campeonato, isLoading } = useObterCampeonatoPorIdQuery(id);
  const { data: esportes = [] } = useListarEsportesQuery();
  const { data: organizadores = [] } = useListarOrganizadoresCampeonatoQuery();
  const { data: convites = [] } = useListarConvitesCampeonatoQuery(id);

  const [editar, { isLoading: salvando }] = useEditarCampeonatoMutation();
  const [descancelar, { isLoading: descancelando }] = useDescancelarCampeonatoMutation();
  const [excluir, { isLoading: excluindo }] = useExcluirCampeonatoMutation();
  const [reatribuir, { isLoading: reatribuindo }] = useReatribuirCampeonatoMutation();

  const [form, setForm] = useState({
    nome: "",
    esporteId: "",
    dataInicio: "",
    dataFim: "",
    formatoCampeonato: "PontosCorridos" as FormatoCampeonato,
    pontosVitoria: 3,
    pontosDerrota: 0,
    pontosEmpate: 1,
    quantidadeTimesClassificam: 0,
  });
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [novoOrganizador, setNovoOrganizador] = useState("");

  // Ação sensível aguardando confirmação por senha
  const [acaoSenha, setAcaoSenha] = useState<null | "reatribuir" | "excluir">(null);

  useEffect(() => {
    if (campeonato) {
      setForm({
        nome: campeonato.nome,
        esporteId: campeonato.esporteId,
        dataInicio: toLocalInput(campeonato.dataInicio),
        dataFim: toLocalInput(campeonato.dataFim),
        formatoCampeonato: (campeonato.formatoCampeonato as FormatoCampeonato) || "PontosCorridos",
        pontosVitoria: campeonato.pontosVitoria,
        pontosDerrota: campeonato.pontosDerrota,
        pontosEmpate: campeonato.pontosEmpate,
        quantidadeTimesClassificam: campeonato.quantidadeTimesClassificam,
      });
      setNovoOrganizador(campeonato.organizadorCampeonatoId);
    }
  }, [campeonato]);

  const formatoOptions = useMemo(
    () => (Object.keys(FORMATO_CAMPEONATO) as FormatoCampeonato[]).map((f) => ({ value: f, label: FORMATO_CAMPEONATO[f].label })),
    [],
  );

  const grupos = useMemo(() => {
    return {
      aceitos: convites.filter((c) => c.statusParticipacao === "Aceito"),
      pendentes: convites.filter((c) => c.statusParticipacao === "Pendente"),
      recusados: convites.filter((c) => c.statusParticipacao === "Recusado"),
    };
  }, [convites]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
        <Spinner size="lg" ariaLabel="Carregando campeonato" />
      </div>
    );
  }

  if (!campeonato) {
    return (
      <Card padding="lg">
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Campeonato não encontrado.</p>
      </Card>
    );
  }

  const handleSalvar = async () => {
    // Validações
    if (!form.nome.trim()) return error("Informe o nome do campeonato.");
    if (!form.esporteId) return error("Selecione um esporte.");
    if (!form.dataInicio || !form.dataFim) return error("Informe as datas de início e fim.");
    if (new Date(form.dataFim) <= new Date(form.dataInicio)) return error("A data de fim deve ser depois da data de início.");
    if ([form.pontosVitoria, form.pontosEmpate, form.pontosDerrota].some((p) => Number(p) < 0)) return error("A pontuação não pode ser negativa.");
    if (form.formatoCampeonato === "Hibrido" && Number(form.quantidadeTimesClassificam) < 2) return error("Em campeonatos híbridos, informe quantos times classificam (mínimo 2).");

    try {
      await editar({
        id,
        nome: form.nome,
        esporteId: form.esporteId,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        formatoCampeonato: FORMATO_CAMPEONATO[form.formatoCampeonato].valor,
        pontosVitoria: Number(form.pontosVitoria),
        pontosDerrota: Number(form.pontosDerrota),
        pontosEmpate: Number(form.pontosEmpate),
        quantidadeTimesClassificam: Number(form.quantidadeTimesClassificam),
        logo,
      }).unwrap();
      success("Campeonato atualizado.");
      setLogo(undefined);
    } catch {
      error("Não foi possível salvar as alterações.");
    }
  };

  const handleDescancelar = async () => {
    try {
      await descancelar(id).unwrap();
      success("Campeonato reativado.");
    } catch {
      error("Não foi possível reativar.");
    }
  };

  const abrirExcluir = () => setAcaoSenha("excluir");

  const abrirReatribuir = () => {
    if (!novoOrganizador || novoOrganizador === campeonato.organizadorCampeonatoId) {
      error("Selecione um organizador diferente do atual.");
      return;
    }
    setAcaoSenha("reatribuir");
  };

  // Executado pelo PasswordConfirmModal somente após a senha ser validada.
  const executarAcaoSenha = async () => {
    if (acaoSenha === "excluir") {
      try {
        await excluir(id).unwrap();
        success("Campeonato excluído.");
        router.push("/admin/campeonatos");
      } catch {
        error("Não foi possível excluir.");
        throw new Error("falha");
      }
    } else if (acaoSenha === "reatribuir") {
      try {
        await reatribuir({ id, novoOrganizadorCampeonatoId: novoOrganizador }).unwrap();
        success("Dono reatribuído com sucesso.");
      } catch {
        error("Não foi possível reatribuir o dono.");
        throw new Error("falha");
      }
    }
  };

  const organizadorAtual = organizadores.find((o) => o.id === campeonato.organizadorCampeonatoId);
  const novoOrgNome = organizadores.find((o) => o.id === novoOrganizador)?.nome ?? "outro organizador";

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Cabeçalho + ações */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
          {campeonato.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campeonato.logoUrl} alt={campeonato.nome} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
          )}
          <h2 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>{campeonato.nome}</h2>
          <Badge variant={STATUS_VARIANT[campeonato.status] ?? "default"}>{campeonato.status}</Badge>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" onClick={() => router.push(`/admin/campeonatos/${id}/jogos`)}>Gerir jogos</Button>
          {campeonato.status === "Cancelado" && (
            <Button variant="primary" size="sm" loading={descancelando} onClick={handleDescancelar}>Descancelar</Button>
          )}
          <Button variant="danger" size="sm" loading={excluindo} onClick={abrirExcluir}>Excluir</Button>
        </div>
      </div>

      {/* Visão geral */}
      <Card padding="lg">
        <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>Visão geral</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-4)" }}>
          <InfoItem rotulo="Esporte" valor={campeonato.esporteNome ?? "—"} />
          <InfoItem rotulo="Formato" valor={FORMATO_CAMPEONATO[(campeonato.formatoCampeonato as FormatoCampeonato)]?.label ?? campeonato.formatoCampeonato} />
          <InfoItem rotulo="Início" valor={formatarData(campeonato.dataInicio)} />
          <InfoItem rotulo="Fim" valor={formatarData(campeonato.dataFim)} />
          <InfoItem rotulo="Pontuação (V/E/D)" valor={`${campeonato.pontosVitoria} / ${campeonato.pontosEmpate} / ${campeonato.pontosDerrota}`} />
          {campeonato.formatoCampeonato === "Hibrido" && (
            <InfoItem rotulo="Classificam" valor={campeonato.quantidadeTimesClassificam} />
          )}
          <InfoItem rotulo="Times confirmados" valor={campeonato.totalTimes} />
          <InfoItem rotulo="Organizador" valor={campeonato.organizadorNome ?? organizadorAtual?.nome ?? "—"} />
          {campeonato.vencedorTimeNome && <InfoItem rotulo="Campeão" valor={campeonato.vencedorTimeNome} />}
        </div>
      </Card>

      {/* Times participantes */}
      <Card padding="lg">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>Times participantes</h3>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <Badge variant="success">{grupos.aceitos.length} confirmados</Badge>
            <Badge variant="warning">{grupos.pendentes.length} pendentes</Badge>
            <Badge variant="danger">{grupos.recusados.length} recusados</Badge>
          </div>
        </div>

        {convites.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "var(--text-sm)" }}>Nenhum time convidado ainda.</p>
        ) : (
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {convites.map((c) => {
              const variant = c.statusParticipacao === "Aceito" ? "success" : c.statusParticipacao === "Recusado" ? "danger" : "warning";
              return (
                <div key={c.participacaoId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "var(--space-2)" }}>
                  <span style={{ color: "white", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nomeTime}</span>
                  <Badge variant={variant}>{c.statusParticipacao}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Formulário de edição */}
      <Card padding="lg">
        <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>Editar informações</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nome</label>
            <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <Select
              label="Esporte"
              value={form.esporteId}
              onChange={(v) => setForm({ ...form, esporteId: v })}
              placeholder="Selecione o esporte"
              options={esportes.map((esp) => ({ value: esp.id, label: esp.nome }))}
            />
          </div>
          <div>
            <Select
              label="Formato"
              value={form.formatoCampeonato}
              onChange={(v) => setForm({ ...form, formatoCampeonato: v as FormatoCampeonato })}
              options={formatoOptions}
            />
          </div>
          <DateInput
            label="Início"
            type="datetime-local"
            value={form.dataInicio}
            onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
          />
          <DateInput
            label="Fim"
            type="datetime-local"
            value={form.dataFim}
            onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
          />
          <div>
            <label style={labelStyle}>Pontos vitória</label>
            <input type="number" style={inputStyle} value={form.pontosVitoria} onChange={(e) => setForm({ ...form, pontosVitoria: Number(e.target.value) })} />
          </div>
          <div>
            <label style={labelStyle}>Pontos empate</label>
            <input type="number" style={inputStyle} value={form.pontosEmpate} onChange={(e) => setForm({ ...form, pontosEmpate: Number(e.target.value) })} />
          </div>
          <div>
            <label style={labelStyle}>Pontos derrota</label>
            <input type="number" style={inputStyle} value={form.pontosDerrota} onChange={(e) => setForm({ ...form, pontosDerrota: Number(e.target.value) })} />
          </div>
          {form.formatoCampeonato === "Hibrido" && (
            <div>
              <label style={labelStyle}>Times que classificam (híbrido)</label>
              <input type="number" style={inputStyle} value={form.quantidadeTimesClassificam} onChange={(e) => setForm({ ...form, quantidadeTimesClassificam: Number(e.target.value) })} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Novo logo (opcional)</label>
            <input type="file" accept="image/*" style={{ ...inputStyle, paddingTop: "0.6rem" }} onChange={(e) => setLogo(e.target.files?.[0])} />
          </div>
        </div>
        <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" size="sm" loading={salvando} onClick={handleSalvar}>Salvar alterações</Button>
        </div>
      </Card>

      {/* Reatribuir dono */}
      <Card padding="lg">
        <h3 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>Reatribuir dono</h3>
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Dono atual: <strong style={{ color: "var(--color-text-secondary)" }}>{campeonato.organizadorNome ?? organizadorAtual?.nome ?? "—"}</strong>. Busque o novo organizador pelo nome ou email.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 280px" }}>
            <SearchableSelect
              label="Novo organizador de campeonato"
              value={novoOrganizador}
              onChange={setNovoOrganizador}
              placeholder="Selecione o organizador"
              searchPlaceholder="Buscar por nome ou email..."
              emptyText="Nenhum organizador encontrado."
              options={organizadores.map((org) => ({ value: org.id, label: org.nome, sublabel: org.email }))}
            />
          </div>
          <Button variant="secondary" size="sm" loading={reatribuindo} onClick={abrirReatribuir}>Reatribuir</Button>
        </div>
      </Card>

      {/* Confirmação por senha (excluir / reatribuir) */}
      <PasswordConfirmModal
        isOpen={acaoSenha !== null}
        title={acaoSenha === "excluir" ? "Excluir campeonato" : "Confirmar alteração de dono"}
        danger={acaoSenha === "excluir"}
        confirmLabel={acaoSenha === "excluir" ? "Excluir" : "Confirmar"}
        description={
          acaoSenha === "excluir" ? (
            <>
              Você vai excluir definitivamente <strong>{campeonato.nome}</strong>, incluindo seus jogos e vínculos. Esta ação não pode ser desfeita.
            </>
          ) : (
            <>
              Você está transferindo <strong>{campeonato.nome}</strong> para{" "}
              <strong style={{ color: "var(--color-brand-primary)" }}>{novoOrgNome}</strong>.
            </>
          )
        }
        onConfirm={executarAcaoSenha}
        onClose={() => setAcaoSenha(null)}
      />
    </div>
  );
}
