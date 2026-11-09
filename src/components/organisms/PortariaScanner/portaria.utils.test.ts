import { describe, expect, it } from "vitest";
import { extrairCodigo, interpretarErroValidacao } from "./portaria.utils";

const CODIGO = "0123456789ABCDEF0123456789ABCDEF";

describe("extrairCodigo", () => {
  it("normaliza espaços e minúsculas do QR Code", () => {
    expect(extrairCodigo(`  ${CODIGO.toLowerCase()}\n`)).toBe(CODIGO);
  });

  it("extrai o código quando o QR traz uma URL", () => {
    expect(extrairCodigo(`https://www.kivosports.site/ingresso/${CODIGO}?x=1`)).toBe(CODIGO);
  });

  it("mantém códigos fora do padrão para o backend responder", () => {
    expect(extrairCodigo(" abc123 ")).toBe("ABC123");
  });
});

describe("interpretarErroValidacao", () => {
  it("409 vira ingresso já utilizado com o titular", () => {
    const resultado = interpretarErroValidacao(
      {
        status: 409,
        data: { message: "Já usado", nomeTitular: "Maria", dataUso: "2026-11-06T22:10:00Z" },
      },
      CODIGO,
    );
    expect(resultado).toMatchObject({ tipo: "usado", nomeTitular: "Maria", codigo: CODIGO });
  });

  it("403 vira ingresso de outro evento, sem a mensagem genérica de acesso negado", () => {
    const resultado = interpretarErroValidacao(
      {
        status: 403,
        data: { message: "Acesso negado: seu perfil não tem permissão para esta ação." },
      },
      CODIGO,
    );
    expect(resultado).toMatchObject({
      tipo: "negado",
      titulo: "Ingresso de outro evento",
      mensagem: "Este ingresso não é de nenhuma partida dos seus campeonatos.",
    });
  });

  it("404 e 400 bloqueiam a entrada", () => {
    expect(interpretarErroValidacao({ status: 404 }, CODIGO).tipo).toBe("negado");
    expect(
      interpretarErroValidacao({ status: 400, data: { message: "Pendente" } }, CODIGO),
    ).toMatchObject({
      tipo: "negado",
      mensagem: "Pendente",
    });
  });

  it("falha de rede permite tentar de novo", () => {
    expect(interpretarErroValidacao({ status: "FETCH_ERROR" }, CODIGO).tipo).toBe("falha");
    expect(interpretarErroValidacao({ status: 500 }, CODIGO).tipo).toBe("falha");
  });
});
