"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { SUBCATEGORIA, type SubcategoriaId } from "@/lib/esquema/taxonomia";

/**
 * Estratégia selecionada na página do produto (DESIGN §4.5). Compartilhada pelo
 * seletor (topo) e pelo Modo de Uso (abaixo). URL: ?estrategia={slug}, via
 * replaceState (sem novo histórico). Lido após montar para a página continuar
 * 100% estática (o HTML sai com a primeira estratégia indicada).
 */

interface Ctx {
  atual: SubcategoriaId;
  indicadas: readonly SubcategoriaId[];
  escolher: (id: SubcategoriaId) => void;
}

const Contexto = createContext<Ctx | null>(null);

export function estrategiaDaUrl(search: string, indicadas: readonly SubcategoriaId[]): SubcategoriaId | undefined {
  const slug = new URLSearchParams(search).get("estrategia");
  return indicadas.find((id) => SUBCATEGORIA[id].slug === slug);
}

export function EstrategiaProvider({ indicadas, children }: { indicadas: SubcategoriaId[]; children: ReactNode }) {
  const [atual, setAtual] = useState<SubcategoriaId>(indicadas[0]);

  useEffect(() => {
    const daUrl = estrategiaDaUrl(window.location.search, indicadas);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com a URL após hidratar (SSG)
    if (daUrl) setAtual(daUrl);
  }, [indicadas]);

  const escolher = useCallback((id: SubcategoriaId) => {
    setAtual(id);
    const url = new URL(window.location.href);
    url.searchParams.set("estrategia", SUBCATEGORIA[id].slug);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return <Contexto.Provider value={{ atual, indicadas, escolher }}>{children}</Contexto.Provider>;
}

/** null fora de um produto universal. */
export function useEstrategia() {
  return useContext(Contexto);
}
