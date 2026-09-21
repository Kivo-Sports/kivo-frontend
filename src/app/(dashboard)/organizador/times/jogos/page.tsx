"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin, Trophy } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { ContagemRegressivaJogo } from "@/components/molecules/ContagemRegressivaJogo";
import { useListarJogosOrganizadorTimeQuery } from "@/store/api/partidaApi";
import type { JogoOrganizadorTime } from "@/types/partida";

type Grupo = { titulo: string; descricao: string; jogos: JogoOrganizadorTime[] };

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function agruparJogos(jogos: JogoOrganizadorTime[]): Grupo[] {
  const agora = new Date();
  const emSeteDias = new Date(agora);
  emSeteDias.setDate(emSeteDias.getDate() + 7);
  const hoje: JogoOrganizadorTime[] = [];
  const proximos: JogoOrganizadorTime[] = [];
  const futuros: JogoOrganizadorTime[] = [];
  const aguardando: JogoOrganizadorTime[] = [];
  const semData: JogoOrganizadorTime[] = [];
  const encerrados: JogoOrganizadorTime[] = [];

  jogos.forEach((jogo) => {
    if (jogo.finalizado) return encerrados.push(jogo);
    if (!jogo.dataHora) return semData.push(jogo);
    const data = new Date(jogo.dataHora);
    if (data.getTime() < agora.getTime()) return aguardando.push(jogo);
    if (mesmoDia(data, agora)) return hoje.push(jogo);
    if (data <= emSeteDias) return proximos.push(jogo);
    futuros.push(jogo);
  });

  return [
    { titulo: "Hoje", descricao: "Partidas marcadas para hoje", jogos: hoje },
    { titulo: "Próximos 7 dias", descricao: "Jogos que estão chegando", jogos: proximos },
    { titulo: "Mais adiante", descricao: "Partidas futuras", jogos: futuros },
    {
      titulo: "Aguardando resultado",
      descricao: "Horário encerrado, mas sem placar registrado",
      jogos: aguardando,
    },
    { titulo: "Data a definir", descricao: "Partidas ainda não agendadas", jogos: semData },
    { titulo: "Encerrados", descricao: "Histórico de partidas", jogos: encerrados },
  ].filter((grupo) => grupo.jogos.length > 0);
}

function JogoCard({ jogo }: { jogo: JogoOrganizadorTime }) {
  const data = jogo.dataHora ? new Date(jogo.dataHora) : null;
  return (
    <Link href={`/organizador/times/jogos/${jogo.id}`} style={{ textDecoration: "none" }}>
      <Card
        padding="md"
        style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.07)", height: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "var(--space-2)",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <span
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {jogo.nomeCampeonato}
          </span>
          <Badge size="sm" variant={jogo.ehMandante ? "success" : "info"}>
            {jogo.ehMandante ? "Mandante" : "Visitante"}
          </Badge>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "var(--space-3)",
            textAlign: "center",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Avatar name={jogo.nomeTimeCasa} src={jogo.logoTimeCasa || undefined} size="md" />
            <p
              style={{
                margin: "6px 0 0",
                color: "white",
                fontWeight: 600,
                fontSize: "var(--text-xs)",
              }}
            >
              {jogo.nomeTimeCasa}
            </p>
          </div>
          <strong
            style={{
              color: jogo.finalizado ? "white" : "var(--color-text-muted)",
              fontSize: jogo.finalizado ? "var(--text-lg)" : "var(--text-sm)",
            }}
          >
            {jogo.finalizado ? `${jogo.golsTimeCasa} × ${jogo.golsTimeVisitante}` : "X"}
          </strong>
          <div style={{ minWidth: 0 }}>
            <Avatar
              name={jogo.nomeTimeVisitante}
              src={jogo.logoTimeVisitante || undefined}
              size="md"
            />
            <p
              style={{
                margin: "6px 0 0",
                color: "white",
                fontWeight: 600,
                fontSize: "var(--text-xs)",
              }}
            >
              {jogo.nomeTimeVisitante}
            </p>
          </div>
        </div>
        <div
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-3)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: 7,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-xs)",
            }}
          >
            <Icon icon={CalendarDays} size={13} />
            {data
              ? data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
              : "Data a definir"}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
            }}
          >
            <Icon icon={MapPin} size={13} />
            {jogo.local}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--space-3)",
          }}
        >
          {!jogo.finalizado && jogo.dataHora ? (
            <ContagemRegressivaJogo dataHora={jogo.dataHora} fallback="Em andamento" />
          ) : (
            <span />
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--color-brand-primary)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
            }}
          >
            Ver partida <Icon icon={ChevronRight} size={13} />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default function JogosOrganizadorTimePage() {
  const { data: jogos = [], isLoading, isError, refetch } = useListarJogosOrganizadorTimeQuery();
  const grupos = agruparJogos(jogos);
  return (
    <main style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <BotaoVoltar fallbackHref="/organizador/times" label="Voltar para meus times" />
      </div>
      <PageHeader
        title="Jogos dos meus times"
        subtitle="Acompanhe a agenda, o tempo restante e gerencie ingressos quando seu time for mandante."
      />
      {isLoading ? (
        <div
          style={{
            minHeight: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner size="lg" ariaLabel="Carregando jogos" />
        </div>
      ) : isError ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-feedback-danger)" }}>
            Não foi possível carregar os jogos.
          </p>
          <button
            onClick={() => refetch()}
            style={{
              color: "var(--color-brand-primary)",
              background: "none",
              border: 0,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </Card>
      ) : grupos.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <Icon
            icon={Trophy}
            size={34}
            style={{ color: "var(--color-text-muted)", margin: "0 auto 12px" }}
          />
          <h2 style={{ color: "white", fontSize: "var(--text-md)" }}>Nenhuma partida encontrada</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Os jogos aparecerão aqui quando seus times participarem de campeonatos.
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-7)" }}>
          {grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: "var(--space-3)",
                }}
              >
                <Icon icon={Clock} size={17} style={{ color: "var(--color-brand-primary)" }} />
                <div>
                  <h2 style={{ margin: 0, color: "white", fontSize: "var(--text-md)" }}>
                    {grupo.titulo}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    {grupo.descricao} · {grupo.jogos.length}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
                  gap: "var(--space-3)",
                }}
              >
                {grupo.jogos.map((jogo) => (
                  <JogoCard key={jogo.id} jogo={jogo} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
