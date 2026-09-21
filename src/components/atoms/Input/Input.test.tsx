import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./Input";

describe("Input: valor e alteracao", () => {
  it("mostra o valor e dispara onChange ao digitar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Nome" value="" onChange={onChange} />);

    await user.type(screen.getByLabelText("Nome"), "a");

    expect(onChange).toHaveBeenCalled();
  });
});

describe("Input: disabled", () => {
  it("desabilita o campo quando disabled=true", () => {
    render(<Input label="Nome" disabled />);
    expect(screen.getByLabelText("Nome")).toBeDisabled();
  });
});

describe("Input: erro / helper text", () => {
  it("mostra a mensagem de erro e marca aria-invalid", () => {
    render(<Input label="Email" error="Email invalido" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Email invalido");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("nao mostra erro nem aria-invalid quando nao ha erro", () => {
    render(<Input label="Email" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
  });
});

describe("Input: visibilidade de senha", () => {
  it("alterna entre texto e senha ao clicar no botao de mostrar/ocultar", async () => {
    const user = userEvent.setup();
    render(<Input label="Senha" type="password" />);

    const input = screen.getByLabelText("Senha");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("nao mostra o botao de visibilidade para campos que nao sao senha", () => {
    render(<Input label="Nome" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Input: icone", () => {
  it("renderiza o icone quando fornecido", () => {
    render(<Input label="Busca" icon={<span data-testid="icone-busca" />} />);
    expect(screen.getByTestId("icone-busca")).toBeInTheDocument();
  });
});
