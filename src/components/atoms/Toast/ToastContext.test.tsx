import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastContainer } from "./ToastContainer";
import { ToastProvider, useToast } from "./ToastContext";

function Harness() {
  const { toasts, removeToast, success, error, warning, info } = useToast();
  return (
    <div>
      <button onClick={() => success("Deu certo", "Sucesso")}>disparar-sucesso</button>
      <button onClick={() => error("Deu errado", "Erro")}>disparar-erro</button>
      <button onClick={() => warning("Cuidado")}>disparar-warning</button>
      <button onClick={() => info("Informação")}>disparar-info</button>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  );
}

describe("Toast: disparo por tipo", () => {
  it("mostra um toast de sucesso com titulo e mensagem", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("disparar-sucesso"));

    expect(screen.getByText("Sucesso")).toBeInTheDocument();
    expect(screen.getByText("Deu certo")).toBeInTheDocument();
  });

  it("mostra um toast de erro", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("disparar-erro"));

    expect(screen.getByText("Deu errado")).toBeInTheDocument();
  });

  it("mostra um toast de warning sem titulo", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("disparar-warning"));

    expect(screen.getByText("Cuidado")).toBeInTheDocument();
  });

  it("mostra um toast de info", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("disparar-info"));

    expect(screen.getByText("Informação")).toBeInTheDocument();
  });
});

describe("Toast: multiplos toasts e remocao manual", () => {
  it("acumula multiplos toasts simultaneos", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("disparar-sucesso"));
    await user.click(screen.getByText("disparar-erro"));

    expect(screen.getByText("Deu certo")).toBeInTheDocument();
    expect(screen.getByText("Deu errado")).toBeInTheDocument();
  });

  it("remove um toast especifico ao clicar em fechar, mantendo os outros", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText("disparar-sucesso"));
    await user.click(screen.getByText("disparar-erro"));

    const botoesFechar = screen.getAllByText("×");
    await user.click(botoesFechar[0]);

    await waitFor(() => expect(screen.queryByText("Deu certo")).not.toBeInTheDocument());
    expect(screen.getByText("Deu errado")).toBeInTheDocument();
  });
});

describe("Toast: auto-dismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("remove o toast sozinho apos a duracao padrao (5s)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHarness();

    await user.click(screen.getByText("disparar-sucesso"));
    expect(screen.getByText("Deu certo")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5000);

    await waitFor(() => expect(screen.queryByText("Deu certo")).not.toBeInTheDocument());
  });
});

describe("useToast: uso fora do provider", () => {
  it("lanca erro quando usado fora do ToastProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Harness />)).toThrow("useToast deve ser usado dentro de ToastProvider");

    consoleError.mockRestore();
  });
});
