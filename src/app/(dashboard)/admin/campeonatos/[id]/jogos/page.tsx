/**
 * @file (dashboard)/admin/campeonatos/[id]/jogos/page.tsx
 * @description Gestão manual de jogos: criar, editar (times/rodada/fase/agenda),
 * editar placar com recálculo da chave e excluir.
 */

"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { Select } from "@/components/atoms/Select";
import { DateInput } from "@/components/atoms/DateInput";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { Modal } from "@/components/molecules/Modal";
import { useToast } from "@/components/atoms/Toast";
import { useObterCampeonatoPorIdQuery } from "@/store/api/campeonatoApi";
import {
  useListarJogosQuery,
  useObterChaveamentoQuery,
  useCriarPartidaAdminMutation,
  useEditarPartidaAdminMutation,
  useDeletarPartidaAdminMutation,
  useAtualizarPlacarAdminMutation,
} from "@/store/api/partidaApi";
import { useListarTodosTimesQuery } from "@/store/api/timeApi";
import { FASE_MATA_MATA } from "@/types/admin";

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
const labelStyle: React.CSSProperties = { display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)", fontWeight: 600 };

const FASES_MATA = ["Oitavas", "Quartas", "Semifinais", "Final"];

interface JogoModalState {
  mode: "criar" | "editar";
  partidaId?: string;
  timeCasaId: string;
  timeVisitanteId: string;
  dataHora: string;
  local: string;
  tipo: "pontos" | "mata";
  rodada: number;
  fase: string;
  numeroJogoChave: number;
  golsTimeCasa: number;
  golsTimeVisitante: number;
  finalizado: boolean;
}

const novoJogoVazio = (): JogoModalState => ({
  mode: "criar",
  timeCasaId: "",
  timeVisitanteId: "",
  dataHora: "",
  local: "",
  tipo: "pontos",
  rodada: 1,
  fase: "Quartas",
  numeroJogoChave: 1,
  golsTimeCasa: 0,
  golsTimeVisitante: 0,
  finalizado: false,
});

export default function AdminJogosPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const { success, error } = useToast();

  const { data: campeonato } = useObterCampeonatoPorIdQuery(id);
  const { data: jogos = [], isLoading: loadingJogos } = useListarJogosQuery(id);
  const { data: chaveamento = [], isLoading: loadingChave } = useObterChaveamentoQuery(id);
  const { data: times = [] } = useListarTodosTimesQuery();

  const [criar, { isLoading: criando }] = useCriarPartidaAdminMutation();
  const [editar, { isLoading: editando }] = useEditarPartidaAdminMutation();
  const [deletar, { isLoading: excluindoJogo }] = useDeletarPartidaAdminMutation();
  const [salvarPlacar, { isLoading: salvandoPlacar }] = useAtualizarPlacarAdminMutation();

  const [jogoModal, setJogoModal] = useState<JogoModalState | null>(null);
  const [placarModal, setPlacarModal] = useState<{ partidaId: string; golsTimeCasa: number; golsTimeVisitante: number } | null>(null);
  const [jogoParaExcluir, setJogoParaExcluir] = useState<string | null>(null);

  // Opções de times: os do campeonato, com fallback para todos.
  const timeOptions = useMemo(() => {
    if (campeonato?.times?.length) {
      const set = new Set(campeonato.times);
      const doCamp = times.filter((t) => set.has(t.id));
      if (doCamp.length) return doCamp;
    }
    return times;
  }, [campeonato, times]);

  const idPorNome = (nome: string) => times.find((t) => t.nome === nome)?.id ?? "";

  const abrirEditarPontos = (jogo: { id: string; rodada: number; nomeTimeCasa: string; nomeTimeVisitante: string; dataHora: string | null }) => {
    setJogoModal({
      mode: "editar",
      partidaId: jogo.id,
      timeCasaId: idPorNome(jogo.nomeTimeCasa),
      timeVisitanteId: idPorNome(jogo.nomeTimeVisitante),
      dataHora: jogo.dataHora ? jogo.dataHora.slice(0, 16) : "",
      local: "",
      tipo: "pontos",
      rodada: jogo.rodada,
      fase: "Quartas",
      numeroJogoChave: 0,
      golsTimeCasa: 0,
      golsTimeVisitante: 0,
      finalizado: false,
    });
  };

  const abrirEditarMata = (fase: string, p: { id: string; numeroJogoChave: number; timeCasa: string; timeVisitante: string; dataHora: string | null }) => {
    setJogoModal({
      mode: "editar",
      partidaId: p.id,
      timeCasaId: idPorNome(p.timeCasa),
      timeVisitanteId: idPorNome(p.timeVisitante),
      dataHora: p.dataHora ? p.dataHora.slice(0, 16) : "",
      local: "",
      tipo: "mata",
      rodada: 0,
      fase: FASES_MATA.includes(fase) ? fase : "Quartas",
      numeroJogoChave: p.numeroJogoChave,
      golsTimeCasa: 0,
      golsTimeVisitante: 0,
      finalizado: false,
    });
  };

  const handleSalvarJogo = async () => {
    if (!jogoModal) return;

    // Validações
    if (jogoModal.timeCasaId && jogoModal.timeVisitanteId && jogoModal.timeCasaId === jogoModal.timeVisitanteId) {
      return error("Os dois times devem ser diferentes.");
    }
    if (Number(jogoModal.golsTimeCasa) < 0 || Number(jogoModal.golsTimeVisitante) < 0) {
      return error("O placar não pode ser negativo.");
    }
    if (jogoModal.tipo === "pontos" && Number(jogoModal.rodada) < 1) {
      return error("A rodada deve ser no mínimo 1.");
    }
    if (jogoModal.tipo === "mata" && Number(jogoModal.numeroJogoChave) < 1) {
      return error("O número do jogo na chave deve ser no mínimo 1.");
    }
    if (jogoModal.mode === "criar" && jogoModal.tipo === "mata" && jogoModal.finalizado && Number(jogoModal.golsTimeCasa) === Number(jogoModal.golsTimeVisitante)) {
      return error("Jogo de mata-mata não pode terminar empatado.");
    }

    const faseNum = jogoModal.tipo === "mata" ? FASE_MATA_MATA[jogoModal.fase] : 0;
    const rodada = jogoModal.tipo === "pontos" ? Number(jogoModal.rodada) : null;
    try {
      if (jogoModal.mode === "criar") {
        await criar({
          campeonatoId: id,
          timeCasaId: jogoModal.timeCasaId || null,
          timeVisitanteId: jogoModal.timeVisitanteId || null,
          golsTimeCasa: Number(jogoModal.golsTimeCasa),
          golsTimeVisitante: Number(jogoModal.golsTimeVisitante),
          dataHora: jogoModal.dataHora || null,
          local: jogoModal.local,
          finalizado: jogoModal.finalizado,
          rodada,
          fase: faseNum,
          numeroJogoChave: Number(jogoModal.numeroJogoChave),
        }).unwrap();
        success("Jogo criado.");
      } else {
        await editar({
          id: jogoModal.partidaId!,
          timeCasaId: jogoModal.timeCasaId || null,
          timeVisitanteId: jogoModal.timeVisitanteId || null,
          dataHora: jogoModal.dataHora || null,
          local: jogoModal.local,
          rodada,
          fase: faseNum,
          numeroJogoChave: Number(jogoModal.numeroJogoChave),
        }).unwrap();
        success("Jogo atualizado.");
      }
      setJogoModal(null);
    } catch {
      error("Não foi possível salvar o jogo.");
    }
  };

  const handleSalvarPlacar = async () => {
    if (!placarModal) return;
    try {
      await salvarPlacar(placarModal).unwrap();
      success("Placar atualizado.");
      setPlacarModal(null);
    } catch (e) {
      const msg = (e as { data?: string })?.data;
      error(typeof msg === "string" ? msg : "Não foi possível atualizar o placar.");
    }
  };

  const confirmarExclusaoJogo = async () => {
    if (!jogoParaExcluir) return;
    try {
      await deletar(jogoParaExcluir).unwrap();
      success("Jogo excluído.");
      setJogoParaExcluir(null);
    } catch {
      error("Não foi possível excluir o jogo.");
    }
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>
            Jogos — {campeonato?.nome ?? ""}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Edite placares (recalcula a chave), troque os times de cada jogo, crie e exclua partidas.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/campeonatos/${id}`)}>Voltar</Button>
          <Button variant="primary" size="sm" onClick={() => setJogoModal(novoJogoVazio())}>+ Novo jogo</Button>
        </div>
      </div>

      {loadingJogos || loadingChave ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="lg" ariaLabel="Carregando jogos" />
        </div>
      ) : (
        <>
          {/* Pontos corridos */}
          {jogos.length > 0 && (
            <Card padding="lg">
              <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>Fase de pontos / rodadas</h3>
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                {jogos.map((j) => (
                  <div key={j.id} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "var(--space-2)" }}>
                    <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Rodada {j.rodada}</span>
                      <div style={{ color: "white", fontSize: "var(--text-sm)" }}>
                        {j.nomeTimeCasa} <strong>{j.golsTimeCasa} x {j.golsTimeVisitante}</strong> {j.nomeTimeVisitante}{" "}
                        {j.finalizado && <Badge variant="default">Encerrado</Badge>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      <Button variant="primary" size="sm" onClick={() => setPlacarModal({ partidaId: j.id, golsTimeCasa: j.golsTimeCasa, golsTimeVisitante: j.golsTimeVisitante })}>Placar</Button>
                      <Button variant="ghost" size="sm" onClick={() => abrirEditarPontos(j)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => setJogoParaExcluir(j.id)}>Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Mata-mata */}
          {chaveamento.length > 0 && (
            <Card padding="lg">
              <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>Mata-mata</h3>
              <div style={{ display: "grid", gap: "var(--space-4)" }}>
                {chaveamento.map((grupo) => (
                  <div key={grupo.fase}>
                    <h4 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-brand-primary)" }}>{grupo.fase}</h4>
                    <div style={{ display: "grid", gap: "var(--space-2)" }}>
                      {grupo.partidas.map((p) => (
                        <div key={p.id} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "var(--space-2)" }}>
                          <div style={{ flex: "1 1 240px", minWidth: 0, color: "white", fontSize: "var(--text-sm)" }}>
                            {p.timeCasa} <strong>{p.golsCasa} x {p.golsVisitante}</strong> {p.timeVisitante}{" "}
                            {p.finalizado && <Badge variant="default">Encerrado</Badge>}
                          </div>
                          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                            <Button variant="primary" size="sm" onClick={() => setPlacarModal({ partidaId: p.id, golsTimeCasa: p.golsCasa, golsTimeVisitante: p.golsVisitante })}>Placar</Button>
                            <Button variant="ghost" size="sm" onClick={() => abrirEditarMata(grupo.fase, p)}>Editar</Button>
                            <Button variant="danger" size="sm" onClick={() => setJogoParaExcluir(p.id)}>Excluir</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {jogos.length === 0 && chaveamento.length === 0 && (
            <Card padding="lg">
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Nenhum jogo cadastrado. Use “+ Novo jogo” para criar manualmente.</p>
            </Card>
          )}
        </>
      )}

      {/* Modal placar */}
      {placarModal && (
        <Modal isOpen onClose={() => setPlacarModal(null)} title="Editar placar">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "0 0 var(--space-3)" }}>
            Em mata-mata, a próxima fase é recalculada automaticamente (bloqueado se o jogo seguinte já ocorreu).
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Gols casa</label>
              <input type="number" min={0} style={inputStyle} value={placarModal.golsTimeCasa} onChange={(e) => setPlacarModal({ ...placarModal, golsTimeCasa: Number(e.target.value) })} />
            </div>
            <span style={{ color: "white", paddingBottom: "8px" }}>x</span>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Gols visitante</label>
              <input type="number" min={0} style={inputStyle} value={placarModal.golsTimeVisitante} onChange={(e) => setPlacarModal({ ...placarModal, golsTimeVisitante: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="ghost" size="sm" onClick={() => setPlacarModal(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={salvandoPlacar} onClick={handleSalvarPlacar}>Salvar placar</Button>
          </div>
        </Modal>
      )}

      {/* Modal jogo (criar/editar) */}
      {jogoModal && (
        <Modal isOpen onClose={() => setJogoModal(null)} title={jogoModal.mode === "criar" ? "Novo jogo" : "Editar jogo"} maxWidth={560}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <Select
                label="Time casa"
                value={jogoModal.timeCasaId}
                onChange={(v) => setJogoModal({ ...jogoModal, timeCasaId: v })}
                options={[{ value: "", label: "A definir" }, ...timeOptions.map((t) => ({ value: t.id, label: t.nome }))]}
              />
              <Select
                label="Time visitante"
                value={jogoModal.timeVisitanteId}
                onChange={(v) => setJogoModal({ ...jogoModal, timeVisitanteId: v })}
                options={[{ value: "", label: "A definir" }, ...timeOptions.map((t) => ({ value: t.id, label: t.nome }))]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <DateInput
                label="Data/hora"
                type="datetime-local"
                value={jogoModal.dataHora}
                onChange={(e) => setJogoModal({ ...jogoModal, dataHora: e.target.value })}
              />
              <div>
                <label style={labelStyle}>Local</label>
                <input style={inputStyle} value={jogoModal.local} onChange={(e) => setJogoModal({ ...jogoModal, local: e.target.value })} />
              </div>
            </div>

            <Select
              label="Tipo de jogo"
              value={jogoModal.tipo}
              onChange={(v) => setJogoModal({ ...jogoModal, tipo: v as "pontos" | "mata" })}
              options={[
                { value: "pontos", label: "Pontos corridos (rodada)" },
                { value: "mata", label: "Mata-mata (fase)" },
              ]}
            />

            {jogoModal.tipo === "pontos" ? (
              <div>
                <label style={labelStyle}>Rodada</label>
                <input type="number" min={1} style={inputStyle} value={jogoModal.rodada} onChange={(e) => setJogoModal({ ...jogoModal, rodada: Number(e.target.value) })} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <Select
                  label="Fase"
                  value={jogoModal.fase}
                  onChange={(v) => setJogoModal({ ...jogoModal, fase: v })}
                  options={FASES_MATA.map((f) => ({ value: f, label: f }))}
                />
                <div>
                  <label style={labelStyle}>Nº do jogo na chave</label>
                  <input type="number" min={1} style={inputStyle} value={jogoModal.numeroJogoChave} onChange={(e) => setJogoModal({ ...jogoModal, numeroJogoChave: Number(e.target.value) })} />
                </div>
              </div>
            )}

            {jogoModal.mode === "criar" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "var(--space-3)", alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>Gols casa</label>
                  <input type="number" min={0} style={inputStyle} value={jogoModal.golsTimeCasa} onChange={(e) => setJogoModal({ ...jogoModal, golsTimeCasa: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={labelStyle}>Gols visitante</label>
                  <input type="number" min={0} style={inputStyle} value={jogoModal.golsTimeVisitante} onChange={(e) => setJogoModal({ ...jogoModal, golsTimeVisitante: Number(e.target.value) })} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", paddingBottom: "8px" }}>
                  <input type="checkbox" checked={jogoModal.finalizado} onChange={(e) => setJogoModal({ ...jogoModal, finalizado: e.target.checked })} />
                  Finalizado
                </label>
              </div>
            )}
          </div>

          <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="ghost" size="sm" onClick={() => setJogoModal(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={criando || editando} onClick={handleSalvarJogo}>Salvar</Button>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={jogoParaExcluir !== null}
        title="Excluir jogo"
        description="Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        loading={excluindoJogo}
        onConfirm={confirmarExclusaoJogo}
        onClose={() => setJogoParaExcluir(null)}
      />
    </div>
  );
}
