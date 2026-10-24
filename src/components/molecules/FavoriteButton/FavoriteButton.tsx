/**
 * @file FavoriteButton.tsx
 * @description Botão (apenas ícone de coração) para favoritar/desfavoritar time ou campeonato.
 * Aparece somente para usuários TORCEDORES autenticados.
 */

"use client";

import { Heart } from "lucide-react";
import { useToast } from "@/components/atoms/Toast";
import { useAppSelector } from "@/store/hooks";
import { normalizeCargo } from "@/lib/auth.utils";
import {
  useListarFavoritosQuery,
  useFavoritarMutation,
  useDesfavoritarMutation,
} from "@/store/api/favoritoApi";
import { TIPO_FAVORITO, type TipoFavorito } from "@/types/favorito";

interface FavoriteButtonProps {
  tipo: TipoFavorito;
  itemId: string;
  nome?: string;
}

export function FavoriteButton({ tipo, itemId, nome }: FavoriteButtonProps) {
  const { success, error } = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const habilitado = isAuthenticated && normalizeCargo(user?.cargo) === "torcedor";

  const { data: favoritos } = useListarFavoritosQuery(undefined, { skip: !habilitado });
  const [favoritar, { isLoading: adicionando }] = useFavoritarMutation();
  const [desfavoritar, { isLoading: removendo }] = useDesfavoritarMutation();

  if (!habilitado) return null;

  const favorito =
    tipo === "Time"
      ? (favoritos?.times ?? []).some((t) => t.id === itemId)
      : (favoritos?.campeonatos ?? []).some((c) => c.id === itemId);

  const carregando = adicionando || removendo;

  const handleClick = async () => {
    const payload = { tipo: TIPO_FAVORITO[tipo], itemId };
    try {
      if (favorito) {
        await desfavoritar(payload).unwrap();
        success(`${nome ?? "Item"} removido dos favoritos.`);
      } else {
        await favoritar(payload).unwrap();
        success(`${nome ?? "Item"} adicionado aos favoritos.`);
      }
    } catch {
      error("Não foi possível atualizar os favoritos.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={carregando}
      aria-pressed={favorito}
      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={favorito ? "Remover dos favoritos" : "Favoritar"}
      style={{
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "var(--radius-full)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: carregando ? "wait" : "pointer",
        border: `1px solid ${favorito ? "rgba(0,230,118,0.45)" : "rgba(255,255,255,0.16)"}`,
        background: favorito ? "rgba(0,230,118,0.14)" : "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        transition: "all 0.15s",
        opacity: carregando ? 0.7 : 1,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = favorito ? "rgba(0,230,118,0.45)" : "rgba(255,255,255,0.16)";
      }}
    >
      <Heart
        size={18}
        color={favorito ? "var(--color-brand-primary)" : "white"}
        fill={favorito ? "var(--color-brand-primary)" : "none"}
      />
    </button>
  );
}
