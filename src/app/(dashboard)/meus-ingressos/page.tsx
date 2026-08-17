"use client";

import Image from "next/image";
import { Calendar, CheckCircle2, MapPin, RefreshCw, Ticket } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatusIngresso } from "@/types/ingresso";
import { confirmarPagamentoSimulado, useIngressosSimulados } from "@/lib/ingresso.mock";
import { useAppSelector } from "@/store/hooks";

const status: Record<StatusIngresso, { texto: string; variante: BadgeVariant }> = {
  [StatusIngresso.Pendente]: { texto: "Aguardando pagamento", variante: "warning" },
  [StatusIngresso.Pago]: { texto: "Válido", variante: "success" },
  [StatusIngresso.Cancelado]: { texto: "Cancelado", variante: "danger" },
  [StatusIngresso.Utilizado]: { texto: "Utilizado", variante: "default" },
};

export default function MeusIngressosPage() {
  const usuarioId = useAppSelector((state) => state.auth.user?.id);
  const { ingressos, atualizar } = useIngressosSimulados(usuarioId);
  const ordenados = [...ingressos].sort(
    (a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime(),
  );

  return (
    <main style={{ width: "100%", maxWidth: 920, margin: "0 auto" }}>
      <PageHeader
        title="Meus ingressos"
        subtitle="Carteira demonstrativa armazenada somente neste navegador."
      />
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Badge variant="info">Ambiente de simulação · sem cobrança real</Badge>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-4)" }}>
        <Button variant="ghost" size="sm" onClick={atualizar}>
          <Icon icon={RefreshCw} size={15} /> Atualizar
        </Button>
      </div>
      {ordenados.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <Icon
            icon={Ticket}
            size={36}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {ordenados.map((ingresso) => {
            const info = status[ingresso.status] ?? status[StatusIngresso.Pendente];
            const liberado =
              ingresso.status === StatusIngresso.Pago ||
              ingresso.status === StatusIngresso.Utilizado;
            return (
              <Card
                key={ingresso.id}
                padding="lg"
                style={{ borderColor: liberado ? "rgba(0,230,118,.2)" : undefined }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <Badge size="sm" variant={info.variante}>
                      {info.texto}
                    </Badge>
                    <h2
                      style={{ color: "white", fontSize: "var(--text-md)", margin: "12px 0 3px" }}
                    >
                      {ingresso.nomePartida}
                    </h2>
                    <p
                      style={{
                        color: "var(--color-brand-primary)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {ingresso.nomeLote}
                    </p>
                  </div>
                  <strong style={{ color: "white" }}>
                    {ingresso.precoPago.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginTop: 18,
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  <span style={{ display: "flex", gap: 7 }}>
                    <Icon icon={Calendar} size={14} />
                    {new Date(ingresso.dataPartida).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span style={{ display: "flex", gap: 7 }}>
                    <Icon icon={MapPin} size={14} />
                    {ingresso.localPartida}
                  </span>
                </div>
                {liberado && ingresso.qrCodeBase64 ? (
                  <div
                    style={{
                      marginTop: 18,
                      textAlign: "center",
                      padding: 14,
                      borderRadius: 12,
                      background: "white",
                    }}
                  >
                    <Image
                      src={ingresso.qrCodeBase64}
                      alt={`QR Code demonstrativo para ${ingresso.nomePartida}`}
                      width={210}
                      height={210}
                      unoptimized
                      style={{ width: 210, maxWidth: "100%", height: "auto", margin: "auto" }}
                    />
                    <p
                      style={{
                        color: "#202020",
                        fontSize: 11,
                        fontWeight: 700,
                        wordBreak: "break-all",
                        margin: "8px 0 0",
                      }}
                    >
                      {ingresso.codigoValidacao}
                    </p>
                  </div>
                ) : ingresso.status === StatusIngresso.Pendente ? (
                  <>
                    <p
                      style={{
                        margin: "18px 0 0",
                        padding: 12,
                        borderRadius: 8,
                        background: "rgba(255,193,7,.07)",
                        color: "var(--color-feedback-warning)",
                        fontSize: "var(--text-xs)",
                        lineHeight: 1.5,
                      }}
                    >
                      O QR Code demonstrativo será liberado quando você simular a aprovação do
                      pagamento.
                    </p>
                    <Button
                      fullWidth
                      size="sm"
                      style={{ marginTop: 10 }}
                      onClick={async () => {
                        await confirmarPagamentoSimulado([ingresso.id]);
                        atualizar();
                      }}
                    >
                      <Icon icon={CheckCircle2} size={15} /> Simular pagamento aprovado
                    </Button>
                  </>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
