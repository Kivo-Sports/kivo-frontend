"use client";

/**
 * @file useTheme.ts
 * @description Hook responsavel por controlar tema visual (dark/light).
 *
 * Aqui eu preferi usar data-theme no html em vez de Context API + classes no body,
 * porque com custom properties ficou mais simples trocar o tema inteiro sem mexer
 * nos componentes.
 *
 * @author Kivo Sports - TCC
 */

// - React
import { useLayoutEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Custom hook para gerenciar temas no Kivo Frontend
 *
 * Funcionalidades:
 * - Persiste a escolha do tema em localStorage (chave: kivo-theme)
 * - Aplica data-theme="..." no elemento <html>
 * - Inicia com tema "dark" como padrão
 * - Permite trocar e alternar temas dinamicamente
 *
 * @example
 * const { theme, setTheme, toggleTheme } = useTheme();
 *
 * // Trocar para um tema específico
 * setTheme("light");
 *
 * // Alternar entre dark e light
 * toggleTheme();
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    // lazy init: evita ler localStorage em toda renderizacao
    if (typeof window === "undefined") return "dark";
    const temaSalvoNoNavegador = localStorage.getItem("kivo-theme") as Theme | null;
    return temaSalvoNoNavegador ?? "dark";
  });

  // por enquanto so temos dark/light, mas a estrutura ja suporta novos temas
  const applyThemeOnDocument = useCallback((newTheme: Theme) => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("kivo-theme", newTheme);
  }, []);

  // alternativa descartada: useEffect comum. optei por useLayoutEffect para reduzir flicker visual
  useLayoutEffect(() => {
    applyThemeOnDocument(theme);
  }, [theme, applyThemeOnDocument]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeOnDocument(newTheme);
    },
    [applyThemeOnDocument],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // TODO: sincronizar tema entre abas usando storage event
  return { theme, setTheme, toggleTheme };
}
