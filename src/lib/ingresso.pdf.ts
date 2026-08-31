import type { IngressoDetalhes } from "@/types/ingresso";
import { StatusIngresso } from "@/types/ingresso";

function nomeArquivoSeguro(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function lerImagemComoDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

async function carregarLogo(): Promise<string | null> {
  try {
    const resposta = await fetch("/LogoKivoSportsSFundoBranca.png");
    if (!resposta.ok) return null;
    return await lerImagemComoDataUrl(await resposta.blob());
  } catch {
    return null;
  }
}

function statusIngresso(status: StatusIngresso): string {
  if (status === StatusIngresso.Utilizado) return "UTILIZADO";
  return "VALIDO";
}

function mascararCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 11) return valor;
  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
}

export async function gerarPdfIngressos(
  ingressos: IngressoDetalhes[],
  nomeBase = "meus-ingressos-kivo",
): Promise<void> {
  if (ingressos.length === 0) return;

  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), carregarLogo()]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.setProperties({
    title: "Ingressos Kivo Sports",
    subject: "Ingressos esportivos",
    author: "Kivo Sports",
    creator: "Kivo Sports",
  });

  ingressos.forEach((ingresso, indice) => {
    if (indice > 0) pdf.addPage();

    const largura = 210;
    const altura = 297;
    pdf.setFillColor(6, 12, 9);
    pdf.rect(0, 0, largura, altura, "F");
    pdf.setFillColor(0, 230, 118);
    pdf.rect(0, 0, 6, altura, "F");

    if (logo) {
      pdf.addImage(logo, "PNG", 16, 12, 40, 16, undefined, "FAST");
    } else {
      pdf.setTextColor(0, 230, 118);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("KIVO SPORTS", 16, 23);
    }

    pdf.setTextColor(150, 164, 156);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`INGRESSO ${indice + 1} DE ${ingressos.length}`, 194, 19, { align: "right" });

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    const titulo = pdf.splitTextToSize(ingresso.nomePartida, 178) as string[];
    pdf.text(titulo, 16, 45);

    const deslocamentoTitulo = Math.max(0, titulo.length - 1) * 7;
    const data = new Date(ingresso.dataPartida);
    const dataFormatada =
      Number.isNaN(data.getTime()) || data.getFullYear() < 1900
        ? "Data a definir"
        : data.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
    const topoCartao = 65 + deslocamentoTitulo;

    pdf.setFillColor(14, 25, 19);
    pdf.setDrawColor(36, 70, 52);
    pdf.roundedRect(16, topoCartao, 178, 169, 4, 4, "FD");
    pdf.setFillColor(0, 230, 118);
    pdf.roundedRect(26, topoCartao + 13, 36, 9, 3, 3, "F");
    pdf.setTextColor(5, 20, 12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(statusIngresso(ingresso.status), 44, topoCartao + 19, { align: "center" });

    const detalhes = [
      ["LOTE", ingresso.nomeLote],
      ["VALOR", ingresso.precoPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })],
      ["DATA E HORARIO", dataFormatada],
      ["LOCAL", ingresso.localPartida || "Local a definir"],
      [
        "TITULAR",
        ingresso.nomeTitular
          ? `${ingresso.nomeTitular} - CPF ${mascararCpf(ingresso.cpfTitular)}`
          : "Nao informado",
      ],
    ];
    let y = topoCartao + 37;
    detalhes.forEach(([rotulo, valor]) => {
      pdf.setTextColor(115, 137, 125);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.text(rotulo, 26, y);
      pdf.setTextColor(245, 248, 246);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      const linhas = pdf.splitTextToSize(valor, 75) as string[];
      pdf.text(linhas, 26, y + 6);
      y += 18 + Math.max(0, linhas.length - 1) * 4;
    });

    if (ingresso.qrCodeBase64) {
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(111, topoCartao + 29, 70, 70, 3, 3, "F");
      pdf.addImage(ingresso.qrCodeBase64, "PNG", 116, topoCartao + 34, 60, 60, undefined, "FAST");
    }

    pdf.setTextColor(115, 137, 125);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text("CODIGO DE VALIDACAO", 146, topoCartao + 111, { align: "center" });
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("courier", "bold");
    pdf.setFontSize(8.5);
    pdf.text(ingresso.codigoValidacao, 146, topoCartao + 119, { align: "center", maxWidth: 72 });

    pdf.setDrawColor(36, 70, 52);
    pdf.line(26, topoCartao + 137, 184, topoCartao + 137);
    pdf.setTextColor(178, 191, 184);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    const instrucoes = pdf.splitTextToSize(
      "Apresente este QR Code na entrada. Cada ingresso permite uma unica validacao. Nao compartilhe este documento.",
      150,
    ) as string[];
    pdf.text(instrucoes, 26, topoCartao + 148);

    pdf.setTextColor(87, 107, 96);
    pdf.setFontSize(8);
    pdf.text("Kivo Sports - sua paixao entra em campo", 16, altura - 15);
    pdf.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 194, altura - 15, {
      align: "right",
    });
  });

  pdf.save(`${nomeArquivoSeguro(nomeBase) || "ingressos-kivo"}.pdf`);
}
