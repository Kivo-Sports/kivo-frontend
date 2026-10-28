import { LockKeyhole, LockKeyholeOpen, RotateCcw, Trash2, UserRoundPen } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cargosUsuario, type UsuarioGestao } from "@/services/usuario.service";
import styles from "./UsuarioList.module.css";

export const situacoesUsuario = {
  ativo: "Ativo",
  inativo: "Inativa — origem legada",
  bloqueado: "Bloqueado",
  excluido: "Excluído",
};

const actionButtonStyle = {
  minWidth: 0,
  paddingInline: 0,
  width: "var(--user-action-size)",
  height: "var(--user-action-size)",
};

export function UsuarioList({
  usuarios,
  currentId,
  busy,
  onAcao,
  onCargo,
}: {
  usuarios: UsuarioGestao[];
  currentId: string;
  busy: boolean;
  onAcao: (usuario: UsuarioGestao, acao: string) => void;
  onCargo: (usuario: UsuarioGestao) => void;
}) {
  if (!usuarios.length)
    return (
      <p className={styles.empty} role="status">
        Nenhum usuário encontrado. Tente ajustar a busca ou os filtros.
      </p>
    );
  return (
    <div className={styles.scrollRegion} tabIndex={0} role="region" aria-label="Lista de usuários">
      <table className={styles.table}>
        <caption className={styles.caption}>Usuários e ações de gestão de perfil e acesso</caption>
        <thead>
          <tr>
            <th scope="col">Usuário</th>
            <th scope="col">Perfil</th>
            <th scope="col">Situação</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const propriaConta = u.id === currentId;
            return (
              <tr key={u.id}>
                <td className={styles.identity}>
                  <strong>{u.nome}</strong>
                  <span className={styles.email}>{u.email}</span>
                </td>
                <td className={styles.profile} data-label="Perfil">
                  {cargosUsuario.find((c) => c.nome === u.cargo)?.label ?? u.cargo}
                </td>
                <td className={styles.state} data-label="Situação">
                  <span className={`${styles.badge} ${styles[u.situacao]}`}>
                    {situacoesUsuario[u.situacao]}
                  </span>
                </td>
                <td className={styles.actionCell}>
                  {propriaConta ? (
                    <span className={styles.currentAccount}>Sua conta</span>
                  ) : (
                    <div className={styles.actions}>
                      <Button
                        size="sm"
                        style={actionButtonStyle}
                        variant="ghost"
                        className={styles.action}
                        disabled={busy}
                        aria-label={`Alterar perfil de ${u.nome}`}
                        title="Alterar perfil"
                        onClick={() => onCargo(u)}
                      >
                        <UserRoundPen size={17} aria-hidden="true" />
                      </Button>
                      {(u.situacao === "ativo" || u.situacao === "inativo") && (
                        <Button
                          size="sm"
                          style={actionButtonStyle}
                          variant="ghost"
                          className={styles.action}
                          disabled={busy}
                          aria-label={`Bloquear ${u.nome}`}
                          title="Bloquear acesso"
                          onClick={() => onAcao(u, "bloquear")}
                        >
                          <LockKeyhole size={17} aria-hidden="true" />
                        </Button>
                      )}
                      {u.situacao === "bloqueado" && (
                        <Button
                          size="sm"
                          style={actionButtonStyle}
                          variant="ghost"
                          className={styles.action}
                          disabled={busy}
                          aria-label={`Desbloquear ${u.nome}`}
                          title="Desbloquear acesso"
                          onClick={() => onAcao(u, "desbloquear")}
                        >
                          <LockKeyholeOpen size={17} aria-hidden="true" />
                        </Button>
                      )}
                      {u.situacao === "excluido" && (
                        <Button
                          size="sm"
                          style={actionButtonStyle}
                          variant="ghost"
                          className={styles.action}
                          disabled={busy}
                          aria-label={`Restaurar conta de ${u.nome}`}
                          title="Restaurar conta"
                          onClick={() => onAcao(u, "restaurar")}
                        >
                          <RotateCcw size={17} aria-hidden="true" />
                        </Button>
                      )}
                      {u.situacao !== "excluido" && (
                        <Button
                          size="sm"
                          style={actionButtonStyle}
                          variant="ghost"
                          className={`${styles.action} ${styles.delete}`}
                          disabled={busy}
                          aria-label={`Excluir ${u.nome}`}
                          title="Excluir conta"
                          onClick={() => onAcao(u, "excluir")}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
