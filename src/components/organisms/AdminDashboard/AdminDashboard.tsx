/**
 * @file AdminDashboard.tsx
 * @description Dashboard gerencial do administrador: filtros (período + esporte),
 * indicadores, gráficos e exportação em CSV/PDF — tudo sobre o mesmo recorte,
 * vindo de `GET /api/relatorios/administrativo`.
 */

"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Flag,
  Info,
  Shield,
  Trophy,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { GraficoBarrasHorizontais } from "./GraficoBarrasHorizontais";
import { GraficoVendasPorDia } from "./GraficoVendasPorDia";
import { SituacaoIngressos } from "./SituacaoIngressos";
import { Button } from "@/components/atoms/Button";
import { DateInput } from "@/components/atoms/DateInput";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/components/atoms/Toast";
import { EsporteFilterSelect } from "@/components/molecules/EsporteFilterSelect";
import { ErrorState } from "@/components/molecules/ErrorState";
import { KpiCard } from "@/components/molecules/KpiCard";
import {
  exportarCsvRelatorioAdministrativo,
  exportarPdfRelatorioAdministrativo,
} from "@/lib/relatorio.export";
import {
  NOTA_USUARIOS_GLOBAIS,
  PERIODO_PRESETS,
  calcularPeriodo,
  descreverPeriodo,
  montarIndicadores,
  notaReceitaSemData,
  preencherSerieDiaria,
  rotuloPerfil,
  validarPeriodoPersonalizado,
  type ChaveIndicador,
  type Periodo,
  type PeriodoPreset,
} from "@/lib/relatorio.utils";
import { useListarEsportesQuery } from "@/store/api/esporteApi";
import { useObterRelatorioAdministrativoQuery } from "@/store/api/relatorioApi";

type SelecaoPeriodo = PeriodoPreset | "personalizado";

const OPCOES_PERIODO: { valor: SelecaoPeriodo; rotulo: string }[] = [
  ...PERIODO_PRESETS,
  { valor: "personalizado", rotulo: "Personalizado" },
];

const ICONES_INDICADOR: Record<ChaveIndicador, LucideIcon> = {
  receita: DollarSign,
  comparecimento: CalendarCheck,
  novosUsuarios: UserPlus,
  campeonatosEmAndamento: Trophy,
  partidasRealizadas: Flag,
  timesAtivos: Shield,
};

/** Aviso de escopo/definição: texto em cor primária (legível no celular), nunca só cor. */
function Aviso({ children }: { children: ReactNode }) {
  return (
    <p
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-2)",
        margin: 0,
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-strong)",
        background: "var(--color-feedback-info-bg)",
        color: "var(--color-text-primary)",
        fontSize: "var(--text-sm)",
        lineHeight: 1.4,
      }}
    >
      <Icon
        icon={Info}
        size={16}
        color="var(--color-feedback-info)"
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <span>{children}</span>
    </p>
  );
}

const estiloBotaoPeriodo = (ativo: boolean) => ({
  height: "32px",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-md)",
  border: ativo ? "1px solid rgba(0,230,118,0.4)" : "1px solid rgba(255,255,255,0.08)",
  background: ativo ? "rgba(0,230,118,0.12)" : "rgba(255,255,255,0.04)",
  color: ativo ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
});

export function AdminDashboard() {
  const toast = useToast();
  const [selecao, setSelecao] = useState<SelecaoPeriodo>("30d");
  const [inicioPersonalizado, setInicioPersonalizado] = useState("");
  const [fimPersonalizado, setFimPersonalizado] = useState("");
  const [esporteId, setEsporteId] = useState("todos");
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const periodo: Periodo = useMemo(
    () =>
      selecao === "personalizado"
        ? { inicio: inicioPersonalizado || undefined, fim: fimPersonalizado || undefined }
        : calcularPeriodo(selecao),
    [selecao, inicioPersonalizado, fimPersonalizado],
  );
  const erroPeriodo = selecao === "personalizado" ? validarPeriodoPersonalizado(periodo) : null;
  const periodoInvalido = erroPeriodo !== null;
  const filtrandoEsporte = esporteId !== "todos";

  const { data: esportes = [] } = useListarEsportesQuery();
  const {
    data: relatorio,
    // `data` guarda o último resultado mesmo após trocar o filtro; exportação usa só o do filtro atual.
    currentData: relatorioAtual,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useObterRelatorioAdministrativoQuery(
    { ...periodo, esporteId: filtrandoEsporte ? esporteId : undefined },
    // Relatório agregado: ao reabrir o painel, refaz a consulta se o cache tiver mais de 30s.
    { skip: periodoInvalido, refetchOnMountOrArgChange: 30 },
  );

  const nomeEsporte = esportes.find((e) => e.id === esporteId)?.nome ?? "Todos os esportes";
  const contextoExportacao = {
    periodo: descreverPeriodo(periodo),
    esporte: filtrandoEsporte ? nomeEsporte : "Todos os esportes",
  };

  // Usa o período devolvido pela API (o mesmo do CSV/PDF), não o do filtro que ainda pode estar carregando.
  const serieDiaria = useMemo(
    () =>
      relatorio
        ? preencherSerieDiaria(relatorio.vendasPorDia, relatorio.inicio, relatorio.fim)
        : [],
    [relatorio],
  );

  const exportarPdf = async () => {
    if (!relatorioAtual) return;
    setGerandoPdf(true);
    try {
      await exportarPdfRelatorioAdministrativo(relatorioAtual, contextoExportacao);
    } catch {
      toast.error("Não foi possível gerar o PDF do relatório.");
    } finally {
      setGerandoPdf(false);
    }
  };

  const podeExportar = Boolean(relatorioAtual) && !isFetching && !isError && !periodoInvalido;
  const notaSemData = relatorio ? notaReceitaSemData(relatorio) : null;

  return (
    <section aria-label="Dashboard gerencial">
      {/* Filtros: uma linha acima de todo o conteúdo que eles recortam. */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-2)",
          marginBottom: "var(--space-3)",
        }}
      >
        <div
          role="group"
          aria-label="Período"
          style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}
        >
          {OPCOES_PERIODO.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={selecao === opcao.valor}
              onClick={() => setSelecao(opcao.valor)}
              style={estiloBotaoPeriodo(selecao === opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
        <div style={{ width: "220px", maxWidth: "100%", display: "flex" }}>
          <EsporteFilterSelect value={esporteId} onChange={setEsporteId} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", marginLeft: "auto" }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!podeExportar}
            onClick={() =>
              relatorioAtual &&
              exportarCsvRelatorioAdministrativo(relatorioAtual, contextoExportacao)
            }
          >
            <Icon icon={FileSpreadsheet} size={16} /> Exportar CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!podeExportar}
            loading={gerandoPdf}
            onClick={exportarPdf}
          >
            <Icon icon={FileText} size={16} /> Exportar PDF
          </Button>
        </div>
      </div>

      {selecao === "personalizado" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-3)",
            maxWidth: 480,
          }}
        >
          <div style={{ flex: "1 1 180px" }}>
            <DateInput
              id="relatorio-inicio"
              label="Data inicial"
              value={inicioPersonalizado}
              max={fimPersonalizado || undefined}
              onChange={(e) => setInicioPersonalizado(e.target.value)}
            />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <DateInput
              id="relatorio-fim"
              label="Data final"
              value={fimPersonalizado}
              min={inicioPersonalizado || undefined}
              onChange={(e) => setFimPersonalizado(e.target.value)}
              aria-invalid={periodoInvalido}
              aria-describedby={periodoInvalido ? "relatorio-erro-periodo" : undefined}
            />
          </div>
        </div>
      )}

      {/* Recorte aplicado: texto em cor primária e quebra em linhas no celular. */}
      <div style={{ display: "grid", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
        <p
          aria-live="polite"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-1) var(--space-4)",
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>
            Período:{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {descreverPeriodo(periodo)}
            </strong>
          </span>
          <span>
            Esporte:{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {contextoExportacao.esporte}
            </strong>
          </span>
        </p>
        {filtrandoEsporte && <Aviso>{NOTA_USUARIOS_GLOBAIS}</Aviso>}
        {notaSemData && !periodoInvalido && <Aviso>{notaSemData}</Aviso>}
      </div>

      {periodoInvalido ? (
        <p
          id="relatorio-erro-periodo"
          role="alert"
          style={{ color: "var(--color-feedback-danger)", fontSize: "var(--text-sm)" }}
        >
          {erroPeriodo}
        </p>
      ) : isLoading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}
          aria-busy="true"
        >
          <Spinner size="lg" ariaLabel="Carregando relatório" />
        </div>
      ) : isError || !relatorio ? (
        <ErrorState
          title="Não foi possível carregar o relatório"
          message="Houve uma falha de conexão com o servidor. Os indicadores não representam zero de verdade."
          onRetry={refetch}
        />
      ) : (
        // Ao trocar filtro, mantém o último resultado esmaecido em vez de piscar um spinner.
        <div
          aria-busy={isFetching}
          style={{ opacity: isFetching ? 0.5 : 1, transition: "opacity 0.2s ease" }}
        >
          {/* No máximo 3 colunas: os 6 indicadores ficam em 2 linhas e valores em R$ não transbordam. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(max(200px, calc((100% - 2 * var(--space-4)) / 3)), 1fr))",
              gap: "var(--space-4)",
              marginBottom: "var(--space-6)",
            }}
          >
            {montarIndicadores(relatorio).map((indicador) => (
              <KpiCard
                key={indicador.chave}
                label={indicador.rotulo}
                value={indicador.valor}
                hint={indicador.dica}
                icon={ICONES_INDICADOR[indicador.chave]}
                badge={indicador.escopo === "atual" ? "Situação atual" : undefined}
              />
            ))}
          </div>

          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <GraficoVendasPorDia
              serie={serieDiaria}
              temConfirmadosSemData={relatorio.resumoFinanceiro.ingressosSemDataPagamento > 0}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
                gap: "var(--space-4)",
              }}
            >
              <SituacaoIngressos resumo={relatorio.resumoFinanceiro} />
              <GraficoBarrasHorizontais
                title="Campeonatos por esporte"
                subtitle="Campeonatos cadastrados em cada esporte · situação atual, não depende do período"
                itens={relatorio.campeonatosPorEsporte}
                unidade={{ singular: "campeonato", plural: "campeonatos" }}
                mensagemVazio="Nenhum campeonato para o filtro selecionado."
              />
            </div>
            <GraficoBarrasHorizontais
              title="Usuários por perfil"
              subtitle="Base total de usuários · não depende do período nem do esporte"
              itens={relatorio.usuariosPorPerfil.map((u) => ({
                nome: rotuloPerfil(u.nome),
                quantidade: u.quantidade,
              }))}
              unidade={{ singular: "usuário", plural: "usuários" }}
              mensagemVazio="Nenhum usuário cadastrado."
            />
          </div>
        </div>
      )}
    </section>
  );
}
