import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AdminFormModal } from "./AdminFormModal";

function okCheck(path: string, exists: boolean) {
  return http.post(url(path), () => new HttpResponse(null, { status: exists ? 200 : 404 }));
}

// DateInput nao recebe `id` neste formulario, entao o <label> nao fica
// associado via `for`/`aria-labelledby` — localizamos o input pelo `name`.
function getDataNascimentoInput(): HTMLInputElement {
  return document.querySelector('input[name="dataNascimento"]') as HTMLInputElement;
}

async function preencherCriacao(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome Completo"), "Novo Admin");
  await user.type(screen.getByLabelText("Email"), "novo@kivo.local");
  await user.type(screen.getByLabelText("CPF"), "12345678900");
  await user.type(screen.getByLabelText("Telefone"), "11999999999");
  await user.type(getDataNascimentoInput(), "1990-01-01");
  await user.type(screen.getByLabelText("Senha"), "123456");
  await user.type(screen.getByLabelText("Confirmar Senha"), "123456");
}

describe("AdminFormModal: modo criacao", () => {
  it("nao renderiza nada quando isOpen=false", () => {
    renderWithProviders(
      <AdminFormModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} token="t" />,
    );
    expect(screen.queryByText("Criar Admin")).not.toBeInTheDocument();
  });

  it("mostra erros de validacao quando o formulario e enviado vazio", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminFormModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} token="t" />);

    await user.click(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Email válido é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("CPF é obrigatório (apenas para criação)")).toBeInTheDocument();
  });

  it("valida que as senhas devem corresponder", async () => {
    const user = userEvent.setup();
    server.use(okCheck("/api/usuario/check-email", false), okCheck("/api/usuario/check-cpf", false));
    renderWithProviders(<AdminFormModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} token="t" />);

    await preencherCriacao(user);
    await user.clear(screen.getByLabelText("Confirmar Senha"));
    await user.type(screen.getByLabelText("Confirmar Senha"), "diferente");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("As senhas não correspondem")).toBeInTheDocument();
  });

  it("bloqueia quando email ja esta registrado", async () => {
    const user = userEvent.setup();
    server.use(okCheck("/api/usuario/check-email", true), okCheck("/api/usuario/check-cpf", false));
    renderWithProviders(<AdminFormModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} token="t" />);

    await preencherCriacao(user);
    await user.click(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("Email já está registrado")).toBeInTheDocument();
  });

  it("cria o admin com sucesso e fecha o modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    server.use(
      okCheck("/api/usuario/check-email", false),
      okCheck("/api/usuario/check-cpf", false),
      http.post(url("/api/usuario/admin"), () => HttpResponse.json({ id: "1" })),
    );

    renderWithProviders(<AdminFormModal isOpen onClose={onClose} onSuccess={onSuccess} token="t" />);

    await preencherCriacao(user);
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra erro do backend e nao fecha o modal quando a criacao falha", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    server.use(
      okCheck("/api/usuario/check-email", false),
      okCheck("/api/usuario/check-cpf", false),
      http.post(url("/api/usuario/admin"), () =>
        HttpResponse.json({ message: "Erro ao criar admin" }, { status: 400 }),
      ),
    );

    renderWithProviders(<AdminFormModal isOpen onClose={onClose} onSuccess={vi.fn()} token="t" />);

    await preencherCriacao(user);
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Criar" })).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha o modal ao clicar em Cancelar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<AdminFormModal isOpen onClose={onClose} onSuccess={vi.fn()} token="t" />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("AdminFormModal: modo edicao", () => {
  const admin = {
    id: "1",
    nome: "Admin Existente",
    email: "existente@kivo.local",
    telefone: "11888888888",
    dataNascimento: "1985-05-20T00:00:00.000Z",
  };

  it("preenche o formulario com os dados do admin e nao mostra campos de criacao", async () => {
    renderWithProviders(
      <AdminFormModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} admin={admin} token="t" />,
    );

    expect(screen.getByText("Editar Admin")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome Completo")).toHaveValue("Admin Existente");
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.queryByLabelText("CPF")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("atualiza o admin com sucesso", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    server.use(http.put(url("/api/usuario/admin/1"), () => HttpResponse.json({ id: "1" })));

    renderWithProviders(
      <AdminFormModal isOpen onClose={vi.fn()} onSuccess={onSuccess} admin={admin} token="t" />,
    );

    await user.clear(screen.getByLabelText("Nome Completo"));
    await user.type(screen.getByLabelText("Nome Completo"), "Admin Renomeado");
    await user.click(screen.getByRole("button", { name: "Atualizar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
