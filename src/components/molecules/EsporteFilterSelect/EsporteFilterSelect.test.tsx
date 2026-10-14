import { useState } from "react";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EsporteFilterSelect } from "./EsporteFilterSelect";
import { server } from "@/test/msw/server";
import { url } from "@/test/msw/handlers";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

const ESPORTES = [
  { id: "e1", nome: "Futebol", icone: "mdi:soccer", ativo: true },
  { id: "e2", nome: "Vôlei", icone: "mdi:volleyball", ativo: true },
];

function Controlado({ onChange }: { onChange: (v: string) => void }) {
  const [valor, setValor] = useState("todos");
  return (
    <EsporteFilterSelect
      value={valor}
      onChange={(v) => {
        setValor(v);
        onChange(v);
      }}
    />
  );
}

async function renderizar() {
  server.use(http.get(url("/api/esporte"), () => HttpResponse.json(ESPORTES)));
  const onChange = vi.fn();
  renderWithProviders(<Controlado onChange={onChange} />, {
    auth: authenticatedAs("administrador"),
  });
  const gatilho = screen.getByRole("button", { name: /Filtrar por esporte/ });
  // Espera a lista de esportes carregar para as opções existirem.
  await waitFor(() => expect(gatilho).not.toHaveAttribute("aria-busy", "true"));
  return { gatilho, onChange, user: userEvent.setup() };
}

describe("EsporteFilterSelect", () => {
  it("expõe o estado do popup por ARIA", async () => {
    const { gatilho, user } = await renderizar();

    expect(gatilho).toHaveAttribute("aria-haspopup", "listbox");
    expect(gatilho).toHaveAttribute("aria-expanded", "false");

    await user.click(gatilho);

    expect(gatilho).toHaveAttribute("aria-expanded", "true");
    const lista = screen.getByRole("listbox");
    expect(gatilho).toHaveAttribute("aria-controls", lista.id);
    expect(screen.getByRole("option", { name: "Todos os esportes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("abre pelo teclado, navega com as setas e seleciona com Enter devolvendo o foco", async () => {
    const { gatilho, onChange, user } = await renderizar();

    gatilho.focus();
    await user.keyboard("{ArrowDown}");
    const lista = await screen.findByRole("listbox");
    expect(lista).toHaveFocus();

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(lista).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Vôlei" }).id,
    );

    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("e2");
    // A lista sai com animação (AnimatePresence), então a remoção é assíncrona.
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(gatilho).toHaveFocus();
    expect(gatilho).toHaveTextContent("Vôlei");
  });

  it("Escape fecha sem alterar a seleção e devolve o foco ao botão", async () => {
    const { gatilho, onChange, user } = await renderizar();

    gatilho.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Escape}");

    // A lista sai com animação (AnimatePresence), então a remoção é assíncrona.
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(gatilho).toHaveAttribute("aria-expanded", "false");
    expect(gatilho).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Home/End vão para a primeira e a última opção", async () => {
    const { gatilho, user } = await renderizar();

    gatilho.focus();
    await user.keyboard("{Enter}");
    const lista = await screen.findByRole("listbox");

    await user.keyboard("{End}");
    expect(lista).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Vôlei" }).id,
    );
    await user.keyboard("{Home}");
    expect(lista).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Todos os esportes" }).id,
    );
  });

  it("Tab fecha a lista", async () => {
    const { gatilho, user } = await renderizar();

    gatilho.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.tab();

    // A lista sai com animação (AnimatePresence), então a remoção é assíncrona.
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });
});
