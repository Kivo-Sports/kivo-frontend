import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button: variantes", () => {
  it.each(["primary", "secondary", "ghost", "danger"] as const)(
    "renderiza a variante %s sem quebrar",
    (variant) => {
      render(<Button variant={variant}>Clique</Button>);
      expect(screen.getByRole("button", { name: "Clique" })).toBeInTheDocument();
    },
  );
});

describe("Button: loading", () => {
  it("mostra spinner e texto 'Carregando...' quando loading, e desabilita o botao", () => {
    render(<Button loading>Salvar</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByText("Salvar")).not.toBeInTheDocument();
  });

  it("mostra o texto normal quando nao esta loading", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByText("Salvar")).toBeInTheDocument();
  });
});

describe("Button: disabled", () => {
  it("fica desabilitado quando disabled=true mesmo sem loading", () => {
    render(<Button disabled>Salvar</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Button: click", () => {
  it("dispara onClick quando habilitado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clique</Button>);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("nao dispara onClick quando desabilitado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Clique
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });
});
