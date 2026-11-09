"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";

export type Theme = "dark" | "light";
interface ThemeContextValue { theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void }
const Context = createContext<ThemeContextValue | null>(null);
const defaultTheme: Theme = "dark";
const keyFor = (userId?: string | null) => userId ? `kivo:theme:v1:user:${userId}` : "kivo:theme:v1:guest";

function readTheme(key: string): Theme {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" ? value : defaultTheme;
  } catch { return defaultTheme; }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAppSelector((state) => state.auth);
  const userId = isHydrated ? user?.id ?? null : null;
  const storageKey = keyFor(userId);
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    // Identidade mudou: restaurar preferência local correspondente antes de aplicá-la.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readTheme(storageKey));
    setActiveKey(storageKey);
  }, [isHydrated, storageKey]);

  useEffect(() => {
    if (!isHydrated || activeKey !== storageKey) return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [activeKey, isHydrated, storageKey, theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (!isHydrated) return;
    try { localStorage.setItem(storageKey, next); } catch { /* Tema atual permanece ativo durante a sessão. */ }
  }, [isHydrated, storageKey]);
  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [setTheme, theme]);
  const value = useMemo(() => ({ theme: activeKey === storageKey ? theme : defaultTheme, setTheme, toggleTheme }), [activeKey, storageKey, theme, setTheme, toggleTheme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(Context);
  if (!value) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return value;
}

export function useThemeOptional(): ThemeContextValue {
  const value = useContext(Context);
  return value ?? { theme: defaultTheme, setTheme: () => {}, toggleTheme: () => {} };
}
