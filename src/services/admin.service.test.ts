import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";

import {
  ativarAdmin,
  checkCPFExists,
  checkEmailExists,
  criarAdmin,
  desativarAdmin,
  editarAdmin,
  listarAdmins,
} from "./admin.service";

const TOKEN = "test-token";

describe("listarAdmins", () => {
  it("retorna a lista quando a API responde 200", async () => {
    server.use(
      http.get(url("/api/usuario/administradores"), () =>
        HttpResponse.json([{ id: "1", nome: "Admin", email: "a@kivo.local", telefone: "", dataNascimento: "" }]),
      ),
    );

    const result = await listarAdmins(TOKEN);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it("retorna erro com a mensagem do backend quando a API falha", async () => {
    server.use(
      http.get(url("/api/usuario/administradores"), () =>
        HttpResponse.json({ message: "Sem permissão" }, { status: 403 }),
      ),
    );

    const result = await listarAdmins(TOKEN);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Sem permissão");
  });

  it("retorna erro de conexão em falha de rede", async () => {
    server.use(http.get(url("/api/usuario/administradores"), () => HttpResponse.error()));

    const result = await listarAdmins(TOKEN);

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("criarAdmin", () => {
  const payload = {
    nome: "Novo Admin",
    email: "novo@kivo.local",
    cpf: "12345678900",
    telefone: "11999999999",
    dataNascimento: "1990-01-01",
    senha: "123456",
  };

  it("cria com sucesso quando a API responde 200", async () => {
    server.use(
      http.post(url("/api/usuario/admin"), () => HttpResponse.json({ id: "1", ...payload })),
    );

    const result = await criarAdmin(payload, TOKEN);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("1");
  });

  it("retorna fieldErrors quando a validacao falha", async () => {
    server.use(
      http.post(url("/api/usuario/admin"), () =>
        HttpResponse.json(
          { message: "Dados invalidos", errors: { email: ["Email ja existe"] } },
          { status: 400 },
        ),
      ),
    );

    const result = await criarAdmin(payload, TOKEN);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Dados invalidos");
    expect(result.fieldErrors).toEqual({ email: ["Email ja existe"] });
  });
});

describe("editarAdmin", () => {
  const payload = { nome: "Editado", email: "e@kivo.local", telefone: "119", dataNascimento: "1990-01-01" };

  it("edita com sucesso", async () => {
    server.use(
      http.put(url("/api/usuario/admin/1"), () => HttpResponse.json({ id: "1", ...payload })),
    );

    const result = await editarAdmin("1", payload, TOKEN);

    expect(result.success).toBe(true);
  });

  it("retorna erro quando a API falha", async () => {
    server.use(
      http.put(url("/api/usuario/admin/1"), () =>
        HttpResponse.json({ message: "Não encontrado" }, { status: 404 }),
      ),
    );

    const result = await editarAdmin("1", payload, TOKEN);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Não encontrado");
  });
});

describe("ativarAdmin / desativarAdmin", () => {
  it("ativarAdmin: sucesso", async () => {
    server.use(http.patch(url("/api/usuario/1/reativar"), () => HttpResponse.json({ id: "1" })));

    const result = await ativarAdmin("1", TOKEN);

    expect(result.success).toBe(true);
  });

  it("ativarAdmin: erro", async () => {
    server.use(
      http.patch(url("/api/usuario/1/reativar"), () =>
        HttpResponse.json({ message: "Falhou" }, { status: 500 }),
      ),
    );

    const result = await ativarAdmin("1", TOKEN);

    expect(result.success).toBe(false);
  });

  it("desativarAdmin: sucesso", async () => {
    server.use(http.delete(url("/api/usuario/1"), () => HttpResponse.json({})));

    const result = await desativarAdmin("1", TOKEN);

    expect(result.success).toBe(true);
  });

  it("desativarAdmin: erro", async () => {
    server.use(
      http.delete(url("/api/usuario/1"), () =>
        HttpResponse.json({ message: "Não pode desativar o unico admin" }, { status: 400 }),
      ),
    );

    const result = await desativarAdmin("1", TOKEN);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Não pode desativar o unico admin");
  });
});

describe("checkEmailExists / checkCPFExists", () => {
  it("checkEmailExists: true quando a API responde ok", async () => {
    server.use(http.post(url("/api/usuario/check-email"), () => new HttpResponse(null, { status: 200 })));

    expect(await checkEmailExists("a@kivo.local")).toBe(true);
  });

  it("checkEmailExists: false quando a API responde erro", async () => {
    server.use(http.post(url("/api/usuario/check-email"), () => new HttpResponse(null, { status: 404 })));

    expect(await checkEmailExists("a@kivo.local")).toBe(false);
  });

  it("checkCPFExists: true quando a API responde ok", async () => {
    server.use(http.post(url("/api/usuario/check-cpf"), () => new HttpResponse(null, { status: 200 })));

    expect(await checkCPFExists("12345678900")).toBe(true);
  });

  it("checkCPFExists: false em falha de rede", async () => {
    server.use(http.post(url("/api/usuario/check-cpf"), () => HttpResponse.error()));

    expect(await checkCPFExists("12345678900")).toBe(false);
  });
});
