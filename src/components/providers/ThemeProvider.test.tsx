import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ThemeSelector } from "@/components/molecules/ThemeSelector/ThemeSelector";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { clearCredentials, setCredentials } from "@/store/slices/authSlice";
import { authenticatedAs, makeUser, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

describe("ThemeProvider", () => {
  it("separa visitante e contas e restaura a preferência ao alternar identidades", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(
      <ThemeProvider><ThemeSelector /></ThemeProvider>,
      { auth: unauthenticated },
    );
    const chooseLight = async () => {
      await user.click(screen.getByRole("button", { name: /Aparência:/ }));
      await user.click(screen.getByRole("button", { name: "Claro" }));
    };

    await chooseLight();
    expect(localStorage.getItem("kivo:theme:v1:guest")).toBe("light");
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));

    const accountA = authenticatedAs("administrador");
    store.dispatch(setCredentials({ token: "qa-token", user: accountA.user! }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await chooseLight();
    expect(localStorage.getItem(`kivo:theme:v1:user:${accountA.user!.id}`)).toBe("light");

    const accountB = makeUser("Administrador", { id: "88888888-8888-8888-8888-888888888888" });
    store.dispatch(setCredentials({ token: "qa-token", user: accountB }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));

    store.dispatch(clearCredentials());
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
  });

  it("mantem o tema funcional durante a sessao quando localStorage falha", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeProvider><ThemeSelector /></ThemeProvider>, { auth: unauthenticated });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage indisponível"); });

    await user.click(screen.getByRole("button", { name: /Aparência:/ }));
    await user.click(screen.getByRole("button", { name: "Claro" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    vi.restoreAllMocks();
  });
});
