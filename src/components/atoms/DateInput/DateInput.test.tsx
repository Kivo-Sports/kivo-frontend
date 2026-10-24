import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateInput } from "./DateInput";

describe("DateInput: valor e alteracao", () => {
  it("mostra o valor e dispara onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateInput id="data-inicio" label="Data de inicio" value="" onChange={onChange} />);

    await user.type(screen.getByLabelText("Data de inicio"), "2026-01-01");

    expect(onChange).toHaveBeenCalled();
  });

  it("usa type=date por padrao e aceita datetime-local/time", () => {
    const { rerender } = render(<DateInput id="data" label="Data" />);
    expect(screen.getByLabelText("Data")).toHaveAttribute("type", "date");

    rerender(<DateInput id="data" label="Data" type="datetime-local" />);
    expect(screen.getByLabelText("Data")).toHaveAttribute("type", "datetime-local");

    rerender(<DateInput id="data" label="Data" type="time" />);
    expect(screen.getByLabelText("Data")).toHaveAttribute("type", "time");
  });
});

describe("DateInput: erro / fallback", () => {
  it("mostra a mensagem de erro quando fornecida", () => {
    render(<DateInput id="data" label="Data" error="Data invalida" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Data invalida");
  });

  it("nao mostra erro quando nao ha error nem aria-invalid", () => {
    render(<DateInput id="data" label="Data" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("fica desabilitado quando disabled=true", () => {
    render(<DateInput id="data" label="Data" disabled />);
    expect(screen.getByLabelText("Data")).toBeDisabled();
  });
});
