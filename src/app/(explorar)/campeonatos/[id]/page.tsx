"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Calendar, Users, MapPin, ChevronRight, UserCog,
  Swords, BarChart3, GitFork, type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { CampeaoBanner } from "@/components/molecules/CampeaoBanner";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { Chaveamento } from "@/components/organisms/Chaveamento";
import { TabelaClassificacao } from "@/components/organisms/TabelaClassificacao";
import { fadeInUp, getFadeTransition, containerVariants, itemVariants } from "@/lib/motion";
import { obterStatusCampeonato, formatarDataJogo, obterCampeao } from "@/lib/campeonato.ui";
import { useObterCampeonatoPorIdQuery, useListarTodosOsTimesQuery } from "@/store/api/campeonatoApi";
import {
  useObterClassificacaoQuery,
  useObterChaveamentoQuery,
  useListarJogosQuery,
} from "@/store/api/partidaApi";
import { FORMATO_CAMPEONATO, type FormatoCampeonato } from "@/types/campeonato";

type Aba = "times" | "jogos" | "classificacao" | "chaveamento";

interface JogoView {
  id: string;
  casa: string;
  visitante: string;
  logoCasa: string | null;
  logoVisitante: string | null;
  golsCasa: number;
  golsVisitante: number;
  finalizado: boolean;
  dataHora: string | null;
  etiqueta: string;
  grupo: string;
}

function formatoLabel(formato: string): string {
  const cfg = FORMATO_CAMPEONATO[formato as FormatoCampeonato];
  return cfg ? cfg.label : formato;
}

// ─── Linha de jogo clicável → detalhe do jogo ─────────────────────────────────

function JogoRow({ jogo }: { jogo: JogoView }) {
  const dataFormatada = formatarDataJogo(jogo.dataHora);
  return (
    <Link href={`/jogos/${jogo.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "var(--space-3)",
          padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)",
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {jogo.casa}
          </span>
          <Avatar name={jogo.casa} src={jogo.logoCasa || undefined} size="sm" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "62px" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: jogo.finalizado ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}>
            {jogo.finalizado ? `${jogo.golsCasa} × ${jogo.golsVisitante}` : "×"}
          </span>
          {dataFormatada && (
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{dataFormatada}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Avatar name={jogo.visitante} src={jogo.logoVisitante || undefined} size="sm" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {jogo.visitante}
          </span>
        </div>

        <Icon icon={ChevronRight} size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
      </div>
    </Link>
  );
}

function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Card padding="lg" style={{ textAlign: "center" }}>
      <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>{titulo}</p>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{descricao}</p>
    </Card>
  );
}

export default function ExplorarCampeonatoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [aba, setAba] = useState<Aba>("times");
  const [logoAmpliada, setLogoAmpliada] = useState(false);

  const { data: campeonato, isLoading, isError } = useObterCampeonatoPorIdQuery(id);
  const { data: todosOsTimes = [] } = useListarTodosOsTimesQuery();

  const iniciado = !!campeonato && ["EmAndamento", "Finalizado"].includes(campeonato.status);
  const temPontosCorridos = campeonato?.formatoCampeonato === "PontosCorridos" || campeonato?.formatoCampeonato === "Hibrido";
  const temMataMata = campeonato?.formatoCampeonato === "MataMata" || campeonato?.formatoCampeonato === "Hibrido";

  const { data: classificacao = [], isFetching: carregandoClassificacao } = useObterClassificacaoQuery(id, {
    skip: !iniciado || !temPontosCorridos,
  });
  const { data: chaveamento = [], isFetching: carregandoChaveamento } = useObterChaveamentoQuery(id, {
    skip: !iniciado || !temMataMata,
  });
  const { data: jogos = [], isFetching: carregandoJogos } = useListarJogosQuery(id, {
    skip: !iniciado || !temPontosCorridos,
  });

  // Times participantes (enriquecidos com logo/cidade)
  const participantes = useMemo(() => {
    const ids = campeonato?.times ?? [];
    return ids
      .map((timeId) => todosOsTimes.find((t) => t.id === timeId))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [campeonato?.times, todosOsTimes]);

  // Lista unificada de jogos (pontos corridos por rodada + mata-mata por fase)
  const gruposDeJogos = useMemo(() => {
    const grupos = new Map<string, JogoView[]>();
    const add = (chave: string, jogo: JogoView) => {
      const arr = grupos.get(chave) ?? [];
      arr.push(jogo);
      grupos.set(chave, arr);
    };

    if (temPontosCorridos) {
      for (const j of jogos) {
        add(`Rodada ${j.rodada}`, {
          id: j.id, casa: j.nomeTimeCasa, visitante: j.nomeTimeVisitante,
          logoCasa: j.logoTimeCasa, logoVisitante: j.logoTimeVisitante,
          golsCasa: j.golsTimeCasa, golsVisitante: j.golsTimeVisitante,
          finalizado: j.finalizado, dataHora: j.dataHora,
          etiqueta: `Rodada ${j.rodada}`, grupo: `Rodada ${j.rodada}`,
        });
      }
    }
    if (temMataMata) {
      for (const fase of chaveamento) {
        for (const p of fase.partidas) {
          if (p.timeCasa === "A definir" && p.timeVisitante === "A definir") continue;
          add(fase.fase, {
            id: p.id, casa: p.timeCasa, visitante: p.timeVisitante,
            logoCasa: p.logoCasa, logoVisitante: p.logoVisitante,
            golsCasa: p.golsCasa, golsVisitante: p.golsVisitante,
            finalizado: p.finalizado, dataHora: p.dataHora,
            etiqueta: fase.fase, grupo: fase.fase,
          });
        }
      }
    }
    return Array.from(grupos.entries());
  }, [jogos, chaveamento, temPontosCorridos, temMataMata]);

  if (isLoading) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando campeonato" />
      </main>
    );
  }

  if (isError || !campeonato) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Campeonato não encontrado.</p>
        <Link href="/campeonatos" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para campeonatos
        </Link>
      </main>
    );
  }

  const statusCfg = obterStatusCampeonato(campeonato.status);
  // Usa a coluna do backend; se ainda não estiver preenchida (ex.: finalizado
  // pela passagem da data), calcula o campeão a partir da tabela/chaveamento.
  const campeao = campeonato.status === "Finalizado"
    ? (campeonato.vencedorTimeNome
        ? { nome: campeonato.vencedorTimeNome, logoUrl: campeonato.vencedorTimeLogo }
        : obterCampeao(campeonato.formatoCampeonato, classificacao, chaveamento))
    : null;
  const dataInicio = new Date(campeonato.dataInicio);
  const dataFim = new Date(campeonato.dataFim);
  const mostrarDataInicio = !["EmAndamento", "Finalizado"].includes(campeonato.status);

  const TABS: { key: Aba; label: string; icon: LucideIcon; visivel: boolean }[] = [
    { key: "times", label: "Times", icon: Users, visivel: true },
    { key: "jogos", label: "Jogos & Resultados", icon: Swords, visivel: true },
    { key: "classificacao", label: "Classificação", icon: BarChart3, visivel: temPontosCorridos },
    { key: "chaveamento", label: "Chaveamento", icon: GitFork, visivel: temMataMata },
  ];
  const tabsVisiveis = TABS.filter((t) => t.visivel);
  const abaAtual = tabsVisiveis.some((t) => t.key === aba) ? aba : "times";

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BotaoVoltar fallbackHref="/campeonatos" />
      </div>

      {/* Hero */}
      <Card
        padding="lg"
        style={{
          background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-5)", alignItems: "center" }}>
          <div
            {...(campeonato.logoUrl
              ? {
                  role: "button" as const,
                  tabIndex: 0,
                  onClick: () => setLogoAmpliada(true),
                  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLogoAmpliada(true); }
                  },
                  title: "Ampliar logo",
                }
              : {})}
            style={{
              width: "4.75rem", height: "4.75rem", borderRadius: "var(--radius-xl)",
              background: campeonato.logoUrl ? `center / cover no-repeat url("${campeonato.logoUrl}")` : "linear-gradient(150deg, rgba(0,230,118,0.22), rgba(0,230,118,0.04))",
              border: "1px solid rgba(0,230,118,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
              cursor: campeonato.logoUrl ? "zoom-in" : "default", outline: "none",
              boxShadow: "0 0 0 4px rgba(0,230,118,0.08), 0 10px 28px rgba(0,230,118,0.2)",
            }}
          >
            {!campeonato.logoUrl && <Icon icon={Trophy} size={30} style={{ color: "var(--color-brand-primary)" }} />}
          </div>

          <div style={{ flex: 1, minWidth: "240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
              <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                {campeonato.nome}
              </h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                <Icon icon={Trophy} size={12} style={{ color: "var(--color-text-muted)" }} />
                {formatoLabel(campeonato.formatoCampeonato)}
              </span>
              {campeonato.organizadorNome && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  <Icon icon={UserCog} size={12} style={{ color: "var(--color-text-muted)" }} />
                  Organizado por {campeonato.organizadorNome}
                </span>
              )}
              {mostrarDataInicio && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  <Icon icon={Calendar} size={12} style={{ color: "var(--color-text-muted)" }} />
                  Início {dataInicio.toLocaleDateString("pt-BR")}
                </span>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                <Icon icon={Calendar} size={12} style={{ color: "var(--color-text-muted)" }} />
                Término {dataFim.toLocaleDateString("pt-BR")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                <Icon icon={Users} size={12} style={{ color: "var(--color-text-muted)" }} />
                {campeonato.totalTimes} {campeonato.totalTimes === 1 ? "time" : "times"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Campeão (campeonato finalizado) */}
      {campeao && <CampeaoBanner nome={campeao.nome} logoUrl={campeao.logoUrl} />}

      {/* Abas */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-5)", padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        {tabsVisiveis.map((t) => {
          const ativo = abaAtual === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              style={{
                flex: "1 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap",
                background: ativo ? "rgba(0,230,118,0.12)" : "transparent",
                color: ativo ? "var(--color-brand-primary)" : "var(--color-text-muted)",
                boxShadow: ativo ? "0 1px 8px rgba(0,230,118,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              <Icon icon={t.icon} size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das abas */}
      {abaAtual === "times" && (
        participantes.length === 0 ? (
          <EmptyState titulo="Nenhum time confirmado" descricao="Os times participantes aparecem aqui assim que confirmarem presença." />
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
            {participantes.map((time) => (
              <motion.div key={time.id} variants={itemVariants}>
                <Link href={`/times/${time.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <Avatar name={time.nome} src={time.logoUrl || undefined} size="md" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{time.nome}</p>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon icon={MapPin} size={11} />
                        {time.cidade} · {time.estado}
                      </p>
                    </div>
                    <Icon icon={ChevronRight} size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      {abaAtual === "jogos" && (
        !iniciado ? (
          <EmptyState titulo="Jogos ainda não disponíveis" descricao="A tabela de jogos é publicada quando o campeonato é iniciado." />
        ) : (carregandoJogos || carregandoChaveamento) ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
            <Spinner size="md" ariaLabel="Carregando jogos" />
          </div>
        ) : gruposDeJogos.length === 0 ? (
          <EmptyState titulo="Nenhum jogo publicado" descricao="Assim que os jogos forem gerados, eles aparecem aqui." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {gruposDeJogos.map(([grupo, lista]) => (
              <div key={grupo}>
                <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-xs)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  {grupo}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {lista.map((jogo) => <JogoRow key={jogo.id} jogo={jogo} />)}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {abaAtual === "classificacao" && (
        !iniciado ? (
          <EmptyState titulo="Classificação indisponível" descricao="A tabela aparece após o início do campeonato e o lançamento dos placares." />
        ) : carregandoClassificacao ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
            <Spinner size="md" ariaLabel="Carregando classificação" />
          </div>
        ) : classificacao.length === 0 ? (
          <EmptyState titulo="Classificação indisponível" descricao="A tabela aparece após o lançamento dos placares." />
        ) : (
          <TabelaClassificacao
            tabela={classificacao}
            destacarAte={campeonato.formatoCampeonato === "Hibrido" ? campeonato.quantidadeTimesClassificam : 0}
          />
        )
      )}

      {abaAtual === "chaveamento" && (
        !iniciado ? (
          <EmptyState titulo="Chaveamento indisponível" descricao="O chaveamento aparece após o início da fase eliminatória." />
        ) : carregandoChaveamento ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
            <Spinner size="md" ariaLabel="Carregando chaveamento" />
          </div>
        ) : chaveamento.length === 0 ? (
          <EmptyState titulo="Chaveamento indisponível" descricao="Os confrontos eliminatórios aparecem aqui quando definidos." />
        ) : (
          <Chaveamento chaveamento={chaveamento} />
        )
      )}

      {/* Modal logo ampliada */}
      {logoAmpliada && campeonato.logoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualizar logo do campeonato"
          onClick={() => setLogoAmpliada(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", backdropFilter: "blur(3px)" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ width: "min(80vw, 320px)", height: "min(80vw, 320px)", borderRadius: "var(--radius-2xl)", background: `center / contain no-repeat url("${campeonato.logoUrl}")`, border: "1px solid rgba(0,230,118,0.35)" }} />
            <button
              type="button"
              onClick={() => setLogoAmpliada(false)}
              style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "white", borderRadius: "var(--radius-full)", padding: "6px 12px", fontSize: "var(--text-sm)", cursor: "pointer" }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </motion.main>
  );
}
