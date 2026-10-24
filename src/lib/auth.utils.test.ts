import { describe, expect, it } from "vitest";

import {
  detectIdentifierType,
  formatCPFInput,
  getHomeRoute,
  getRedirectPathAfterLogin,
  isCPFValid,
  isEmailValid,
  isOrganizadorCampeonato,
  isOrganizadorTime,
  isPasswordValid,
  isTorcedor,
  normalizeCargo,
} from "./auth.utils";

describe("normalizeCargo", () => {
  it("retorna string vazia quando cargo e undefined", () => {
    expect(normalizeCargo(undefined)).toBe("");
  });

  it("retorna string vazia quando cargo e string vazia", () => {
    expect(normalizeCargo("")).toBe("");
  });

  it("normaliza PascalCase do backend para kebab-case", () => {
    expect(normalizeCargo("OrganizadorTime")).toBe("organizador-time");
    expect(normalizeCargo("OrganizadorCampeonato")).toBe("organizador-campeonato");
  });

  it("normaliza cargo simples para minusculo", () => {
    expect(normalizeCargo("Torcedor")).toBe("torcedor");
    expect(normalizeCargo("Administrador")).toBe("administrador");
  });

  it("remove acentos", () => {
    expect(normalizeCargo("Órgão")).toBe("orgao");
  });

  it("normaliza underscores e espacos para hifen", () => {
    expect(normalizeCargo("organizador_time")).toBe("organizador-time");
    expect(normalizeCargo("organizador time")).toBe("organizador-time");
  });

  it("colapsa hifens repetidos", () => {
    expect(normalizeCargo("organizador--time")).toBe("organizador-time");
  });
});

describe("isTorcedor / isOrganizadorTime / isOrganizadorCampeonato", () => {
  it("identifica torcedor corretamente", () => {
    expect(isTorcedor("Torcedor")).toBe(true);
    expect(isTorcedor("Administrador")).toBe(false);
    expect(isTorcedor(undefined)).toBe(false);
  });

  it("identifica organizador de time nas duas formas aceitas", () => {
    expect(isOrganizadorTime("OrganizadorTime")).toBe(true);
    expect(isOrganizadorTime("organizador-de-time")).toBe(true);
    expect(isOrganizadorTime("Torcedor")).toBe(false);
  });

  it("identifica organizador de campeonato nas duas formas aceitas", () => {
    expect(isOrganizadorCampeonato("OrganizadorCampeonato")).toBe(true);
    expect(isOrganizadorCampeonato("organizador-de-campeonato")).toBe(true);
    expect(isOrganizadorCampeonato("OrganizadorTime")).toBe(false);
  });
});

describe("detectIdentifierType", () => {
  it("detecta email valido", () => {
    expect(detectIdentifierType("user@kivo.com")).toBe("email");
  });

  it("marca email incompleto como invalido", () => {
    expect(detectIdentifierType("user@kivo")).toBe("invalid");
  });

  it("detecta CPF quando tem exatamente 11 digitos", () => {
    expect(detectIdentifierType("12345678900")).toBe("cpf");
    expect(detectIdentifierType("123.456.789-00")).toBe("cpf");
  });

  it("marca como invalido quando tem menos de 11 digitos e sem @", () => {
    expect(detectIdentifierType("123456")).toBe("invalid");
  });

  it("marca como invalido quando tem mais de 11 digitos e sem @", () => {
    expect(detectIdentifierType("123456789001")).toBe("invalid");
  });
});

describe("formatCPFInput", () => {
  it("formata progressivamente enquanto digita", () => {
    expect(formatCPFInput("123")).toBe("123");
    expect(formatCPFInput("1234")).toBe("123.4");
    expect(formatCPFInput("123456789")).toBe("123.456.789");
    expect(formatCPFInput("12345678900")).toBe("123.456.789-00");
  });

  it("ignora caracteres nao numericos", () => {
    expect(formatCPFInput("123.456.789-00abc")).toBe("123.456.789-00");
  });

  it("trunca em 11 digitos", () => {
    expect(formatCPFInput("123456789001234")).toBe("123.456.789-00");
  });
});

describe("isCPFValid", () => {
  it("aceita CPF com 11 digitos, formatado ou nao", () => {
    expect(isCPFValid("12345678900")).toBe(true);
    expect(isCPFValid("123.456.789-00")).toBe(true);
  });

  it("rejeita CPF com quantidade errada de digitos", () => {
    expect(isCPFValid("123456789")).toBe(false);
    expect(isCPFValid("")).toBe(false);
  });
});

describe("isEmailValid", () => {
  it("aceita emails validos", () => {
    expect(isEmailValid("user@kivo.com")).toBe(true);
  });

  it("rejeita emails invalidos", () => {
    expect(isEmailValid("user@kivo")).toBe(false);
    expect(isEmailValid("user")).toBe(false);
  });
});

describe("isPasswordValid", () => {
  it("usa minimo padrao de 6 caracteres", () => {
    expect(isPasswordValid("12345")).toBe(false);
    expect(isPasswordValid("123456")).toBe(true);
  });

  it("aceita minimo customizado", () => {
    expect(isPasswordValid("12345678", 8)).toBe(true);
    expect(isPasswordValid("1234567", 8)).toBe(false);
  });
});

describe("getRedirectPathAfterLogin", () => {
  it("retorna /dashboard quando cargo nao existe", () => {
    expect(getRedirectPathAfterLogin(undefined)).toBe("/dashboard");
    expect(getRedirectPathAfterLogin(null)).toBe("/dashboard");
  });

  it("mapeia cada cargo conhecido para sua rota", () => {
    expect(getRedirectPathAfterLogin("Torcedor")).toBe("/torcedor");
    expect(getRedirectPathAfterLogin("OrganizadorTime")).toBe("/organizador/times");
    expect(getRedirectPathAfterLogin("OrganizadorCampeonato")).toBe("/organizador/campeonatos");
    expect(getRedirectPathAfterLogin("Administrador")).toBe("/admin");
  });

  it("cai no fallback /dashboard para cargo desconhecido", () => {
    expect(getRedirectPathAfterLogin("CargoQualquer")).toBe("/dashboard");
  });
});

describe("getHomeRoute", () => {
  it("sempre retorna /home independente do cargo", () => {
    expect(getHomeRoute("Torcedor")).toBe("/home");
    expect(getHomeRoute(undefined)).toBe("/home");
  });
});
