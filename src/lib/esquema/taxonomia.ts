/**
 * Taxonomia fixa dos sistemas adesivos (BRIEFING §1, §7, §9, §10, §19).
 * É estrutura de produto, não dado pesquisado: muda só por decisão do time.
 * Textos explicativos de cada categoria ficam em data/ (com fonte), não aqui.
 */

export const GRUPOS = ["convencional", "autocondicionante", "universal"] as const;
export type GrupoId = (typeof GRUPOS)[number];

export const SUBCATEGORIAS = [
  "convencional-2-passos",
  "convencional-3-passos",
  "autocondicionante-1-passo",
  "autocondicionante-2-passos",
  "universal-condicionamento-seletivo",
  "universal-condicionamento-total",
  "universal-autocondicionante",
] as const;
export type SubcategoriaId = (typeof SUBCATEGORIAS)[number];

/** Passo visual do diagrama "Como identificar?" (§3, §19). */
export type PassoVisual = "acido" | "primer" | "adesivo" | "primer+adesivo" | "primer-autocondicionante" | "adesivo-universal" | "tudo-em-um";

export interface Subcategoria {
  id: SubcategoriaId;
  grupo: GrupoId;
  /** Segmento de URL: /sistemas-adesivos/{grupoSlug}/{slug} */
  slug: string;
  rotulo: string;
  sequencia: PassoVisual[];
  /** Características derivadas da classificação, usadas na tabela COMPARAR (§11). */
  condicionamentoAcidoSeparado: "sim" | "nao" | "opcional";
  /**
   * Onde o ácido fosfórico separado é aplicado; null = não há ácido separado.
   * Diferencia universal seletivo (só esmalte) de total (esmalte e dentina),
   * que têm a mesma `sequencia` (DESIGN §3.7, pictograma de substrato).
   */
  substratoAcido: "esmalte" | "esmalte-e-dentina" | null;
}

export interface Grupo {
  id: GrupoId;
  slug: string;
  rotulo: string;
  subcategorias: SubcategoriaId[];
}

export const GRUPO: Record<GrupoId, Grupo> = {
  convencional: {
    id: "convencional",
    slug: "convencionais",
    rotulo: "Convencionais",
    subcategorias: ["convencional-2-passos", "convencional-3-passos"],
  },
  autocondicionante: {
    id: "autocondicionante",
    slug: "autocondicionantes",
    rotulo: "Autocondicionantes",
    subcategorias: ["autocondicionante-1-passo", "autocondicionante-2-passos"],
  },
  universal: {
    id: "universal",
    slug: "universais",
    rotulo: "Universais",
    subcategorias: [
      "universal-condicionamento-seletivo",
      "universal-condicionamento-total",
      "universal-autocondicionante",
    ],
  },
};

export const SUBCATEGORIA: Record<SubcategoriaId, Subcategoria> = {
  "convencional-2-passos": {
    id: "convencional-2-passos",
    grupo: "convencional",
    slug: "2-passos",
    rotulo: "2 passos",
    sequencia: ["acido", "primer+adesivo"],
    condicionamentoAcidoSeparado: "sim",
    substratoAcido: "esmalte-e-dentina",
  },
  "convencional-3-passos": {
    id: "convencional-3-passos",
    grupo: "convencional",
    slug: "3-passos",
    rotulo: "3 passos",
    sequencia: ["acido", "primer", "adesivo"],
    condicionamentoAcidoSeparado: "sim",
    substratoAcido: "esmalte-e-dentina",
  },
  "autocondicionante-1-passo": {
    id: "autocondicionante-1-passo",
    grupo: "autocondicionante",
    slug: "1-passo",
    rotulo: "1 passo",
    sequencia: ["tudo-em-um"],
    condicionamentoAcidoSeparado: "nao",
    substratoAcido: null,
  },
  "autocondicionante-2-passos": {
    id: "autocondicionante-2-passos",
    grupo: "autocondicionante",
    slug: "2-passos",
    rotulo: "2 passos",
    sequencia: ["primer-autocondicionante", "adesivo"],
    condicionamentoAcidoSeparado: "nao",
    substratoAcido: null,
  },
  "universal-condicionamento-seletivo": {
    id: "universal-condicionamento-seletivo",
    grupo: "universal",
    slug: "condicionamento-seletivo",
    rotulo: "Condicionamento seletivo",
    sequencia: ["acido", "adesivo-universal"],
    condicionamentoAcidoSeparado: "sim",
    substratoAcido: "esmalte",
  },
  "universal-condicionamento-total": {
    id: "universal-condicionamento-total",
    grupo: "universal",
    slug: "condicionamento-total",
    rotulo: "Condicionamento total",
    sequencia: ["acido", "adesivo-universal"],
    condicionamentoAcidoSeparado: "sim",
    substratoAcido: "esmalte-e-dentina",
  },
  "universal-autocondicionante": {
    id: "universal-autocondicionante",
    grupo: "universal",
    slug: "autocondicionante",
    rotulo: "Autocondicionante",
    sequencia: ["adesivo-universal"],
    condicionamentoAcidoSeparado: "nao",
    substratoAcido: null,
  },
};

export function subcategoriaPorSlug(grupoSlug: string, subSlug: string): Subcategoria | undefined {
  const grupo = Object.values(GRUPO).find((g) => g.slug === grupoSlug);
  if (!grupo) return undefined;
  return grupo.subcategorias.map((id) => SUBCATEGORIA[id]).find((s) => s.slug === subSlug);
}
