"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { AppLayout } from "@/components/templates/AppLayout";
import { SettingsSidebar } from "@/components/organisms/SettingsSidebar";
import styles from "./usuarios.module.css";
import { Button } from "@/components/atoms/Button";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { UsuarioList, situacoesUsuario } from "@/components/molecules/UsuarioList/UsuarioList";
import { UsuarioCargoModal } from "@/components/molecules/UsuarioCargoModal/UsuarioCargoModal";
import { useToast } from "@/components/atoms/Toast";
import { normalizeCargo } from "@/lib/auth.utils";
import {
  listarUsuarios,
  alterarEstadoUsuario,
  alterarCargoUsuario,
  cargosUsuario,
  UsuarioGestaoErro,
  type UsuarioGestao,
  type UsuariosPagina,
} from "@/services/usuario.service";

export default function UsuariosPage() {
  const { user, token, isHydrated } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const toast = useToast();
  const admin = normalizeCargo(user?.cargo) === "administrador";
  const [busca, setBusca] = useState("");
  const [cargo, setCargo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<UsuariosPagina>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState<{ usuario: UsuarioGestao; acao: string }>();
  const [editing, setEditing] = useState<UsuarioGestao>();
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isHydrated && (!user || !admin)) router.replace("/configuracoes");
  }, [isHydrated, user, admin, router]);
  useEffect(() => {
    if (!token || !admin) return;
    const controller = new AbortController();
    // Small debounce avoids racing responses while typing; abort also protects filter/page changes.
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        busca,
        cargo,
        situacao,
      });
      if (!cargo) params.delete("cargo");
      listarUsuarios(token, params, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setResult(data);
        })
        .catch((e) => {
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : "Erro ao carregar usuários.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, admin, page, busca, cargo, situacao, refresh]);

  const saveCargo = async (newCargo: number, dadosPerfil: unknown) => {
    if (!token || !editing) return;
    setModalError("");
    try {
      await alterarCargoUsuario(token, editing.id, newCargo, dadosPerfil);
      setEditing(undefined);
      setRefresh((v) => v + 1);
      toast.success("Perfil atualizado. O usuário deve entrar novamente.");
    } catch (e) {
      const links =
        e instanceof UsuarioGestaoErro
          ? [...(e.impedimentos?.times ?? []), ...(e.impedimentos?.campeonatos ?? [])]
          : [];
      setModalError(
        `${e instanceof Error ? e.message : "Erro ao alterar perfil."}${links.length ? ` Vínculos: ${links.join(", ")}.` : ""}`,
      );
    }
  };
  const confirm = async () => {
    if (!token || !action) return;
    setBusy(true);
    try {
      await alterarEstadoUsuario(token, action.usuario.id, action.acao);
      setAction(undefined);
      setRefresh((v) => v + 1);
      toast.success("Situação atualizada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar a conta.");
    } finally {
      setBusy(false);
    }
  };
  if (!isHydrated)
    return (
      <AppLayout>
        <p role="status">Verificando permissões…</p>
      </AppLayout>
    );
  if (!admin || !user || !token) return null;
  return (
    <AppLayout>
      <div className={styles.layout}>
        <SettingsSidebar activeItem="manage-users" />
        <section className={styles.content}>
          <header className={styles.heading}>
            <h1>Gerenciar usuários</h1>
            <p>Gerencie os perfis e o acesso às contas da plataforma.</p>
          </header>
          <div className={styles.panel}>
            <div className={styles.filters}>
              <label className={styles.field}>
                Buscar nome ou e-mail
                <input
                  type="search"
                  placeholder="Nome ou e-mail do usuário"
                  value={busca}
                  maxLength={200}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                  className={styles.control}
                />
              </label>
              <label className={styles.field}>
                Perfil
                <select
                  value={cargo}
                  onChange={(e) => {
                    setCargo(e.target.value);
                    setPage(1);
                  }}
                  className={styles.control}
                >
                  <option value="">Todos os perfis</option>
                  {cargosUsuario.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                Situação
                <select
                  value={situacao}
                  onChange={(e) => {
                    setSituacao(e.target.value);
                    setPage(1);
                  }}
                  className={styles.control}
                >
                  <option value="">Todas as situações</option>
                  {Object.entries(situacoesUsuario).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {loading ? (
              <p role="status" className={styles.feedback}>
                Carregando usuários…
              </p>
            ) : error ? (
              <div role="alert" className={styles.feedback}>
                <p>{error}</p>
                <Button onClick={() => setRefresh((v) => v + 1)}>Tentar novamente</Button>
              </div>
            ) : (
              <>
                <UsuarioList
                  usuarios={result?.items ?? []}
                  currentId={user.id}
                  busy={busy}
                  onAcao={(usuario, acao) => setAction({ usuario, acao })}
                  onCargo={(u) => {
                    setModalError("");
                    setEditing(u);
                  }}
                />
                <nav aria-label="Paginação de usuários" className={styles.pagination}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span>
                    Página {page} de {Math.max(1, Math.ceil((result?.total ?? 0) / 20))} ·{" "}
                    {result?.total ?? 0} usuários
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page * 20 >= (result?.total ?? 0)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </nav>
              </>
            )}
          </div>
        </section>
      </div>
      <ConfirmModal
        isOpen={!!action}
        onClose={() => !busy && setAction(undefined)}
        onConfirm={confirm}
        loading={busy}
        danger={action?.acao === "excluir" || action?.acao === "bloquear"}
        title={`${action?.acao === "restaurar" ? "Restaurar conta" : action?.acao === "desbloquear" ? "Desbloquear conta" : action?.acao === "bloquear" ? "Bloquear conta" : "Excluir conta"} de ${action?.usuario.nome ?? ""}?`}
        description={
          action?.acao === "restaurar" || action?.acao === "desbloquear"
            ? "Esta ação reativa o acesso à mesma conta, preservando identidade e histórico. O usuário precisará entrar novamente."
            : "O acesso será encerrado. A identidade e o histórico serão preservados. Somente um administrador poderá reativar a conta."
        }
      />
      {editing && (
        <UsuarioCargoModal
          key={editing.id}
          usuario={editing}
          error={modalError}
          onClose={() => setEditing(undefined)}
          onSave={saveCargo}
        />
      )}
    </AppLayout>
  );
}
