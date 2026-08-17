/**
 * @file (dashboard)/torcedor/page.tsx
 * @description Painel do torcedor: times e campeonatos favoritos (controláveis) +
 * timeline com os próximos jogos dos favoritos. Padrão Kivo.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/molecules/Modal";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { FavoriteButton } from "@/components/molecules/FavoriteButton";
import { CalendarClock, Heart, Shield, Trophy, ChevronRight, MapPin, Ticket } from "lucide-react";
import type { FavoritoTimeItem, FavoritoCampeonatoItem } from "@/types/favorito";
import { useAppSelector } from "@/store/hooks";
import { useListarFavoritosQuery, useObterTimelineFavoritosQuery } from "@/store/api/favoritoApi";
import { obterStatusCampeonato } from "@/lib/campeonato.ui";
import type { TimelineItem } from "@/types/favorito";
import { useObterPartidasComIngressosQuery } from "@/store/api/ingressoApi";
import { StatusIngresso } from "@/types/ingresso";
import { useIngressosSimulados } from "@/lib/ingresso.mock";

function formatarDataHora(iso: string | null): { dia: string; hora: string } {
  if (!iso) return { dia: "A definir", hora: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dia: "A definir", hora: "" };
  return {
    dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: typeof Heart;
  title: string;
  count?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        marginBottom: "var(--space-3)",
      }}
    >
      <Icon icon={icon} size={18} color="var(--color-brand-primary)" />
      <h2
        style={{ margin: 0, fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 700, color: "white" }}
      >
        {title}
      </h2>
      {typeof count === "number" && count > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 20,
            height: 20,
            borderRadius: "var(--radius-full)",
            background: "rgba(0,230,118,0.12)",
            color: "var(--color-brand-primary)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            padding: "0 6px",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyCard({ texto, href, cta }: { texto: string; href: string; cta: string }) {
  return (
    <Card padding="lg" style={{ textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
      <p
        style={{
          margin: "0 0 var(--space-3)",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-sm)",
        }}
      >
        {texto}
      </p>
      <Link
        href={href}
        style={{
          color: "var(--color-brand-primary)",
          textDecoration: "none",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
        }}
      >
        {cta} →
      </Link>
    </Card>
  );
}

function TimelineRow({ jogo }: { jogo: TimelineItem }) {
  const { dia, hora } = formatarDataHora(jogo.dataHora);
  return (
    <Link href={`/jogos/${jogo.partidaId}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-lg)",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,230,118,0.06)";
          e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.025)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        }}
      >
        {/* Data */}
        <div
          style={{
            flexShrink: 0,
            textAlign: "center",
            minWidth: "54px",
            padding: "6px 8px",
            borderRadius: "var(--radius-md)",
            background: "rgba(0,230,118,0.08)",
            border: "1px solid rgba(0,230,118,0.2)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              color: "var(--color-brand-primary)",
              textTransform: "uppercase",
            }}
          >
            {dia}
          </div>
          {hora && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{hora}</div>}
        </div>

        {/* Confronto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
              <Avatar name={jogo.timeCasa} src={jogo.logoCasa || undefined} size="sm" />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                {jogo.timeCasa}
              </span>
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>x</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
              <Avatar name={jogo.timeVisitante} src={jogo.logoVisitante || undefined} size="sm" />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                {jogo.timeVisitante}
              </span>
            </span>
          </div>
          <div
            style={{
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {jogo.campeonatoNome}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-brand-primary)",
                background: "rgba(0,230,118,0.1)",
                borderRadius: "var(--radius-full)",
                padding: "1px 8px",
              }}
            >
              {jogo.origem}
            </span>
            {jogo.local && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  color: "var(--color-text-muted)",
                }}
              >
                <Icon icon={MapPin} size={10} /> {jogo.local}
              </span>
            )}
          </div>
        </div>

        <Icon
          icon={ChevronRight}
          size={16}
          style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
        />
      </div>
    </Link>
  );
}

// ─── Modal "Seguindo" (estilo perfil de rede social) ──────────────────────────

function SeguindoModal({
  isOpen,
  times,
  campeonatos,
  abaInicial,
  onClose,
}: {
  isOpen: boolean;
  times: FavoritoTimeItem[];
  campeonatos: FavoritoCampeonatoItem[];
  abaInicial: "times" | "campeonatos";
  onClose: () => void;
}) {
  const [aba, setAba] = useState<"times" | "campeonatos">(abaInicial);
  useEffect(() => {
    if (isOpen) setAba(abaInicial);
  }, [isOpen, abaInicial]);
  const lista = aba === "times" ? times : campeonatos;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seguindo" maxWidth={440}>
      {/* Abas */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "var(--space-3)",
          padding: "4px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {(["times", "campeonatos"] as const).map((k) => {
          const ativo = aba === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setAba(k)}
              style={{
                flex: 1,
                padding: "var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                background: ativo ? "rgba(0,230,118,0.12)" : "transparent",
                color: ativo ? "var(--color-brand-primary)" : "var(--color-text-muted)",
              }}
            >
              {k === "times" ? `Times (${times.length})` : `Campeonatos (${campeonatos.length})`}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div
        style={{
          maxHeight: "min(56vh, 420px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
        }}
      >
        {lista.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: "var(--space-4)",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            Você ainda não segue nenhum {aba === "times" ? "time" : "campeonato"}.
          </p>
        ) : aba === "times" ? (
          times.map((t) => (
            <Link
              key={t.id}
              href={`/times/${t.id}`}
              onClick={onClose}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Avatar name={t.nome} src={t.logoUrl || undefined} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--text-sm)",
                      fontWeight: 600,
                      color: "white",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.nome}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t.cidade} · {t.estado}
                  </p>
                </div>
                <Icon
                  icon={ChevronRight}
                  size={16}
                  style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
                />
              </div>
            </Link>
          ))
        ) : (
          campeonatos.map((c) => (
            <Link
              key={c.id}
              href={`/campeonatos/${c.id}`}
              onClick={onClose}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Avatar name={c.nome} src={c.logoUrl || undefined} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: "var(--text-sm)",
                      fontWeight: 600,
                      color: "white",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.nome}
                  </p>
                  <Badge variant={obterStatusCampeonato(c.status).variant} size="sm">
                    {obterStatusCampeonato(c.status).label}
                  </Badge>
                </div>
                <Icon
                  icon={ChevronRight}
                  size={16}
                  style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
                />
              </div>
            </Link>
          ))
        )}
      </div>
    </Modal>
  );
}

export default function TorcedorDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: favoritos, isLoading: carregandoFavoritos } = useListarFavoritosQuery();
  const { data: timeline = [], isLoading: carregandoTimeline } = useObterTimelineFavoritosQuery();
  const { ingressos } = useIngressosSimulados(user?.id);
  const { data: partidasComIngressos = [], isLoading: carregandoPartidasComIngressos } =
    useObterPartidasComIngressosQuery();

  const times = favoritos?.times ?? [];
  const campeonatos = favoritos?.campeonatos ?? [];

  const [seguindoModal, setSeguindoModal] = useState<"times" | "campeonatos" | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--color-brand-primary)",
          }}
        >
          Painel do Torcedor
        </p>
        <h1
          style={{
            margin: "2px 0 0",
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 700,
            color: "white",
          }}
        >
          Olá, {user?.name || "Torcedor"}
        </h1>
        <p
          style={{
            margin: "var(--space-2) 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          Acompanhe seus times e campeonatos favoritos e os próximos jogos.
        </p>

        {/* Contadores estilo perfil (clicáveis) */}
        <div style={{ display: "flex", gap: "var(--space-5)", marginTop: "var(--space-3)" }}>
          {[
            { key: "times" as const, label: "Times", valor: times.length },
            { key: "campeonatos" as const, label: "Campeonatos", valor: campeonatos.length },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSeguindoModal(s.key)}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: "6px",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
              }}
              title={`Ver ${s.label.toLowerCase()} que você segue`}
            >
              <strong style={{ color: "white", fontSize: "var(--text-md)", fontWeight: 700 }}>
                {s.valor}
              </strong>
              <span style={{ borderBottom: "1px dashed rgba(255,255,255,0.25)" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Link
        href="/meus-ingressos"
        style={{ textDecoration: "none", display: "block", marginBottom: "var(--space-6)" }}
      >
        <Card
          padding="lg"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            border: "1px solid rgba(0,230,118,0.2)",
            background: "linear-gradient(135deg, rgba(0,230,118,0.08), rgba(255,255,255,0.02))",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "rgba(0,230,118,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon icon={Ticket} size={22} color="var(--color-brand-primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, color: "white", fontSize: "var(--text-md)", fontWeight: 700 }}>
              Meus ingressos
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              {`${ingressos.length} ingresso${ingressos.length === 1 ? "" : "s"} simulado${ingressos.length === 1 ? "" : "s"} · ${ingressos.filter((i) => i.status === StatusIngresso.Pago).length} válido${ingressos.filter((i) => i.status === StatusIngresso.Pago).length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Icon
            icon={ChevronRight}
            size={18}
            style={{ color: "var(--color-brand-primary)", flexShrink: 0 }}
          />
        </Card>
      </Link>

      <div style={{ marginBottom: "var(--space-8)" }}>
        <SectionTitle
          icon={Ticket}
          title="Ingressos disponíveis"
          count={partidasComIngressos.length}
        />
        {carregandoPartidasComIngressos ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
            <Spinner size="md" ariaLabel="Carregando partidas com ingressos" />
          </div>
        ) : partidasComIngressos.length === 0 ? (
          <Card padding="lg" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Não há partidas com ingressos disponíveis no momento.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {partidasComIngressos.map((partida) => {
              const data = formatarDataHora(partida.dataHora);
              return (
                <Link
                  key={partida.partidaId}
                  href={`/jogos/${partida.partidaId}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    padding="md"
                    style={{
                      height: "100%",
                      border: "1px solid rgba(0,230,118,0.16)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--space-2)",
                        marginBottom: "var(--space-4)",
                      }}
                    >
                      <Badge variant="success" size="sm">
                        À venda
                      </Badge>
                      <span
                        style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}
                      >
                        {data.dia} {data.hora}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <Avatar
                          name={partida.nomeTimeCasa}
                          src={partida.logoTimeCasa || undefined}
                          size="md"
                        />
                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "white",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                          }}
                        >
                          {partida.nomeTimeCasa}
                        </p>
                      </div>
                      <strong
                        style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}
                      >
                        X
                      </strong>
                      <div style={{ minWidth: 0 }}>
                        <Avatar
                          name={partida.nomeTimeVisitante}
                          src={partida.logoTimeVisitante || undefined}
                          size="md"
                        />
                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "white",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                          }}
                        >
                          {partida.nomeTimeVisitante}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "var(--space-4)",
                        paddingTop: "var(--space-3)",
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: "var(--space-2)",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            color: "var(--color-text-muted)",
                            fontSize: "10px",
                          }}
                        >
                          A partir de
                        </span>
                        <strong
                          style={{
                            color: "var(--color-brand-primary)",
                            fontSize: "var(--text-md)",
                          }}
                        >
                          {partida.precoInicial.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </strong>
                      </div>
                      <span
                        style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}
                      >
                        {partida.quantidadeDisponivel} disponíveis{" "}
                        <Icon icon={ChevronRight} size={14} style={{ display: "inline" }} />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <SectionTitle icon={CalendarClock} title="Próximos jogos" />
        {carregandoTimeline ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
            <Spinner size="md" ariaLabel="Carregando próximos jogos" />
          </div>
        ) : timeline.length === 0 ? (
          <Card padding="lg" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Nenhum jogo agendado dos seus favoritos. Favorite times e campeonatos para acompanhar
              a agenda aqui.
            </p>
          </Card>
        ) : (
          <motion.div
            initial="initial"
            animate="animate"
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
          >
            {timeline.map((jogo) => (
              <TimelineRow key={jogo.partidaId} jogo={jogo} />
            ))}
          </motion.div>
        )}
      </div>

      <SeguindoModal
        isOpen={seguindoModal !== null}
        times={times}
        campeonatos={campeonatos}
        abaInicial={seguindoModal ?? "times"}
        onClose={() => setSeguindoModal(null)}
      />
    </div>
  );
}
