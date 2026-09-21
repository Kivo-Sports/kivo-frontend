import { afterEach, describe, expect, it } from "vitest";

import authReducer, {
  clearCredentials,
  restoreAuth,
  setCredentials,
  type AuthenticatedUser,
  type AuthState,
} from "./authSlice";

function base64url(json: object): string {
  const base64 = Buffer.from(JSON.stringify(json)).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${base64url({ alg: "HS256" })}.${base64url(payload)}.signature`;
}

const user: AuthenticatedUser = {
  id: "1",
  name: "QA Torcedor",
  email: "qa@kivo.local",
  cargo: "Torcedor",
};

afterEach(() => {
  localStorage.clear();
});

describe("authSlice: estado inicial", () => {
  it("comeca deslogado e nao hidratado", () => {
    const state = authReducer(undefined, { type: "@@INIT" });

    expect(state).toEqual({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
    });
  });
});

describe("authSlice: setCredentials", () => {
  it("autentica o usuario e persiste no localStorage", () => {
    const state = authReducer(undefined, setCredentials({ token: "abc", user }));

    expect(state.token).toBe("abc");
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBe("abc");
    expect(JSON.parse(localStorage.getItem("auth_user")!)).toEqual(user);
  });

  it("troca de usuario substitui completamente a sessao anterior", () => {
    const first = authReducer(undefined, setCredentials({ token: "abc", user }));
    const outroUser: AuthenticatedUser = { id: "2", name: "Admin", email: "a@kivo.local", cargo: "Administrador" };

    const second = authReducer(first, setCredentials({ token: "xyz", user: outroUser }));

    expect(second.user).toEqual(outroUser);
    expect(second.token).toBe("xyz");
    expect(JSON.parse(localStorage.getItem("auth_user")!)).toEqual(outroUser);
  });
});

describe("authSlice: clearCredentials (logout)", () => {
  it("limpa o estado e o localStorage", () => {
    const authenticated: AuthState = {
      token: "abc",
      user,
      isAuthenticated: true,
      isHydrated: true,
    };
    localStorage.setItem("auth_token", "abc");
    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("inactivity_last_action", String(Date.now()));

    const state = authReducer(authenticated, clearCredentials());

    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
    expect(localStorage.getItem("inactivity_last_action")).toBeNull();
  });

  it("preserva isHydrated como estava (nao mexe na flag de hidratacao)", () => {
    const authenticated: AuthState = { token: "abc", user, isAuthenticated: true, isHydrated: true };

    const state = authReducer(authenticated, clearCredentials());

    expect(state.isHydrated).toBe(true);
  });
});

describe("authSlice: restoreAuth (hidratacao)", () => {
  it("marca isHydrated=true mesmo sem sessao salva", () => {
    const state = authReducer(undefined, restoreAuth());

    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("restaura sessao valida do localStorage", () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));

    const state = authReducer(undefined, restoreAuth());

    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(token);
    expect(state.user).toEqual(user);
  });

  it("descarta sessao com JWT expirado", () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));

    const state = authReducer(undefined, restoreAuth());

    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  it("extrai cargo do JWT quando a sessao salva nao tem (sessao antiga)", () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, Cargo: "Administrador" });
    const userSemCargo = { id: "1", name: "QA", email: "qa@kivo.local" };
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(userSemCargo));

    const state = authReducer(undefined, restoreAuth());

    expect(state.user?.cargo).toBe("Administrador");
    expect(JSON.parse(localStorage.getItem("auth_user")!).cargo).toBe("Administrador");
  });

  it("descarta sessao quando o token salvo esta corrompido", () => {
    localStorage.setItem("auth_token", "token-invalido-sem-partes");
    localStorage.setItem("auth_user", JSON.stringify(user));

    const state = authReducer(undefined, restoreAuth());

    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });
});
