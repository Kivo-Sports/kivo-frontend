"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  RefreshCw,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import {
  useListarMinhasNotificacoesQuery,
  useMarcarNotificacaoComoLidaMutation,
  useMarcarTodasNotificacoesComoLidasMutation,
  useObterQuantidadeNaoLidasQuery,
} from "@/store/api/notificacaoApi";
import { useAppSelector } from "@/store/hooks";
import { EnumTipoNotificacao, type Notificacao } from "@/types/notificacao";

const POLLING_INTERVAL_MS = 45_000;

const notificationTypeIcons: Partial<Record<EnumTipoNotificacao, LucideIcon>> = {
  [EnumTipoNotificacao.Sistema]: BellRing,
  [EnumTipoNotificacao.IngressoConfirmado]: Ticket,
  [EnumTipoNotificacao.IngressoUtilizado]: CheckCheck,
  [EnumTipoNotificacao.PartidaProxima]: CalendarClock,
  [EnumTipoNotificacao.CampeonatoFase]: Trophy,
  [EnumTipoNotificacao.TimeInscrito]: Users,
};

function formatarDataNotificacao(value: string): string {
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "";

  const diffMs = Date.now() - data.getTime();
  if (diffMs < 60_000) return "Agora";

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin} min`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `${diffHoras} h`;

  if (diffHoras < 48) return "Ontem";

  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function normalizeBackendPath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

function resolveNotificationRoute(notification: Notificacao): string | null {
  const rawPath = notification.linkRedirecionamento?.trim();
  if (!rawPath) return null;

  const path = normalizeBackendPath(rawPath);

  if (path === "/" || path === "/dashboard" || path === "/home" || path === "/configuracoes") {
    return path;
  }

  if (path === "/perfil") {
    return "/configuracoes";
  }

  const partidaMatch = path.match(/^\/partidas\/([0-9a-f-]{36})$/i);
  if (partidaMatch) {
    return `/jogos/${partidaMatch[1]}`;
  }

  const jogoMatch = path.match(/^\/jogos\/([0-9a-f-]{36})$/i);
  if (jogoMatch) {
    return path;
  }

  const campeonatoTabelaMatch = path.match(/^\/campeonatos\/([0-9a-f-]{36})\/tabela$/i);
  if (campeonatoTabelaMatch) {
    return `/organizador/campeonatos/${campeonatoTabelaMatch[1]}/jogos`;
  }

  const campeonatoTimesMatch = path.match(/^\/campeonatos\/([0-9a-f-]{36})\/times$/i);
  if (campeonatoTimesMatch) {
    return `/organizador/campeonatos/${campeonatoTimesMatch[1]}`;
  }

  const campeonatoMatch = path.match(/^\/campeonatos\/([0-9a-f-]{36})$/i);
  if (campeonatoMatch) {
    return path;
  }

  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const {
    data: notificacoes = [],
    isLoading: isLoadingList,
    isError: hasListError,
    refetch: refetchList,
  } = useListarMinhasNotificacoesQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnFocus: true,
  });

  const {
    data: contador,
    isFetching: isFetchingCount,
    isError: hasCountError,
    refetch: refetchCount,
  } = useObterQuantidadeNaoLidasQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: isAuthenticated ? POLLING_INTERVAL_MS : 0,
    refetchOnFocus: true,
  });

  const [marcarComoLida, { isLoading: isMarkingOne }] = useMarcarNotificacaoComoLidaMutation();
  const [marcarTodas, { isLoading: isMarkingAll }] = useMarcarTodasNotificacoesComoLidasMutation();

  const unreadCount = contador?.naoLidas ?? 0;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  const hasUnread = unreadCount > 0;
  const isBusy = isFetchingCount || isMarkingOne || isMarkingAll;

  const orderedNotifications = useMemo(
    () =>
      [...notificacoes].sort(
        (a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime(),
      ),
    [notificacoes],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const refetchNotifications = () => {
    setActionError(null);
    refetchList();
    refetchCount();
  };

  const toggleDropdown = () => {
    setIsOpen((current) => {
      const next = !current;
      if (next) {
        refetchNotifications();
      }
      return next;
    });
  };

  const handleMarkAll = async () => {
    if (!hasUnread || isMarkingAll) return;

    setActionError(null);
    try {
      await marcarTodas().unwrap();
    } catch {
      setActionError("Não foi possível marcar todas.");
    }
  };

  const handleNotificationClick = async (notification: Notificacao) => {
    setActionError(null);
    const route = resolveNotificationRoute(notification);

    if (!notification.lida) {
      try {
        await marcarComoLida(notification.id).unwrap();
      } catch {
        setActionError("Não foi possível atualizar a notificação.");
        return;
      }
    }

    if (route) {
      setIsOpen(false);
      router.push(route);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-label="Notificações"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          toggleDropdown();
        }}
        style={{
          position: "relative",
          width: 40,
          height: 40,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: isOpen ? "rgba(0, 230, 118, 0.16)" : "rgba(0, 230, 118, 0.08)",
          border: "1px solid rgba(0, 230, 118, 0.3)",
          borderRadius: 8,
          color: "var(--color-brand-primary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {isBusy ? (
          <Spinner size="sm" ariaLabel="Atualizando notificações" />
        ) : (
          <Icon icon={Bell} size={18} />
        )}
        {hasUnread && (
          <Badge
            variant="danger"
            size="sm"
            style={{
              position: "absolute",
              top: -8,
              right: -10,
              minWidth: "1.35rem",
              height: "1.25rem",
              paddingInline: "0.35rem",
              justifyContent: "center",
              fontSize: "0.68rem",
              borderRadius: "999px",
            }}
          >
            {badgeLabel}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            position: "fixed",
            top: 67,
            right: "clamp(12px, 2vw, 24px)",
            width: "min(360px, calc(100vw - 24px))",
            maxHeight: "min(520px, calc(100vh - 96px))",
            display: "flex",
            flexDirection: "column",
            background: "rgba(20, 20, 20, 0.99)",
            border: "1px solid rgba(0, 230, 118, 0.3)",
            borderRadius: 12,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
            zIndex: 1200,
            animation: "slideDown 0.2s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              padding: "var(--space-4)",
              borderBottom: "1px solid rgba(0, 230, 118, 0.2)",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "white", fontSize: "var(--text-sm)", fontWeight: 700 }}>
                Notificações
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-xs)",
                }}
              >
                {hasUnread ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
              </p>
            </div>

            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isMarkingAll}
                style={{
                  border: "1px solid rgba(0, 230, 118, 0.28)",
                  background: "rgba(0, 230, 118, 0.08)",
                  color: "var(--color-brand-primary)",
                  borderRadius: 8,
                  cursor: isMarkingAll ? "not-allowed" : "pointer",
                  padding: "0.45rem 0.55rem",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  opacity: isMarkingAll ? 0.65 : 1,
                }}
              >
                Marcar todas
              </button>
            )}
          </div>

          {(hasListError || hasCountError || actionError) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                color: "var(--color-feedback-warning)",
                borderBottom: "1px solid rgba(255, 193, 7, 0.2)",
                fontSize: "var(--text-xs)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <Icon icon={AlertCircle} size={14} />
                {actionError ?? "Não foi possível carregar."}
              </span>
              <button
                type="button"
                onClick={refetchNotifications}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  border: "none",
                  background: "transparent",
                  color: "var(--color-brand-primary)",
                  cursor: "pointer",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                }}
              >
                <Icon icon={RefreshCw} size={13} />
                Tentar novamente
              </button>
            </div>
          )}

          <div style={{ overflowY: "auto", maxHeight: "390px" }}>
            {isLoadingList ? (
              <div
                style={{
                  minHeight: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                <Spinner size="md" ariaLabel="Carregando notificações" />
              </div>
            ) : orderedNotifications.length === 0 ? (
              <div style={{ padding: "var(--space-6) var(--space-4)", textAlign: "center" }}>
                <p
                  style={{ margin: 0, color: "white", fontSize: "var(--text-sm)", fontWeight: 700 }}
                >
                  Nenhuma notificação
                </p>
                <p
                  style={{
                    margin: "var(--space-1) 0 0",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  Novidades importantes vão aparecer aqui.
                </p>
              </div>
            ) : (
              orderedNotifications.map((notification) => {
                const TypeIcon = notificationTypeIcons[notification.tipo] ?? BellRing;
                const route = resolveNotificationRoute(notification);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "2rem minmax(0, 1fr)",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) var(--space-4)",
                      border: "none",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      background: notification.lida ? "transparent" : "rgba(0, 230, 118, 0.08)",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    title={route ? "Abrir notificação" : "Marcar como lida"}
                  >
                    <span
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: notification.lida
                          ? "var(--color-text-muted)"
                          : "var(--color-brand-primary)",
                        background: notification.lida
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0, 230, 118, 0.12)",
                      }}
                    >
                      <Icon icon={TypeIcon} size={16} />
                    </span>

                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "var(--space-2)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <strong
                          style={{
                            color: "white",
                            fontSize: "var(--text-sm)",
                            lineHeight: 1.25,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {notification.titulo}
                        </strong>
                        {!notification.lida && (
                          <span
                            aria-label="Não lida"
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "999px",
                              background: "var(--color-brand-primary)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </span>

                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          color: "var(--color-text-secondary)",
                          fontSize: "var(--text-xs)",
                          lineHeight: 1.35,
                        }}
                      >
                        {notification.mensagem}
                      </span>

                      <span
                        style={{
                          display: "block",
                          marginTop: "0.35rem",
                          color: "var(--color-text-muted)",
                          fontSize: "0.7rem",
                        }}
                      >
                        {formatarDataNotificacao(notification.criadaEm)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
