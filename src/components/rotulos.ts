import {
  GRUPO,
  SUBCATEGORIA,
  type GrupoId,
  type PassoVisual,
  type SubcategoriaId,
} from "@/lib/esquema/taxonomia";

/**
 * Textos de UI derivados da taxonomia (sem dado pesquisado). Importa só
 * taxonomia.ts para não levar zod ao bundle do cliente.
 */

export const GRUPO_SINGULAR: Record<GrupoId, string> = {
  convencional: "Convencional",
  autocondicionante: "Autocondicionante",
  universal: "Universal",
};

/** Rótulos curtos das estratégias universais (cabem em 375px). */
export const ESTRATEGIA_CURTA: Partial<Record<SubcategoriaId, string>> = {
  "universal-condicionamento-seletivo": "Seletivo",
  "universal-condicionamento-total": "Total",
  "universal-autocondicionante": "Autocond.",
};

export const ESTRATEGIAS_UNIVERSAIS = GRUPO.universal.subcategorias;

export function urlSubcategoria(id: SubcategoriaId): string {
  const s = SUBCATEGORIA[id];
  return `/sistemas-adesivos/${GRUPO[s.grupo].slug}/${s.slug}`;
}

/** "Convencional — 2 passos" */
export function rotuloClassificacao(id: SubcategoriaId): string {
  const s = SUBCATEGORIA[id];
  return `${GRUPO_SINGULAR[s.grupo]} — ${s.rotulo}`;
}

export interface EtapaVisual {
  tipo: "acid" | "primer" | "adh" | "pa" | "apa";
  glifo: string;
  rotulo: string;
  sub?: string;
  /** Frase para o figcaption. */
  leitura: string;
}

const ETAPA: Record<PassoVisual, EtapaVisual> = {
  acido: { tipo: "acid", glifo: "H⁺", rotulo: "Ácido", leitura: "ácido, em frasco separado" },
  primer: { tipo: "primer", glifo: "P", rotulo: "Primer", leitura: "primer" },
  adesivo: { tipo: "adh", glifo: "A", rotulo: "Adesivo", leitura: "adesivo" },
  "primer+adesivo": {
    tipo: "pa",
    glifo: "P+A",
    rotulo: "Primer + Adesivo",
    sub: "mesmo frasco",
    leitura: "primer e adesivo no mesmo frasco",
  },
  "primer-autocondicionante": {
    tipo: "primer",
    glifo: "P",
    rotulo: "Primer autocondicionante",
    leitura: "primer autocondicionante",
  },
  "adesivo-universal": { tipo: "adh", glifo: "A", rotulo: "Adesivo universal", leitura: "adesivo universal" },
  "tudo-em-um": {
    tipo: "apa",
    glifo: "H⁺PA",
    rotulo: "Ácido + Primer + Adesivo",
    sub: "um único frasco",
    leitura: "ácido, primer e adesivo em um único frasco",
  },
};

/** Nota de substrato do ácido nos caminhos universais (§3.7, mapa de diagramas). */
const NOTA_ACIDO: Partial<Record<SubcategoriaId, string>> = {
  "universal-condicionamento-seletivo": "só em esmalte",
  "universal-condicionamento-total": "esmalte + dentina",
};

export function etapasVisuais(id: SubcategoriaId): EtapaVisual[] {
  return SUBCATEGORIA[id].sequencia.map((p) => {
    const e = ETAPA[p];
    const nota = p === "acido" ? NOTA_ACIDO[id] : undefined;
    return nota ? { ...e, sub: nota, leitura: `ácido (${nota})` } : e;
  });
}

/** Leitura completa do diagrama para leitores de tela. */
export function leituraDiagrama(id: SubcategoriaId): string {
  const etapas = etapasVisuais(id);
  const passos = etapas.map((e, i) => `${i + 1}. ${e.leitura}`).join("; ");
  const extra = id === "universal-autocondicionante" ? " (sem ácido separado)" : "";
  return `${rotuloClassificacao(id)}: ${passos}${extra}.`;
}
