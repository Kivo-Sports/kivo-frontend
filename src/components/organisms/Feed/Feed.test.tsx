import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { url } from "@/test/msw/handlers";
import { renderWithProviders, authenticatedAs } from "@/test/renderWithProviders";
import { Feed } from "./Feed";
import { PostComposer } from "./PostComposer";
import type { Post } from "@/types/post";

const post: Post = {
  id: "post-1",
  autorId: "owner",
  autorNome: "Atlético do Bairro",
  tipoAutorExibicao: 1,
  entidadeAutorId: "team-1",
  autorImagemUrl: null,
  titulo: "Vitória na estreia",
  conteudo: "A torcida fez a diferença!",
  imagemUrl: null,
  criadoEm: "2026-09-13T12:00:00Z",
  atualizadoEm: null,
};

describe("Feed Kivo", () => {
  it("publica somente por campeonatos do organizador", async () => {
    let received: FormData | undefined;
    server.use(
      http.get(url("/api/Usuario/:id"), () =>
        HttpResponse.json({ organizadorCampeonatoId: "org-1" }),
      ),
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          { id: "cup-1", nome: "Copa do Bairro", organizadorCampeonatoId: "org-1" },
          { id: "cup-2", nome: "Copa de outro organizador", organizadorCampeonatoId: "org-2" },
        ]),
      ),
      http.post(url("/api/Post"), async ({ request }) => {
        received = await request.formData();
        return HttpResponse.json(post, { status: 201 });
      }),
    );
    const done = vi.fn();
    renderWithProviders(<PostComposer onDone={done} onCancel={vi.fn()} />, {
      auth: authenticatedAs("organizadorCampeonato"),
    });
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Publicar como" })).toHaveTextContent(
        "Copa do Bairro",
      ),
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Publicar como" }));
    await screen.findByRole("option", { name: "Copa do Bairro" });
    expect(
      screen.queryByRole("option", { name: "Copa de outro organizador" }),
    ).not.toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText("Publicação", { exact: true }),
      "Inscrições abertas!",
    );
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(received?.get("TipoAutorExibicao")).toBe("2");
    expect(received?.get("EntidadeAutorId")).toBe("cup-1");
  });

  it("exige confirmação para excluir e atualiza o feed após a exclusão", async () => {
    let deleted = false;
    server.use(
      http.get(url("/api/Post"), () => HttpResponse.json(deleted ? [] : [post])),
      http.delete(url("/api/Post/:id"), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<Feed />, { auth: authenticatedAs("administrador") });
    await screen.findByText("Vitória na estreia");
    await userEvent.click(screen.getByRole("button", { name: "Excluir publicação" }));
    expect(deleted).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(deleted).toBe(false);
    await waitFor(() => expect(screen.queryByText("Excluir publicação?")).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Excluir publicação" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Excluir publicação" })[1]);
    await waitFor(() => expect(screen.queryByText("Vitória na estreia")).not.toBeInTheDocument());
    expect(deleted).toBe(true);
  });
  it("permite leitura pública e filtra por autor e tipo sem oferecer edição", async () => {
    server.use(http.get(url("/api/Post"), () => HttpResponse.json([post])));
    renderWithProviders(<Feed />);
    expect(await screen.findByText("Vitória na estreia")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar publicação" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Campeonatos" }));
    expect(screen.getByText("Nenhuma publicação por aqui")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver todas" }));
    await userEvent.type(screen.getByLabelText("Buscar no feed"), "Atlético");
    expect(screen.getByText("Vitória na estreia")).toBeInTheDocument();
  });

  it("recupera um erro de carregamento ao tentar novamente", async () => {
    server.use(http.get(url("/api/Post"), () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<Feed />);
    expect(await screen.findByText("O feed não carregou")).toBeInTheDocument();
    server.use(http.get(url("/api/Post"), () => HttpResponse.json([post])));
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Vitória na estreia")).toBeInTheDocument();
  });

  it("não oferece criação para torcedor", async () => {
    server.use(http.get(url("/api/Post"), () => HttpResponse.json([])));
    renderWithProviders(<Feed />, { auth: authenticatedAs("torcedor") });
    await screen.findByText("Todo grande jogo tem um primeiro lance.");
    expect(screen.queryByRole("button", { name: /Publicar/ })).not.toBeInTheDocument();
  });

  it("publica como o time do organizador e envia multipart autenticado", async () => {
    let received: FormData | undefined;
    let authorization: string | null = null;
    server.use(
      http.get(url("/api/Usuario/:id"), () => HttpResponse.json({ organizadorTimeId: "org-1" })),
      http.get(url("/api/time/organizador"), () =>
        HttpResponse.json([
          { id: "team-1", nome: "Meu time", organizadorTimeId: "org-1" },
          { id: "other", nome: "Outro time", organizadorTimeId: "org-2" },
        ]),
      ),
      http.post(url("/api/Post"), async ({ request }) => {
        received = await request.formData();
        authorization = request.headers.get("Authorization");
        return HttpResponse.json(post, { status: 201 });
      }),
    );
    const done = vi.fn();
    renderWithProviders(<PostComposer onDone={done} onCancel={vi.fn()} />, {
      auth: authenticatedAs("organizadorTime"),
    });
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Publicar como" })).toHaveTextContent("Meu time"),
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Publicar como" }));
    await screen.findByRole("option", { name: "Meu time" });
    expect(screen.queryByRole("option", { name: "Outro time" })).not.toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText("Publicação", { exact: true }),
      "Nosso próximo jogo!",
    );
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(received?.get("TipoAutorExibicao")).toBe("1");
    expect(received?.get("EntidadeAutorId")).toBe("team-1");
    expect(received?.get("Conteudo")).toBe("Nosso próximo jogo!");
    expect(authorization).toBe("Bearer test-token");
  });

  it("bloqueia post vazio e imagem acima do limite", async () => {
    renderWithProviders(<PostComposer onDone={vi.fn()} onCancel={vi.fn()} />, {
      auth: authenticatedAs("administrador"),
    });
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escreva algo ou adicione uma imagem");
    const file = new File(["x"], "foto.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText("Selecionar imagem"), { target: { files: [file] } });
    expect(screen.getByRole("alert")).toHaveTextContent("até 5 MB");
  });

  it("edita removendo imagem e preserva o rascunho após falha", async () => {
    let received: FormData | undefined;
    server.use(
      http.put(url("/api/Post/:id"), async ({ request }) => {
        received = await request.formData();
        return HttpResponse.json("Falha ao salvar", { status: 400 });
      }),
    );
    renderWithProviders(
      <PostComposer
        post={{ ...post, imagemUrl: "https://example.com/foto.png" }}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
      { auth: authenticatedAs("administrador") },
    );
    await userEvent.click(screen.getByRole("button", { name: "Remover imagem" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao salvar");
    expect(received?.get("RemoverImagem")).toBe("true");
    expect(screen.getByLabelText("Publicação", { exact: true })).toHaveValue(post.conteudo);
  });
});
