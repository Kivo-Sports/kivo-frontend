"use client";
/* eslint-disable @next/next/no-img-element -- Imagens de usuários vêm do storage configurado pela API. */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ImagePlus,
  Megaphone,
  Pencil,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import {
  useListarPostsQuery,
  useObterPostQuery,
  useExcluirPostMutation,
} from "@/store/api/postApi";
import { useToast } from "@/components/atoms/Toast";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import type { Post } from "@/types/post";
import { PostComposer, postError } from "./PostComposer";
import styles from "./feed.module.css";

const authorLabel = ["Comunidade Kivo", "Time", "Campeonato"];
function authorHref(post: Post) {
  return post.entidadeAutorId && post.tipoAutorExibicao !== 0
    ? `/${post.tipoAutorExibicao === 1 ? "times" : "campeonatos"}/${post.entidadeAutorId}`
    : null;
}

function PostCard({
  post,
  canEdit,
  onEdit,
  onDelete,
}: {
  post: Post;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [brokenImage, setBrokenImage] = useState(false);
  const toast = useToast();
  const href = authorHref(post);
  const date = new Date(
    /[zZ]$|[+-]\d{2}:\d{2}$/.test(post.criadoEm) ? post.criadoEm : `${post.criadoEm}Z`,
  );
  const dateLabel = Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
  const name = <strong>{post.autorNome || "Comunidade Kivo"}</strong>;
  async function share() {
    const url = `${window.location.origin}/posts/${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({ title: post.titulo || `Publicação de ${post.autorNome}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link da publicação copiado!");
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError"))
        toast.error("Não foi possível compartilhar. Abra a publicação e copie o endereço.");
    }
  }
  return (
    <article className={styles.post} aria-label={`Publicação de ${post.autorNome}`}>
      <header className={styles.postHeader}>
        <div className={styles.avatar}>
          {post.autorImagemUrl ? (
            <img
              src={post.autorImagemUrl}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            post.autorNome.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className={styles.author}>
          {href ? <Link href={href}>{name}</Link> : name}
          <div className={styles.meta}>
            <span>{authorLabel[post.tipoAutorExibicao]}</span>
            <span>·</span>
            <Link href={`/posts/${post.id}`}>
              <time dateTime={post.criadoEm}>{dateLabel}</time>
            </Link>
            {post.atualizadoEm && <span>· editado</span>}
          </div>
        </div>
        {canEdit && (
          <div className={styles.row}>
            <button
              className={styles.iconButton}
              onClick={onEdit}
              aria-label="Editar publicação"
              title="Editar publicação"
            >
              <Pencil size={17} />
            </button>
            <button
              className={styles.iconButton}
              onClick={onDelete}
              aria-label="Excluir publicação"
              title="Excluir publicação"
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </header>
      <div className={styles.postBody}>
        {post.titulo && <h2>{post.titulo}</h2>}
        {post.conteudo && (
          <>
            <p className={styles.content}>
              {!expanded && post.conteudo.length > 600
                ? `${post.conteudo.slice(0, 600)}…`
                : post.conteudo}
            </p>
            {post.conteudo.length > 600 && (
              <button className={styles.textButton} onClick={() => setExpanded(!expanded)}>
                {expanded ? "Mostrar menos" : "Ler mais"}
              </button>
            )}
          </>
        )}
      </div>
      {post.imagemUrl &&
        (brokenImage ? (
          <p className={styles.empty}>Imagem indisponível.</p>
        ) : (
          <img
            className={styles.postImage}
            src={post.imagemUrl}
            alt={post.titulo || `Imagem da publicação de ${post.autorNome}`}
            loading="lazy"
            onError={() => setBrokenImage(true)}
          />
        ))}
      <footer className={styles.postFooter}>
        <Link href={`/posts/${post.id}`}>
          Ver publicação <ArrowUpRight size={15} />
        </Link>
        <button className={styles.textButton} onClick={share}>
          <Share2 size={16} /> Compartilhar
        </button>
      </footer>
    </article>
  );
}

export function Feed({ postId }: { postId?: string }) {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const admin = ["admin", "Administrador"].includes(user?.cargo ?? "");
  const canPublish =
    isAuthenticated &&
    [
      "admin",
      "Administrador",
      "OrganizadorTime",
      "organizador-time",
      "OrganizadorCampeonato",
      "organizador-campeonato",
    ].includes(user?.cargo ?? "");
  const listing = useListarPostsQuery(undefined, {
    skip: !!postId,
    refetchOnMountOrArgChange: true,
  });
  const single = useObterPostQuery(postId ?? "", { skip: !postId });
  const query = postId ? single : listing;
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [editor, setEditor] = useState<Post | "new" | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [remove, removing] = useExcluirPostMutation();
  const toast = useToast();
  const posts = postId ? (single.data ? [single.data] : []) : (listing.data ?? []);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = posts.filter(
    (p) =>
      (filter === "todos" ||
        (filter === "times" && p.tipoAutorExibicao === 1) ||
        (filter === "campeonatos" && p.tipoAutorExibicao === 2) ||
        (filter === "meus" && p.autorId === user?.id)) &&
      `${p.autorNome} ${p.titulo ?? ""} ${p.conteudo ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch),
  );
  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove(deleting.id).unwrap();
      setDeleting(null);
      toast.success("Publicação excluída.");
    } catch (err) {
      toast.error(postError(err));
    }
  }
  return (
    <div className={styles.feed}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <span /> A COMUNIDADE ENTRA EM CAMPO
          </span>
          <h1>
            O esporte acontece aqui<span>.</span>
          </h1>
          <p>Da resenha ao apito final. Acompanhe quem faz o esporte amador acontecer.</p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          <Megaphone size={58} strokeWidth={1.2} />
        </div>
      </header>
      <div className={styles.layout}>
        <section className={styles.timeline} aria-label="Feed de notícias">
          {postId && (
            <Link className={styles.back} href="/home">
              ← Voltar ao feed
            </Link>
          )}
          {canPublish && !postId && editor !== "new" && (
            <button className={styles.composerTrigger} onClick={() => setEditor("new")}>
              <span className={styles.avatar}>{user?.name.slice(0, 2).toUpperCase()}</span>
              <span>
                Tem novidade para a torcida?
                <small>Compartilhe um momento, resultado ou notícia</small>
              </span>
              <ImagePlus size={23} />
              <span className={styles.publishLabel}>Publicar</span>
            </button>
          )}
          {editor === "new" && canPublish && (
            <PostComposer
              key={user?.id}
              onCancel={() => setEditor(null)}
              onDone={() => {
                setEditor(null);
                setFilter("todos");
                setSearch("");
                toast.success("Publicação no ar!");
              }}
            />
          )}
          {!postId && (
            <div className={styles.tools}>
              <div className={styles.tabs} aria-label="Filtrar publicações">
                {[
                  ["todos", "Para a torcida"],
                  ["times", "Times"],
                  ["campeonatos", "Campeonatos"],
                  ...(canPublish ? [["meus", "Minhas publicações"]] : []),
                ].map(([key, label]) => (
                  <button
                    key={key}
                    aria-pressed={filter === key}
                    className={filter === key ? styles.activeTab : ""}
                    onClick={() => {
                      setFilter(key);
                      setLimit(10);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.search}>
                <Search size={18} />
                <input
                  aria-label="Buscar no feed"
                  placeholder="Buscar notícias, times e campeonatos"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(10);
                  }}
                />
                <button
                  className={styles.iconButton}
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                  aria-label="Atualizar feed"
                >
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>
          )}
          {query.isLoading ? (
            <div role="status" aria-label="Carregando publicações" className={styles.skeletons}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.skeleton}>
                  <div />
                  <div />
                  <div />
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <div className={styles.empty} role="alert">
              <Megaphone size={32} />
              <h2>
                {postId &&
                "status" in (query.error ?? {}) &&
                (query.error as { status: unknown }).status === 404
                  ? "Publicação não encontrada"
                  : "O feed não carregou"}
              </h2>
              <p>
                {postId
                  ? "Ela pode ter sido removida ou estar indisponível."
                  : "Não conseguimos buscar as notícias agora. Tente novamente."}
              </p>
              <button className={styles.secondary} onClick={() => void query.refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Megaphone size={36} />
              <h2>
                {search || filter !== "todos"
                  ? "Nenhuma publicação por aqui"
                  : "Todo grande jogo tem um primeiro lance."}
              </h2>
              <p>
                {search || filter !== "todos"
                  ? "Experimente outra busca ou confira todas as notícias."
                  : "As novidades dos times e campeonatos vão aparecer aqui."}
              </p>
              {search || filter !== "todos" ? (
                <button
                  className={styles.secondary}
                  onClick={() => {
                    setSearch("");
                    setFilter("todos");
                  }}
                >
                  Ver todas
                </button>
              ) : (
                canPublish && (
                  <button className={styles.primary} onClick={() => setEditor("new")}>
                    Criar primeira publicação
                  </button>
                )
              )}
            </div>
          ) : (
            <>
              {filtered.slice(0, limit).map((post) =>
                editor && editor !== "new" && editor.id === post.id && isAuthenticated ? (
                  <PostComposer
                    key={`edit-${post.id}-${user?.id}`}
                    post={post}
                    onCancel={() => setEditor(null)}
                    onDone={() => {
                      setEditor(null);
                      toast.success("Publicação atualizada!");
                    }}
                  />
                ) : (
                  <PostCard
                    key={post.id}
                    post={post}
                    canEdit={isAuthenticated && (admin || post.autorId === user?.id)}
                    onEdit={() => setEditor(post)}
                    onDelete={() => setDeleting(post)}
                  />
                ),
              )}
              {filtered.length > limit ? (
                <button className={styles.loadMore} onClick={() => setLimit((value) => value + 10)}>
                  Carregar mais publicações
                </button>
              ) : (
                !postId && <p className={styles.end}>Você está em dia com a torcida.</p>
              )}
            </>
          )}
        </section>
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <span className={styles.eyebrow}>ALÉM DO PLACAR</span>
            <h2>O próximo encontro começa aqui.</h2>
            <p>Encontre sua equipe, acompanhe a competição e faça parte da história.</p>
            <Link href="/campeonatos">
              <Trophy size={21} />
              <span>
                Explore campeonatos<small>Uma nova disputa para acompanhar</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/times">
              <Users size={21} />
              <span>
                Conheça os times<small>O talento da nossa comunidade</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className={styles.community}>
            <Megaphone size={23} />
            <h3>A voz do esporte amador.</h3>
            <p>
              Treino, raça e muita história para contar. Este espaço é de quem vive o jogo de
              verdade.
            </p>
            {!isAuthenticated && <Link href="/login">Entre para a comunidade →</Link>}
          </div>
          <p className={styles.signature}>KIVO SPORTS · DENTRO E FORA DE CAMPO</p>
        </aside>
      </div>
      <ConfirmModal
        isOpen={!!deleting}
        title="Excluir publicação?"
        description="A publicação será removida do feed. Essa ação não pode ser desfeita."
        confirmLabel="Excluir publicação"
        danger
        loading={removing.isLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
