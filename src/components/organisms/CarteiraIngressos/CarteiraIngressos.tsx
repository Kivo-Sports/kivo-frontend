"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  Copy,
  Download,
  History,
  MapPin,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/components/atoms/Toast";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/molecules/Modal";
import { gerarPdfIngressos } from "@/lib/ingresso.pdf";
import {
  removerPagamentosIngressos,
  type PagamentoIngressoPendente,
  usePagamentosIngressosPendentes,
} from "@/lib/pagamento-ingresso.storage";
import {
  useAtribuirTitularIngressoMutation,
  useConfirmarPagamentoIngressoMutation,
  useObterMeusIngressosQuery,
} from "@/store/api/ingressoApi";
import type { IngressoDetalhes } from "@/types/ingresso";
import { StatusIngresso } from "@/types/ingresso";

interface GrupoPartida {
  chave: string;
  nomePartida: string;
  dataPartida: string;
  localPartida: string;
  ingressos: IngressoDetalhes[];
}

interface GrupoPagamentoPendente {
  chave: string;
  pagamento?: PagamentoIngressoPendente;
  ingressos: IngressoDetalhes[];
}

type SecaoVariant = "success" | "warning" | "muted" | "danger";

const status: Record<StatusIngresso, { texto: string; variante: BadgeVariant }> = {
  [StatusIngresso.Pendente]: { texto: "Aguardando pagamento", variante: "warning" },
  [StatusIngresso.Pago]: { texto: "Válido", variante: "success" },
  [StatusIngresso.Cancelado]: { texto: "Cancelado", variante: "danger" },
  [StatusIngresso.Utilizado]: { texto: "Utilizado", variante: "default" },
};

const secaoCores: Record<SecaoVariant, { cor: string; fundo: string; borda: string }> = {
  success: {
    cor: "var(--color-brand-primary)",
    fundo: "rgba(0,230,118,.055)",
    borda: "rgba(0,230,118,.18)",
  },
  warning: {
    cor: "var(--color-feedback-warning)",
    fundo: "rgba(255,193,7,.045)",
    borda: "rgba(255,193,7,.2)",
  },
  muted: {
    cor: "var(--color-text-secondary)",
    fundo: "rgba(255,255,255,.018)",
    borda: "rgba(255,255,255,.08)",
  },
  danger: {
    cor: "var(--color-feedback-danger)",
    fundo: "rgba(255,23,68,.035)",
    borda: "rgba(255,23,68,.18)",
  },
};

function timestampPartida(dataPartida: string): number | null {
  const data = new Date(dataPartida);
  if (Number.isNaN(data.getTime()) || data.getFullYear() < 1900) return null;
  return data.getTime();
}

function formatarData(dataPartida: string): string {
  const timestamp = timestampPartida(dataPartida);
  if (timestamp === null) return "Data a definir";
  return new Date(timestamp).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function mascararCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 11) return valor;
  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
}

function mensagemErro(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string } | string }).data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return fallback;
}

function agruparPorPartida(ingressos: IngressoDetalhes[]): GrupoPartida[] {
  const grupos = new Map<string, GrupoPartida>();
  ingressos.forEach((ingresso) => {
    const chave = `${ingresso.nomePartida}|${ingresso.dataPartida}|${ingresso.localPartida}`;
    const grupo = grupos.get(chave);
    if (grupo) {
      grupo.ingressos.push(ingresso);
      return;
    }
    grupos.set(chave, {
      chave,
      nomePartida: ingresso.nomePartida,
      dataPartida: ingresso.dataPartida,
      localPartida: ingresso.localPartida,
      ingressos: [ingresso],
    });
  });
  return [...grupos.values()];
}

function agruparPagamentosPendentes(
  ingressos: IngressoDetalhes[],
  pagamentos: PagamentoIngressoPendente[],
): GrupoPagamentoPendente[] {
  const idsAgrupados = new Set<string>();
  const grupos = pagamentos.flatMap((pagamento) => {
    const ingressosDaCompra = ingressos.filter((ingresso) =>
      pagamento.ingressoIds.includes(ingresso.id),
    );
    ingressosDaCompra.forEach((ingresso) => idsAgrupados.add(ingresso.id));
    return ingressosDaCompra.length
      ? [{ chave: pagamento.asaasPaymentId, pagamento, ingressos: ingressosDaCompra }]
      : [];
  });

  const semCobrancaSalva = agruparPorPartida(
    ingressos.filter((ingresso) => !idsAgrupados.has(ingresso.id)),
  ).map((grupo) => ({
    chave: `sem-pix-${grupo.chave}`,
    ingressos: grupo.ingressos,
  }));

  return [...grupos, ...semCobrancaSalva];
}

function ingressosLiberados(ingressos: IngressoDetalhes[]): IngressoDetalhes[] {
  return ingressos.filter(
    (ingresso) =>
      (ingresso.status === StatusIngresso.Pago || ingresso.status === StatusIngresso.Utilizado) &&
      Boolean(ingresso.qrCodeBase64 && ingresso.codigoValidacao),
  );
}

function Metrica({
  icon,
  rotulo,
  valor,
  cor,
}: {
  icon: typeof Ticket;
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <Card padding="md" style={{ background: "rgba(255,255,255,.022)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: cor,
            background: `color-mix(in srgb, ${cor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${cor} 25%, transparent)`,
          }}
        >
          <Icon icon={icon} size={19} />
        </div>
        <div>
          <strong style={{ display: "block", color: "white", fontSize: "var(--text-xl)" }}>
            {valor}
          </strong>
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            {rotulo}
          </span>
        </div>
      </div>
    </Card>
  );
}

function CartaoIngresso({
  ingresso,
  onDefinirTitular,
}: {
  ingresso: IngressoDetalhes;
  onDefinirTitular: (ingresso: IngressoDetalhes) => void;
}) {
  const aguardandoTitular =
    ingresso.status === StatusIngresso.Pago && !ingresso.nomeTitular?.trim();
  const info = aguardandoTitular
    ? { texto: "Defina o titular", variante: "warning" as BadgeVariant }
    : (status[ingresso.status] ?? status[StatusIngresso.Pendente]);
  const liberado =
    (ingresso.status === StatusIngresso.Pago || ingresso.status === StatusIngresso.Utilizado) &&
    Boolean(ingresso.qrCodeBase64 && ingresso.codigoValidacao);
  return (
    <div
      style={{
        minWidth: 0,
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(5,10,8,.58)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <Badge size="sm" variant={info.variante}>
            {info.texto}
          </Badge>
          <p style={{ color: "white", fontWeight: 700, margin: "10px 0 2px" }}>
            {ingresso.nomeLote}
          </p>
          <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>
            #{ingresso.id.slice(-8).toUpperCase()}
          </span>
        </div>
        <strong style={{ color: "var(--color-brand-primary)", whiteSpace: "nowrap" }}>
          {formatarMoeda(ingresso.precoPago)}
        </strong>
      </div>

      {ingresso.nomeTitular && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255,255,255,.035)",
            border: "1px solid rgba(255,255,255,.07)",
          }}
        >
          <Icon icon={UserRound} size={16} style={{ color: "var(--color-brand-primary)" }} />
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: "block",
                color: "white",
                fontSize: "var(--text-xs)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ingresso.nomeTitular}
            </strong>
            <span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>
              CPF {mascararCpf(ingresso.cpfTitular)}
            </span>
          </div>
        </div>
      )}

      {liberado ? (
        <div
          style={{
            marginTop: 14,
            padding: 10,
            textAlign: "center",
            borderRadius: 12,
            background: "white",
          }}
        >
          <Image
            src={ingresso.qrCodeBase64}
            alt={`QR Code de entrada ${ingresso.nomeLote}`}
            width={170}
            height={170}
            unoptimized
            style={{ width: 170, maxWidth: "100%", height: "auto", margin: "auto" }}
          />
          <p
            style={{
              color: "#111",
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 700,
              wordBreak: "break-all",
              margin: "7px 0 0",
            }}
          >
            {ingresso.codigoValidacao}
          </p>
        </div>
      ) : aguardandoTitular ? (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: "rgba(255,193,7,.055)",
            border: "1px solid rgba(255,193,7,.2)",
          }}
        >
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-xs)",
              lineHeight: 1.5,
              margin: "0 0 10px",
            }}
          >
            Informe nome e CPF de quem utilizará este ingresso para liberar o QR Code.
          </p>
          <Button size="sm" fullWidth onClick={() => onDefinirTitular(ingresso)}>
            <Icon icon={UserRound} size={15} /> Definir titular
          </Button>
        </div>
      ) : ingresso.status === StatusIngresso.Pago && ingresso.nomeTitular ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginTop: 14 }}>
          Titular definido. Atualize a página para carregar o QR Code de entrada.
        </p>
      ) : null}
    </div>
  );
}

function GrupoPartidaCard({
  grupo,
  variante,
  gerandoPdf,
  onGerarPdf,
  onDefinirTitular,
}: {
  grupo: GrupoPartida;
  variante: SecaoVariant;
  gerandoPdf: string | null;
  onGerarPdf: (grupo: GrupoPartida) => void;
  onDefinirTitular: (ingresso: IngressoDetalhes) => void;
}) {
  const cores = secaoCores[variante];
  const exportaveis = ingressosLiberados(grupo.ingressos);
  return (
    <Card
      padding="lg"
      style={{
        background: cores.fundo,
        border: `1px solid ${cores.borda}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          flexWrap: "wrap",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Badge size="sm" variant={variante === "warning" ? "warning" : "default"}>
              {grupo.ingressos.length} ingresso{grupo.ingressos.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <h3
            style={{
              color: "white",
              fontSize: "clamp(17px, 3vw, 22px)",
              margin: "0 0 9px",
            }}
          >
            {grupo.nomePartida}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px 18px",
              flexWrap: "wrap",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon icon={CalendarClock} size={14} /> {formatarData(grupo.dataPartida)}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon icon={MapPin} size={14} /> {grupo.localPartida || "Local a definir"}
            </span>
          </div>
        </div>
        {exportaveis.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGerarPdf(grupo)}
            loading={gerandoPdf === grupo.chave}
          >
            <Icon icon={Download} size={15} /> PDF da partida
          </Button>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {grupo.ingressos.map((ingresso) => (
          <CartaoIngresso
            key={ingresso.id}
            ingresso={ingresso}
            onDefinirTitular={onDefinirTitular}
          />
        ))}
      </div>
    </Card>
  );
}

function SecaoPagamentosPendentes({
  grupos,
  copiado,
  verificando,
  onCopiar,
  onVerificar,
}: {
  grupos: GrupoPagamentoPendente[];
  copiado: string | null;
  verificando: string | null;
  onCopiar: (pagamento: PagamentoIngressoPendente) => void;
  onVerificar: (grupo: GrupoPagamentoPendente) => void;
}) {
  if (grupos.length === 0) return null;
  const totalIngressos = grupos.reduce((total, grupo) => total + grupo.ingressos.length, 0);

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-feedback-warning)",
              background: secaoCores.warning.fundo,
              border: `1px solid ${secaoCores.warning.borda}`,
            }}
          >
            <Icon icon={ReceiptText} size={18} />
          </div>
          <div>
            <h2 style={{ color: "white", fontSize: "var(--text-md)", margin: 0 }}>
              Aguardando pagamento
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", margin: 0 }}>
              Uma cobrança PIX para todos os ingressos de cada compra
            </p>
          </div>
        </div>
        <Badge size="sm" variant="warning">
          {totalIngressos}
        </Badge>
      </div>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {grupos.map((grupo) => {
          const primeiro = grupo.ingressos[0];
          const resumoLotes = new Map<
            string,
            { nome: string; quantidade: number; total: number }
          >();
          grupo.ingressos.forEach((ingresso) => {
            const chave = `${ingresso.nomeLote}|${ingresso.precoPago}`;
            const atual = resumoLotes.get(chave);
            resumoLotes.set(chave, {
              nome: ingresso.nomeLote,
              quantidade: (atual?.quantidade ?? 0) + 1,
              total: (atual?.total ?? 0) + ingresso.precoPago,
            });
          });
          const valorTotal =
            grupo.pagamento?.valorTotal ||
            grupo.ingressos.reduce((total, ingresso) => total + ingresso.precoPago, 0);
          const possuiPix = Boolean(
            grupo.pagamento?.qrCodePixBase64 && grupo.pagamento.pixCopiaCola,
          );

          return (
            <Card
              key={grupo.chave}
              padding="lg"
              style={{
                background: secaoCores.warning.fundo,
                border: `1px solid ${secaoCores.warning.borda}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "var(--space-4)",
                  flexWrap: "wrap",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div>
                  <Badge size="sm" variant="warning">
                    {grupo.ingressos.length} ingresso{grupo.ingressos.length === 1 ? "" : "s"}
                  </Badge>
                  <h3 style={{ color: "white", fontSize: "var(--text-lg)", margin: "9px 0 6px" }}>
                    {primeiro?.nomePartida ?? "Compra de ingressos"}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px 18px",
                      flexWrap: "wrap",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon icon={CalendarClock} size={14} />{" "}
                      {formatarData(primeiro?.dataPartida ?? "")}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon icon={MapPin} size={14} /> {primeiro?.localPartida || "Local a definir"}
                    </span>
                  </div>
                </div>
                <strong style={{ color: "var(--color-feedback-warning)", fontSize: 20 }}>
                  {formatarMoeda(valorTotal)}
                </strong>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: possuiPix
                    ? "repeat(auto-fit, minmax(min(100%, 240px), 1fr))"
                    : "1fr",
                  gap: "var(--space-4)",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  {[...resumoLotes.entries()].map(([chaveLote, lote]) => (
                    <div
                      key={chaveLote}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "rgba(5,10,8,.5)",
                        border: "1px solid rgba(255,255,255,.07)",
                      }}
                    >
                      <span
                        style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}
                      >
                        {lote.quantidade}× {lote.nome}
                      </span>
                      <strong style={{ color: "white", fontSize: "var(--text-sm)" }}>
                        {formatarMoeda(lote.total)}
                      </strong>
                    </div>
                  ))}

                  {!possuiPix && (
                    <p
                      style={{
                        color: "var(--color-feedback-warning)",
                        fontSize: "var(--text-xs)",
                        lineHeight: 1.5,
                        margin: "6px 0 0",
                      }}
                    >
                      O PIX não está salvo neste navegador, mas ainda é possível consultar a
                      confirmação do pagamento.
                    </p>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onVerificar(grupo)}
                    loading={verificando === grupo.chave}
                  >
                    Verificar pagamento
                  </Button>
                </div>

                {possuiPix && grupo.pagamento && (
                  <div>
                    <div
                      style={{
                        width: 190,
                        maxWidth: "100%",
                        padding: 8,
                        margin: "0 auto 10px",
                        borderRadius: 10,
                        background: "white",
                      }}
                    >
                      <Image
                        src={grupo.pagamento.qrCodePixBase64}
                        alt="QR Code PIX da compra"
                        width={174}
                        height={174}
                        unoptimized
                        style={{ display: "block", width: "100%", height: "auto" }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => onCopiar(grupo.pagamento!)}
                    >
                      <Icon icon={copiado === grupo.chave ? Check : Copy} size={15} />
                      {copiado === grupo.chave ? "PIX copiado" : "Copiar PIX"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function SecaoIngressos({
  titulo,
  descricao,
  icon,
  variante,
  grupos,
  gerandoPdf,
  onGerarPdf,
  onDefinirTitular,
}: {
  titulo: string;
  descricao: string;
  icon: typeof Ticket;
  variante: SecaoVariant;
  grupos: GrupoPartida[];
  gerandoPdf: string | null;
  onGerarPdf: (grupo: GrupoPartida) => void;
  onDefinirTitular: (ingresso: IngressoDetalhes) => void;
}) {
  if (grupos.length === 0) return null;
  const cores = secaoCores[variante];
  const totalIngressos = grupos.reduce((total, grupo) => total + grupo.ingressos.length, 0);
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: cores.cor,
              background: cores.fundo,
              border: `1px solid ${cores.borda}`,
            }}
          >
            <Icon icon={icon} size={18} />
          </div>
          <div>
            <h2 style={{ color: "white", fontSize: "var(--text-md)", margin: 0 }}>{titulo}</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", margin: 0 }}>
              {descricao}
            </p>
          </div>
        </div>
        <Badge size="sm" variant="default">
          {totalIngressos}
        </Badge>
      </div>
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {grupos.map((grupo) => (
          <GrupoPartidaCard
            key={grupo.chave}
            grupo={grupo}
            variante={variante}
            gerandoPdf={gerandoPdf}
            onGerarPdf={onGerarPdf}
            onDefinirTitular={onDefinirTitular}
          />
        ))}
      </div>
    </section>
  );
}

export function CarteiraIngressos() {
  const toast = useToast();
  const pagamentosPendentes = usePagamentosIngressosPendentes();
  const [confirmarPagamento] = useConfirmarPagamentoIngressoMutation();
  const [atribuirTitular, { isLoading: salvandoTitular }] = useAtribuirTitularIngressoMutation();
  const {
    data: ingressos = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useObterMeusIngressosQuery(undefined, {
    pollingInterval: 8000,
    skipPollingIfUnfocused: true,
  });
  const [agora] = useState(() => Date.now());
  const [copiado, setCopiado] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null);
  const [verificandoPagamento, setVerificandoPagamento] = useState<string | null>(null);
  const [ingressoTitular, setIngressoTitular] = useState<IngressoDetalhes | null>(null);
  const [nomeTitular, setNomeTitular] = useState("");
  const [cpfTitular, setCpfTitular] = useState("");

  useEffect(() => {
    const finalizados = ingressos
      .filter((ingresso) => ingresso.status !== StatusIngresso.Pendente)
      .map((ingresso) => ingresso.id);
    removerPagamentosIngressos(finalizados);
  }, [ingressos]);

  const pendentes = ingressos.filter((ingresso) => ingresso.status === StatusIngresso.Pendente);
  const cancelados = ingressos.filter((ingresso) => ingresso.status === StatusIngresso.Cancelado);
  const liberados = ingressos.filter(
    (ingresso) =>
      ingresso.status === StatusIngresso.Pago || ingresso.status === StatusIngresso.Utilizado,
  );
  const proximos = liberados.filter((ingresso) => {
    const data = timestampPartida(ingresso.dataPartida);
    return data === null || data >= agora;
  });
  const passados = liberados.filter((ingresso) => {
    const data = timestampPartida(ingresso.dataPartida);
    return data !== null && data < agora;
  });
  const ordenarGrupos = (grupos: GrupoPartida[], crescente: boolean) =>
    grupos.sort((a, b) => {
      const dataA = timestampPartida(a.dataPartida) ?? Number.POSITIVE_INFINITY;
      const dataB = timestampPartida(b.dataPartida) ?? Number.POSITIVE_INFINITY;
      return crescente ? dataA - dataB : dataB - dataA;
    });
  const gruposPendentes = agruparPagamentosPendentes(pendentes, pagamentosPendentes);
  const gruposProximos = ordenarGrupos(agruparPorPartida(proximos), true);
  const gruposPassados = ordenarGrupos(agruparPorPartida(passados), false);
  const gruposCancelados = ordenarGrupos(agruparPorPartida(cancelados), false);
  const copiar = async (pagamento: PagamentoIngressoPendente) => {
    try {
      await navigator.clipboard.writeText(pagamento.pixCopiaCola);
      setCopiado(pagamento.asaasPaymentId);
      window.setTimeout(() => setCopiado(null), 1800);
    } catch {
      toast.error("Não foi possível copiar o código PIX.");
    }
  };

  const verificar = async (grupo: GrupoPagamentoPendente) => {
    const primeiroIngresso = grupo.ingressos[0];
    if (!primeiroIngresso) return;
    setVerificandoPagamento(grupo.chave);
    let erroConfirmacao: unknown;
    try {
      await confirmarPagamento(primeiroIngresso.id).unwrap();
    } catch (error) {
      erroConfirmacao = error;
    }

    try {
      const atualizados = await refetch().unwrap();
      const ids = new Set(grupo.ingressos.map((ingresso) => ingresso.id));
      const confirmados = atualizados.filter(
        (ingresso) =>
          ids.has(ingresso.id) &&
          (ingresso.status === StatusIngresso.Pago || ingresso.status === StatusIngresso.Utilizado),
      );
      if (confirmados.length === grupo.ingressos.length) {
        removerPagamentosIngressos([...ids]);
        toast.success(
          "Pagamento confirmado. Defina o titular de cada ingresso para liberar os QR Codes.",
          "Ingressos pagos",
        );
      } else {
        toast.info(
          erroConfirmacao
            ? mensagemErro(erroConfirmacao, "O pagamento ainda não foi confirmado.")
            : "O pagamento ainda não foi confirmado. Aguarde alguns segundos e tente novamente.",
          "Aguardando confirmação",
        );
      }
    } catch (error) {
      toast.error(
        mensagemErro(error, "Não foi possível atualizar seus ingressos."),
        "Erro ao verificar pagamento",
      );
    } finally {
      setVerificandoPagamento(null);
    }
  };

  const abrirTitular = (ingresso: IngressoDetalhes) => {
    setIngressoTitular(ingresso);
    setNomeTitular("");
    setCpfTitular("");
  };

  const salvarTitular = async () => {
    if (!ingressoTitular) return;
    const cpfLimpo = cpfTitular.replace(/\D/g, "");
    if (nomeTitular.trim().length < 3 || cpfLimpo.length !== 11) {
      toast.warning("Informe o nome completo e um CPF com 11 dígitos.", "Dados inválidos");
      return;
    }
    try {
      await atribuirTitular({
        ingressoId: ingressoTitular.id,
        nome: nomeTitular.trim(),
        cpf: cpfLimpo,
      }).unwrap();
      await refetch();
      setIngressoTitular(null);
      toast.success("Titular definido e QR Code de entrada liberado.");
    } catch (error) {
      toast.error(
        mensagemErro(error, "Não foi possível definir o titular deste ingresso."),
        "Erro ao definir titular",
      );
    }
  };

  const gerarPdf = async (grupo: GrupoPartida) => {
    const selecionados = ingressosLiberados(grupo.ingressos);
    if (selecionados.length === 0) {
      toast.warning("Somente ingressos pagos e com QR Code liberado podem ser exportados.");
      return;
    }
    setGerandoPdf(grupo.chave);
    try {
      await gerarPdfIngressos(selecionados, `ingressos-${grupo.nomePartida}`);
      toast.success("PDF gerado com sucesso.", "Ingressos exportados");
    } catch {
      toast.error("Não foi possível gerar o PDF dos ingressos.");
    } finally {
      setGerandoPdf(null);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{ minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Spinner size="lg" ariaLabel="Carregando ingressos" />
      </div>
    );
  }

  return (
    <main style={{ width: "100%", maxWidth: 1080, margin: "0 auto" }}>
      <Card
        padding="lg"
        style={{
          position: "relative",
          overflow: "hidden",
          marginBottom: "var(--space-4)",
          background:
            "radial-gradient(circle at 85% 15%, rgba(0,230,118,.18), transparent 32%), linear-gradient(135deg, rgba(0,230,118,.08), rgba(5,10,8,.98) 58%)",
          border: "1px solid rgba(0,230,118,.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-5)",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ maxWidth: 620 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                color: "var(--color-brand-primary)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              <Icon icon={WalletCards} size={15} /> Carteira digital Kivo
            </span>
            <h1
              style={{
                color: "white",
                fontSize: "clamp(28px, 5vw, 44px)",
                lineHeight: 1.05,
                margin: "10px 0 12px",
              }}
            >
              Meus ingressos
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Pagamentos, próximos jogos e histórico organizados por partida. Seus QR Codes ficam
              disponíveis após a confirmação do pagamento e a definição do titular.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="ghost" size="sm" onClick={() => refetch()} loading={isFetching}>
              <Icon icon={RefreshCw} size={15} /> Atualizar
            </Button>
          </div>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-3)",
          marginBottom: "var(--space-8)",
        }}
      >
        <Metrica
          icon={ShieldCheck}
          rotulo="Ingressos válidos"
          valor={
            ingressos.filter(
              (item) =>
                item.status === StatusIngresso.Pago &&
                Boolean(item.nomeTitular && item.qrCodeBase64 && item.codigoValidacao),
            ).length
          }
          cor="var(--color-brand-primary)"
        />
        <Metrica
          icon={ReceiptText}
          rotulo="Aguardando pagamento"
          valor={pendentes.length}
          cor="var(--color-feedback-warning)"
        />
        <Metrica
          icon={CalendarClock}
          rotulo="Próximas partidas"
          valor={gruposProximos.length}
          cor="var(--color-feedback-info)"
        />
      </div>

      {isError ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-feedback-danger)", margin: "0 0 14px" }}>
            Não foi possível carregar seus ingressos.
          </p>
          <Button size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </Card>
      ) : ingressos.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <Icon
            icon={Ticket}
            size={42}
            style={{ color: "var(--color-text-muted)", margin: "0 auto 12px" }}
          />
          <h2 style={{ color: "white", fontSize: "var(--text-md)" }}>
            Você ainda não possui ingressos
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Acesse uma partida para conferir os lotes disponíveis.
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-8)" }}>
          <SecaoPagamentosPendentes
            grupos={gruposPendentes}
            copiado={copiado}
            onCopiar={copiar}
            verificando={verificandoPagamento}
            onVerificar={verificar}
          />
          <SecaoIngressos
            titulo="Próximos jogos"
            descricao="Ingressos liberados para partidas que ainda vão acontecer"
            icon={CalendarClock}
            variante="success"
            grupos={gruposProximos}
            gerandoPdf={gerandoPdf}
            onGerarPdf={gerarPdf}
            onDefinirTitular={abrirTitular}
          />
          <SecaoIngressos
            titulo="Jogos passados"
            descricao="Histórico de ingressos das partidas já realizadas"
            icon={History}
            variante="muted"
            grupos={gruposPassados}
            gerandoPdf={gerandoPdf}
            onGerarPdf={gerarPdf}
            onDefinirTitular={abrirTitular}
          />
          <SecaoIngressos
            titulo="Cancelados"
            descricao="Ingressos e cobranças que foram cancelados"
            icon={XCircle}
            variante="danger"
            grupos={gruposCancelados}
            gerandoPdf={gerandoPdf}
            onGerarPdf={gerarPdf}
            onDefinirTitular={abrirTitular}
          />
        </div>
      )}

      <Modal
        isOpen={Boolean(ingressoTitular)}
        onClose={() => !salvandoTitular && setIngressoTitular(null)}
        title="Definir titular do ingresso"
        closeOnOverlayClick={!salvandoTitular}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIngressoTitular(null)}
              disabled={salvandoTitular}
            >
              Cancelar
            </Button>
            <Button onClick={salvarTitular} loading={salvandoTitular}>
              Confirmar titular
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-lg)",
              background: "rgba(0,230,118,.055)",
              border: "1px solid rgba(0,230,118,.16)",
            }}
          >
            <strong style={{ display: "block", color: "white", fontSize: "var(--text-sm)" }}>
              {ingressoTitular?.nomePartida}
            </strong>
            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
              {ingressoTitular?.nomeLote} · #{ingressoTitular?.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <Input
            label="Nome completo do titular"
            placeholder="Quem utilizará o ingresso"
            value={nomeTitular}
            onChange={(event) => setNomeTitular(event.target.value)}
            maxLength={120}
          />
          <Input
            label="CPF do titular"
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={cpfTitular}
            onChange={(event) => setCpfTitular(formatarCpf(event.target.value))}
            maxLength={14}
          />
          <p
            style={{
              margin: 0,
              color: "var(--color-feedback-warning)",
              fontSize: "var(--text-xs)",
              lineHeight: 1.5,
            }}
          >
            Confira os dados antes de confirmar. O backend não permite alterar o titular depois.
          </p>
        </div>
      </Modal>
    </main>
  );
}
