"use client";

import { use } from "react";
import {
  Calendar,
  CircleDollarSign,
  MapPin,
  Package,
  ReceiptText,
  Ticket,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { ContagemRegressivaJogo } from "@/components/molecules/ContagemRegressivaJogo";
import { IngressoLotesManager } from "@/components/organisms/IngressoLotesManager";
import { useObterPartidaQuery } from "@/store/api/partidaApi";
import { useListarTimesOrganizadorQuery } from "@/store/api/timeApi";
import { useObterLotesPorPartidaQuery } from "@/store/api/ingressoApi";

function Metrica({
  icon,
  label,
  valor,
  destaque,
}: {
  icon: typeof Ticket;
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <Card
      padding="md"
      style={{
        background: destaque ? "rgba(0,230,118,.07)" : "rgba(255,255,255,.025)",
        border: destaque ? "1px solid rgba(0,230,118,.22)" : "1px solid rgba(255,255,255,.07)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon
          icon={icon}
          size={15}
          style={{ color: destaque ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}
        />
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
          {label}
        </span>
      </div>
      <strong
        style={{
          color: destaque ? "var(--color-brand-primary)" : "white",
          fontSize: "var(--text-xl)",
        }}
      >
        {valor}
      </strong>
    </Card>
  );
}

export default function DetalheJogoOrganizadorTimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: partida, isLoading, isError } = useObterPartidaQuery(id);
  const { data: times = [], isLoading: carregandoTimes } = useListarTimesOrganizadorQuery();
  const nomesTimes = new Set(times.map((time) => time.nome.trim().toLocaleLowerCase("pt-BR")));
  const ehMandante = Boolean(
    partida && nomesTimes.has(partida.nomeTimeCasa.trim().toLocaleLowerCase("pt-BR")),
  );
  const pertenceAoOrganizador = Boolean(
    partida &&
    (nomesTimes.has(partida.nomeTimeCasa.trim().toLocaleLowerCase("pt-BR")) ||
      nomesTimes.has(partida.nomeTimeVisitante.trim().toLocaleLowerCase("pt-BR"))),
  );
  const { data: lotes = [], isLoading: carregandoResumo } = useObterLotesPorPartidaQuery(id);

  if (isLoading || carregandoTimes)
    return (
      <main
        style={{
          minHeight: "55vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size="lg" ariaLabel="Carregando partida" />
      </main>
    );
  if (isError || !partida || !pertenceAoOrganizador)
    return (
      <main
        style={{
          minHeight: "55vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <p style={{ color: "var(--color-feedback-danger)" }}>
          Partida não encontrada entre os seus times.
        </p>
        <BotaoVoltar fallbackHref="/organizador/times/jogos" label="Voltar para os jogos" />
      </main>
    );

  const data = partida.dataHora ? new Date(partida.dataHora) : null;
  const quantidadeTotal = lotes.reduce((total, lote) => total + lote.quantidadeTotal, 0);
  const quantidadeDisponivel = lotes.reduce((total, lote) => total + lote.quantidadeDisponivel, 0);
  const reservasEstimadas = quantidadeTotal - quantidadeDisponivel;
  const receitaEstimada = lotes.reduce(
    (total, lote) => total + (lote.quantidadeTotal - lote.quantidadeDisponivel) * lote.preco,
    0,
  );
  return (
    <main style={{ width: "100%", maxWidth: 920, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <BotaoVoltar fallbackHref="/organizador/times/jogos" label="Voltar para os jogos" />
      </div>
      <Card
        padding="lg"
        style={{
          marginBottom: "var(--space-5)",
          background: "linear-gradient(145deg, rgba(0,230,118,.08), rgba(10,10,10,.96))",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
          <Badge variant={ehMandante ? "success" : "info"}>
            {ehMandante ? "Seu time é mandante" : "Seu time é visitante"}
          </Badge>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "var(--space-4)",
            textAlign: "center",
          }}
        >
          <div>
            <Avatar name={partida.nomeTimeCasa} src={partida.logoTimeCasa || undefined} size="xl" />
            <h2 style={{ color: "white", fontSize: "var(--text-md)", margin: "10px 0 0" }}>
              {partida.nomeTimeCasa}
            </h2>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontSize: "10px",
                textTransform: "uppercase",
              }}
            >
              Mandante
            </span>
          </div>
          <strong
            style={{
              color: partida.finalizado ? "white" : "var(--color-text-muted)",
              fontSize: partida.finalizado ? "var(--text-3xl)" : "var(--text-xl)",
            }}
          >
            {partida.finalizado ? `${partida.golsTimeCasa} × ${partida.golsTimeVisitante}` : "VS"}
          </strong>
          <div>
            <Avatar
              name={partida.nomeTimeVisitante}
              src={partida.logoTimeVisitante || undefined}
              size="xl"
            />
            <h2 style={{ color: "white", fontSize: "var(--text-md)", margin: "10px 0 0" }}>
              {partida.nomeTimeVisitante}
            </h2>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontSize: "10px",
                textTransform: "uppercase",
              }}
            >
              Visitante
            </span>
          </div>
        </div>
        {!partida.finalizado && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-4)" }}>
            <ContagemRegressivaJogo dataHora={partida.dataHora} fallback="Data a definir" />
          </div>
        )}
      </Card>

      <Card padding="md" style={{ marginBottom: "var(--space-5)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon icon={Calendar} size={17} style={{ color: "var(--color-brand-primary)" }} />
            <div>
              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                Data e hora
              </span>
              <p style={{ color: "white", fontSize: "var(--text-sm)", margin: 0 }}>
                {data
                  ? data.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })
                  : "A definir"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon icon={MapPin} size={17} style={{ color: "var(--color-brand-primary)" }} />
            <div>
              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                Local
              </span>
              <p style={{ color: "white", fontSize: "var(--text-sm)", margin: 0 }}>
                {partida.local || "A definir"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {ehMandante ? (
        <>
          <section style={{ marginBottom: "var(--space-5)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "var(--space-3)",
              }}
            >
              <Icon icon={ReceiptText} size={18} style={{ color: "var(--color-brand-primary)" }} />
              <h2 style={{ margin: 0, color: "white", fontSize: "var(--text-lg)" }}>
                Resumo estimado dos lotes
              </h2>
            </div>
            <p
              style={{
                margin: "calc(var(--space-3) * -1) 0 var(--space-3)",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-xs)",
              }}
            >
              Estimativa calculada pelo estoque dos lotes. Não representa pagamentos confirmados.
            </p>
            {carregandoResumo ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
                <Spinner size="md" ariaLabel="Carregando vendas" />
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <Metrica
                    icon={CircleDollarSign}
                    label="Receita potencial"
                    valor={receitaEstimada.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                    destaque
                  />
                  <Metrica
                    icon={Ticket}
                    label="Reservas estimadas"
                    valor={String(reservasEstimadas)}
                  />
                  <Metrica icon={Users} label="Capacidade total" valor={String(quantidadeTotal)} />
                  <Metrica
                    icon={Package}
                    label="Estoque disponível"
                    valor={String(quantidadeDisponivel)}
                  />
                </div>
                {lotes.length > 0 && (
                  <Card padding="md">
                    <div style={{ display: "grid", gap: "var(--space-2)" }}>
                      {lotes.map((lote) => (
                        <div
                          key={lote.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(120px, 1fr) repeat(3, auto)",
                            gap: "var(--space-4)",
                            alignItems: "center",
                            padding: "var(--space-3)",
                            background: "rgba(255,255,255,.025)",
                            borderRadius: "var(--radius-lg)",
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                display: "block",
                                color: "white",
                                fontSize: "var(--text-sm)",
                              }}
                            >
                              {lote.nomeLote}
                            </strong>
                            <span
                              style={{
                                color: "var(--color-text-muted)",
                                fontSize: "var(--text-xs)",
                              }}
                            >
                              {lote.preco.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </div>
                          <span
                            style={{
                              color: "var(--color-text-secondary)",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            <Icon icon={Users} size={12} style={{ display: "inline" }} />{" "}
                            {lote.quantidadeTotal - lote.quantidadeDisponivel} reservados
                          </span>
                          <span
                            style={{
                              color: "var(--color-text-secondary)",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            {lote.quantidadeDisponivel} restantes
                          </span>
                          <strong
                            style={{
                              color: "var(--color-brand-primary)",
                              fontSize: "var(--text-sm)",
                            }}
                          >
                            {(
                              (lote.quantidadeTotal - lote.quantidadeDisponivel) *
                              lote.preco
                            ).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </section>
          <IngressoLotesManager partidaId={id} partidaFinalizada={partida.finalizado} />
        </>
      ) : (
        <Card
          padding="lg"
          style={{ border: "1px solid rgba(255,255,255,.08)", textAlign: "center" }}
        >
          <Icon
            icon={Ticket}
            size={28}
            style={{ color: "var(--color-text-muted)", margin: "0 auto 10px" }}
          />
          <h2 style={{ color: "white", fontSize: "var(--text-md)" }}>
            Gestão de ingressos do mandante
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", margin: 0 }}>
            Nesta partida seu time é visitante. Somente o organizador do time mandante pode criar
            lotes e consultar as vendas.
          </p>
        </Card>
      )}
    </main>
  );
}
