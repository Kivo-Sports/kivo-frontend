"use client";

import { useState } from "react";
import { ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { useToast } from "@/components/atoms/Toast";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { validarIngressoSimulado } from "@/lib/ingresso.mock";

export default function PortariaPage() {
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const confirmar = async () => {
    const valor = codigo.trim();
    if (!valor) return toast.warning("Informe ou leia o código do ingresso.");
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const resposta = validarIngressoSimulado(valor);
    setIsLoading(false);
    if (resposta.sucesso) {
      toast.success(resposta.mensagem, "Entrada simulada liberada");
      setCodigo("");
    } else {
      toast.error(resposta.mensagem, "Entrada não liberada");
    }
  };
  return (
    <main style={{ width: "100%", maxWidth: 620, margin: "0 auto" }}>
      <PageHeader
        title="Portaria"
        subtitle="Validação local do fluxo demonstrativo de ingressos."
      />
      <Card padding="lg">
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            background: "rgba(0,230,118,.08)",
            border: "1px solid rgba(0,230,118,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Icon icon={ScanLine} size={28} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <Input
          label="Código de validação"
          placeholder="Cole ou leia o código do QR Code"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && confirmar()}
          autoFocus
          autoComplete="off"
        />
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-xs)",
            lineHeight: 1.6,
            margin: "12px 0 20px",
          }}
        >
          O ingresso precisa estar pago. Após a validação, ele será marcado como utilizado e não
          poderá ser aceito novamente.
        </p>
        <Button fullWidth onClick={confirmar} loading={isLoading} disabled={!codigo.trim()}>
          <Icon icon={ShieldCheck} size={17} /> Validar e liberar entrada
        </Button>
      </Card>
    </main>
  );
}
