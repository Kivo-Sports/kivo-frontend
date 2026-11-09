"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";

export type TextScale = 1 | 1.15 | 1.3;
interface TextScaleContextValue { scale: TextScale; setScale: (scale: TextScale) => void }
const Context = createContext<TextScaleContextValue | null>(null);
const defaultScale: TextScale = 1;
const keyFor = (userId?: string | null) => userId ? `kivo:text-scale:v1:user:${userId}` : "kivo:text-scale:v1:guest";

function readScale(key: string): TextScale {
  try {
    const value = localStorage.getItem(key);
    return value === "1.15" ? 1.15 : value === "1.3" ? 1.3 : defaultScale;
  } catch { return defaultScale; }
}

export function TextScaleProvider({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAppSelector((state) => state.auth);
  const userId = isHydrated ? user?.id ?? null : null;
  const storageKey = keyFor(userId);
  const [scale, setScaleState] = useState<TextScale>(defaultScale);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    // Identidade mudou: restaurar preferência local correspondente antes de aplicá-la.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScaleState(readScale(storageKey));
    setActiveKey(storageKey);
  }, [isHydrated, storageKey]);

  useEffect(() => {
    if (!isHydrated || activeKey !== storageKey) return;
    document.documentElement.style.setProperty("--text-scale", String(scale));
  }, [activeKey, isHydrated, storageKey, scale]);

  const setScale = useCallback((next: TextScale) => {
    setScaleState(next);
    if (!isHydrated) return;
    try { localStorage.setItem(storageKey, String(next)); } catch { /* Escala atual permanece ativa durante a sessão. */ }
  }, [isHydrated, storageKey]);
  const value = useMemo(() => ({ scale: activeKey === storageKey ? scale : defaultScale, setScale }), [activeKey, storageKey, scale, setScale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTextScale(): TextScaleContextValue {
  const value = useContext(Context);
  if (!value) throw new Error("useTextScale deve ser usado dentro de TextScaleProvider");
  return value;
}
