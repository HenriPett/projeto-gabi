"use client";

import { useSyncExternalStore } from "react";

/**
 * Seleção de produtos para comparar (DESIGN §3.9): máx. 4, persistida em
 * localStorage e sincronizada entre abas. Ids únicos — o universal entra 1×
 * mesmo vindo de páginas de estratégias diferentes (U-06).
 */

export const LIMITE_COMPARACAO = 4;
const CHAVE = "sa:comparar";
const EVENTO = "sa:comparar";
const VAZIO: readonly string[] = [];

let cache: { bruto: string | null; ids: readonly string[] } = { bruto: null, ids: VAZIO };

function ler(): readonly string[] {
  let bruto: string | null = null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    return VAZIO;
  }
  if (bruto === cache.bruto) return cache.ids;
  let ids: readonly string[] = VAZIO;
  try {
    const v: unknown = JSON.parse(bruto ?? "[]");
    if (Array.isArray(v)) ids = [...new Set(v.filter((x): x is string => typeof x === "string"))].slice(0, LIMITE_COMPARACAO);
  } catch {
    /* valor corrompido → vazio */
  }
  cache = { bruto, ids };
  return ids;
}

function gravar(ids: readonly string[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ids));
  } catch {
    /* modo privado/sem storage: segue só em memória nesta página */
    cache = { bruto: JSON.stringify(ids), ids };
  }
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useSelecaoComparar() {
  return useSyncExternalStore(assinar, ler, () => VAZIO);
}

/** Retorna false se o limite impediu a inclusão. */
export function alternarComparar(id: string): boolean {
  const ids = ler();
  if (ids.includes(id)) {
    gravar(ids.filter((x) => x !== id));
    return true;
  }
  if (ids.length >= LIMITE_COMPARACAO) {
    window.dispatchEvent(new CustomEvent("sa:aviso", { detail: `Limite de ${LIMITE_COMPARACAO} produtos na comparação` }));
    return false;
  }
  gravar([...ids, id]);
  return true;
}

export function removerDaComparacao(id: string) {
  gravar(ler().filter((x) => x !== id));
}

export function definirComparacao(ids: readonly string[]) {
  gravar([...new Set(ids)].slice(0, LIMITE_COMPARACAO));
}
