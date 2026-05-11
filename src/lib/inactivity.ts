/**
 * @file inactivity.ts
 * @description Utilitários para gerenciar timeout por inatividade (2 horas)
 *
 * Monitora a atividade do usuário (cliques, digitação, scroll, etc)
 * Reseta o timer a cada ação. Se ficar 2 horas inativo, logout automático.
 *
 * @author Kivo Sports - TCC
 */

const INACTIVITY_TIMEOUT_HOURS = 2;
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_HOURS * 60 * 60 * 1000; // 2 horas em ms
const INACTIVITY_TIMESTAMP_KEY = 'inactivity_last_action';

/**
 * Atualiza timestamp da última ação do usuário
 */
export function updateInactivityTimestamp(): void {
  if (typeof window !== 'undefined') {
    const now = Date.now();
    localStorage.setItem(INACTIVITY_TIMESTAMP_KEY, now.toString());
  }
}

/**
 * Obtém timestamp da última ação
 */
function getLastActionTimestamp(): number | null {
  if (typeof window !== 'undefined') {
    const timestamp = localStorage.getItem(INACTIVITY_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }
  return null;
}

/**
 * Calcula tempo desde a última ação (em milissegundos)
 */
export function getTimeSinceLastAction(): number {
  const lastAction = getLastActionTimestamp();
  if (!lastAction) return 0;
  return Date.now() - lastAction;
}

/**
 * Verifica se usuário está inativo (2 horas sem atividade)
 */
export function isUserInactive(): boolean {
  return getTimeSinceLastAction() >= INACTIVITY_TIMEOUT_MS;
}

/**
 * Calcula quantos minutos faltam até logout (contando para trás)
 */
export function getMinutesUntilInactivityLogout(): number {
  const timeSinceAction = getTimeSinceLastAction();
  const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - timeSinceAction);
  return Math.ceil(remainingMs / (60 * 1000));
}

/**
 * Limpa o timestamp de inatividade
 */
export function clearInactivityTimestamp(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INACTIVITY_TIMESTAMP_KEY);
  }
}

/**
 * Inicializa monitoramento de inatividade
 * Adiciona event listeners para detectar atividade do usuário
 */
export function initInactivityTracking(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  const handleActivity = () => {
    updateInactivityTimestamp();
  };

  // Adicionar listeners
  activityEvents.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });

  // Atualizar timestamp ao inicializar
  updateInactivityTimestamp();

  // Retornar função de cleanup
  return () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
  };
}
