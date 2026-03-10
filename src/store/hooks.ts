/**
 * @file hooks.ts
 * @description Hooks tipados para acesso ao Redux na aplicacao.
 *
 * Deixei isso separado para evitar repetir RootState/AppDispatch em todo componente.
 * No comeco eu fazia sem tipar e perdia tempo com erro besta de payload.
 *
 * @author Kivo Sports - TCC
 */

// - React Redux
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

// - Tipos da store
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// MELHORIA: criar hooks por dominio (ex: useAuthState) quando crescer mais
