import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TextScaleProvider, useTextScale } from "@/components/providers/TextScaleProvider";
import { authenticatedAs, hydrating, makeTestStore, unauthenticated } from "@/test/renderWithProviders";
import type { AuthState } from "@/store/slices/authSlice";

function Probe() {
  const { scale, setScale } = useTextScale();
  return (
    <>
      <span data-testid="scale">{scale}</span>
      <button onClick={() => setScale(1.15)}>grande</button>
      <button onClick={() => setScale(1.3)}>maior</button>
    </>
  );
}

function renderScale(auth: AuthState) {
  return render(
    <Provider store={makeTestStore(auth)}>
      <TextScaleProvider><Probe /></TextScaleProvider>
    </Provider>,
  );
}

const readVar = () => document.documentElement.style.getPropertyValue("--text-scale");

describe("TextScaleProvider", () => {
  beforeEach(() => { document.documentElement.style.removeProperty("--text-scale"); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("aplica a escala salva da conta após hidratar", async () => {
    const auth = authenticatedAs("administrador");
    localStorage.setItem(`kivo:text-scale:v1:user:${auth.user!.id}`, "1.3");
    renderScale(auth);
    await waitFor(() => expect(readVar()).toBe("1.3"));
    expect(screen.getByTestId("scale").textContent).toBe("1.3");
  });

  it("separa visitante e contas", async () => {
    localStorage.setItem("kivo:text-scale:v1:guest", "1.15");
    renderScale(authenticatedAs("administrador"));
    await waitFor(() => expect(readVar()).toBe("1"));
  });

  it("ignora valor inválido", async () => {
    localStorage.setItem("kivo:text-scale:v1:guest", "2");
    renderScale(unauthenticated);
    await waitFor(() => expect(readVar()).toBe("1"));
  });

  it("setScale persiste na chave da identidade atual", async () => {
    const auth = authenticatedAs("administrador");
    renderScale(auth);
    await waitFor(() => expect(readVar()).toBe("1"));
    fireEvent.click(screen.getByText("grande"));
    expect(localStorage.getItem(`kivo:text-scale:v1:user:${auth.user!.id}`)).toBe("1.15");
    await waitFor(() => expect(readVar()).toBe("1.15"));
  });

  it("continua funcional quando localStorage falha", async () => {
    renderScale(unauthenticated);
    await waitFor(() => expect(readVar()).toBe("1"));
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("storage indisponível"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage indisponível"); });
    expect(() => fireEvent.click(screen.getByText("maior"))).not.toThrow();
    await waitFor(() => expect(readVar()).toBe("1.3"));
  });

  it("não aplica antes da hidratação", () => {
    renderScale(hydrating);
    expect(readVar()).toBe("");
  });

  it("lança erro fora do provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/TextScaleProvider/);
  });
});
