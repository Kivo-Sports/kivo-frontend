import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearInactivityTimestamp,
  getMinutesUntilInactivityLogout,
  getTimeSinceLastAction,
  initInactivityTracking,
  isUserInactive,
  updateInactivityTimestamp,
} from "./inactivity";

const DUAS_HORAS_MS = 2 * 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("updateInactivityTimestamp / getTimeSinceLastAction", () => {
  it("retorna 0 quando nunca houve atividade registrada", () => {
    expect(getTimeSinceLastAction()).toBe(0);
  });

  it("calcula o tempo desde a ultima acao registrada", () => {
    updateInactivityTimestamp();

    vi.advanceTimersByTime(5000);

    expect(getTimeSinceLastAction()).toBe(5000);
  });
});

describe("isUserInactive", () => {
  it("false logo apos registrar atividade", () => {
    updateInactivityTimestamp();
    expect(isUserInactive()).toBe(false);
  });

  it("true apos passar 2 horas sem atividade", () => {
    updateInactivityTimestamp();
    vi.advanceTimersByTime(DUAS_HORAS_MS);
    expect(isUserInactive()).toBe(true);
  });

  it("false um instante antes de completar 2 horas", () => {
    updateInactivityTimestamp();
    vi.advanceTimersByTime(DUAS_HORAS_MS - 1000);
    expect(isUserInactive()).toBe(false);
  });
});

describe("getMinutesUntilInactivityLogout", () => {
  it("retorna 120 minutos quando a atividade acabou de ser registrada", () => {
    updateInactivityTimestamp();
    expect(getMinutesUntilInactivityLogout()).toBe(120);
  });

  it("decresce conforme o tempo passa", () => {
    updateInactivityTimestamp();
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(getMinutesUntilInactivityLogout()).toBe(60);
  });

  it("nunca fica negativo apos o timeout estourar", () => {
    updateInactivityTimestamp();
    vi.advanceTimersByTime(DUAS_HORAS_MS + 60 * 60 * 1000);
    expect(getMinutesUntilInactivityLogout()).toBe(0);
  });
});

describe("clearInactivityTimestamp", () => {
  it("remove o timestamp salvo", () => {
    updateInactivityTimestamp();
    clearInactivityTimestamp();
    expect(getTimeSinceLastAction()).toBe(0);
  });
});

describe("initInactivityTracking", () => {
  it("atualiza o timestamp imediatamente ao iniciar", () => {
    const cleanup = initInactivityTracking();
    expect(getTimeSinceLastAction()).toBe(0);
    cleanup();
  });

  it("atualiza o timestamp quando o usuario interage (click)", () => {
    const cleanup = initInactivityTracking();
    vi.advanceTimersByTime(10000);
    expect(getTimeSinceLastAction()).toBe(10000);

    window.dispatchEvent(new Event("click"));

    expect(getTimeSinceLastAction()).toBe(0);
    cleanup();
  });

  it("para de escutar eventos apos a funcao de cleanup ser chamada", () => {
    const cleanup = initInactivityTracking();
    cleanup();

    vi.advanceTimersByTime(10000);
    window.dispatchEvent(new Event("click"));

    expect(getTimeSinceLastAction()).toBe(10000);
  });
});
