"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Send, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useGetPerfilUsuarioQuery } from "@/store/api/userApi";
import { useListarTimesOrganizadorQuery } from "@/store/api/timeApi";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useCriarPostMutation, useEditarPostMutation } from "@/store/api/postApi";
import type { Post, TipoAutorPost } from "@/types/post";
import { AuthorPicker, type AuthorOption } from "./AuthorPicker";
import styles from "./feed.module.css";

export function postError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    if (error.status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
    if (error.status === 403) return "Você não tem permissão para alterar esta publicação.";
    if ("data" in error && typeof error.data === "string") return error.data;
    if (
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data &&
      typeof error.data.message === "string"
    )
      return error.data.message;
  }
  return "Não foi possível concluir. Verifique sua conexão e tente novamente.";
}

export function PostComposer({
  post,
  onDone,
  onCancel,
}: {
  post?: Post;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { user } = useAppSelector((s) => s.auth);
  const admin = ["admin", "Administrador"].includes(user?.cargo ?? "");
  const team = ["organizador-time", "OrganizadorTime"].includes(user?.cargo ?? "");
  const championship = ["organizador-campeonato", "OrganizadorCampeonato"].includes(
    user?.cargo ?? "",
  );
  const profile = useGetPerfilUsuarioQuery(user?.id ?? "", { skip: !user || !!post || admin });
  const teams = useListarTimesOrganizadorQuery(undefined, {
    skip: !team || !!post,
    refetchOnMountOrArgChange: true,
  });
  const championships = useListarCampeonatosQuery(undefined, { skip: !championship || !!post });
  const options: AuthorOption[] = team
    ? (teams.currentData ?? [])
        .filter((t) => t.organizadorTimeId === profile.currentData?.organizadorTimeId)
        .map((t) => ({
          id: t.id,
          nome: t.nome,
          logoUrl: t.logoUrl,
          detalhe: [t.cidade && t.estado ? `${t.cidade}/${t.estado}` : t.cidade, t.esporteNome]
            .filter(Boolean)
            .join(" · "),
        }))
    : (championships.data ?? [])
        .filter((c) => c.organizadorCampeonatoId === profile.currentData?.organizadorCampeonatoId)
        .map((c) => ({
          id: c.id,
          nome: c.nome,
          logoUrl: c.logoUrl,
          detalhe: [c.esporteNome, c.status].filter(Boolean).join(" · "),
        }));
  const [author, setAuthor] = useState("");
  const selectedAuthor = author || options[0]?.id || "";
  const [title, setTitle] = useState(post?.titulo ?? "");
  const [content, setContent] = useState(post?.conteudo ?? "");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [create, creating] = useCriarPostMutation();
  const [edit, editing] = useEditarPostMutation();
  const busy = creating.isLoading || editing.isLoading;
  const image = preview || (!removeImage ? post?.imagemUrl : null);
  const loadingAuthors =
    !post && !admin && (profile.isFetching || teams.isFetching || championships.isFetching);
  const authorsError =
    !post && !admin && (profile.isError || teams.isError || championships.isError);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!content.trim() && !image) {
      setError("Escreva algo ou adicione uma imagem para publicar.");
      return;
    }
    if (!post && !admin && !options.some((o) => o.id === selectedAuthor)) {
      setError("Selecione quem está publicando.");
      return;
    }
    const data = { titulo: title, conteudo: content, imagem: file, removerImagem: removeImage };
    try {
      if (post) await edit({ id: post.id, input: data }).unwrap();
      else
        await create({
          ...data,
          tipoAutorExibicao: (admin ? 0 : team ? 1 : 2) as TipoAutorPost,
          entidadeAutorId: admin ? undefined : selectedAuthor,
        }).unwrap();
      onDone();
    } catch (err) {
      setError(postError(err));
    }
  }

  return (
    <form
      onSubmit={submit}
      className={styles.composer}
      aria-label={post ? "Editar publicação" : "Criar publicação"}
    >
      <div className={styles.row}>
        <h2>{post ? "Editar publicação" : "Sua história também entra em campo."}</h2>
        <button
          type="button"
          className={styles.iconButton}
          disabled={busy}
          onClick={onCancel}
          aria-label="Fechar editor"
        >
          <X size={20} />
        </button>
      </div>
      <p className={styles.muted}>Resultados, bastidores e aquele lance que merece a torcida.</p>
      {post ? (
        <p className={styles.muted}>
          Publicando como <strong>{post.autorNome}</strong>
        </p>
      ) : admin ? (
        <p className={styles.muted}>
          Publicando como <strong>{user?.name}</strong> · Administração Kivo
        </p>
      ) : (
        <>
          <AuthorPicker
            label="Publicar como"
            options={options}
            value={selectedAuthor}
            onChange={setAuthor}
            disabled={busy || loadingAuthors || !!authorsError}
            placeholder={loadingAuthors ? "Carregando seus perfis…" : "Selecione um perfil"}
          />
          {authorsError ? (
            <p role="alert">
              Não foi possível carregar seus perfis.{" "}
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  void profile.refetch();
                  if (team) void teams.refetch();
                  if (championship) void championships.refetch();
                }}
              >
                Tentar novamente
              </button>
            </p>
          ) : (
            !loadingAuthors &&
            options.length === 0 && (
              <p className={styles.muted}>
                Você precisa de um {team ? "time" : "campeonato"} para publicar.{" "}
                <Link href={team ? "/organizador/times/criar" : "/organizador/campeonatos/criar"}>
                  Criar agora →
                </Link>
              </p>
            )
          )}
        </>
      )}
      <label className={styles.label}>
        Título <span className={styles.muted}>(opcional)</span>
        <input
          autoFocus
          maxLength={160}
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dê um destaque à sua notícia"
        />
      </label>
      <label className={styles.label}>
        Publicação
        <textarea
          maxLength={5000}
          rows={5}
          value={content}
          disabled={busy}
          onChange={(e) => setContent(e.target.value)}
          placeholder="O que está acontecendo com seu time ou campeonato?"
        />
      </label>
      <div className={styles.counter}>{content.length.toLocaleString("pt-BR")} / 5.000</div>
      {image && (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Prévia da imagem da publicação" />
          <button
            type="button"
            disabled={busy}
            className={styles.secondary}
            onClick={() => {
              setFile(undefined);
              setPreview("");
              setRemoveImage(true);
            }}
          >
            Remover imagem
          </button>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        disabled={busy}
        aria-label="Selecionar imagem"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          e.target.value = "";
          if (!chosen) return;
          if (
            !chosen.type.startsWith("image/") ||
            chosen.size === 0 ||
            chosen.size > 5 * 1024 * 1024
          ) {
            setError("Selecione uma imagem válida de até 5 MB.");
            return;
          }
          setError("");
          setFile(chosen);
          setPreview(URL.createObjectURL(chosen));
        }}
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={18} />
          {image ? "Trocar imagem" : "Adicionar imagem"}
        </button>
        <span className={styles.hint}>Até 5 MB</span>
        <button
          className={styles.primary}
          disabled={
            busy || (!post && !admin && (loadingAuthors || !!authorsError || options.length === 0))
          }
        >
          <Send size={16} />
          {busy ? "Salvando…" : post ? "Salvar alterações" : "Publicar"}
        </button>
      </div>
    </form>
  );
}
