import {
  GRUPO,
  SUBCATEGORIA,
  type GrupoId,
  type PassoVisual,
  type Subcategoria,
  type SubcategoriaId,
} from "@/lib/esquema/taxonomia";

/**
 * Textos de UI derivados da taxonomia (sem dado pesquisado). Importa só
 * taxonomia.ts para não levar zod ao bundle do cliente.
 */

/**
 * Toda ausência de dado verificado (atributo "nao-informado", campo opcional
 * vazio). Não atribuir ao fabricante: "nao-informado" = não achado em fonte
 * confiável (esquema). Exceções: "Protocolo oficial não localizado" (M-06) e
 * o "Não" confirmado (CS-02).
 */
export const NAO_VERIFICADA = "Informação ainda não verificada";
export const IMAGEM_AUSENTE = "Imagem ainda não disponível";

export const GRUPO_SINGULAR: Record<GrupoId, string> = {
  convencional: "Convencional",
  autocondicionante: "Autocondicionante",
  universal: "Universal",
};

/** [Fidelidade 4] Rótulo curto do selo no card: "CONV. · 2 PASSOS". */
export const GRUPO_CURTO: Record<GrupoId, string> = {
  convencional: "Conv.",
  autocondicionante: "Autocond.",
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
  acido: { tipo: "acid", glifo: "H⁺", rotulo: "Ácido", leitura: "ácido fosfórico, aplicado separadamente" },
  primer: { tipo: "primer", glifo: "P", rotulo: "Primer", leitura: "primer" },
  adesivo: { tipo: "adh", glifo: "A", rotulo: "Adesivo", leitura: "adesivo" },
  "primer+adesivo": {
    tipo: "pa",
    glifo: "P+A",
    rotulo: "Primer + Adesivo",
    sub: "mesmo frasco",
    leitura: "primer e adesivo do mesmo frasco, aplicados juntos",
  },
  "primer-autocondicionante": {
    tipo: "primer",
    glifo: "P",
    // Rótulo curto + sub: "AUTOCONDICIONANTE" em caixa-alta não cabe numa linha a 320–390px
    rotulo: "Primer",
    sub: "autocondicionante",
    leitura: "primer autocondicionante",
  },
  "adesivo-universal": { tipo: "adh", glifo: "A", rotulo: "Adesivo universal", leitura: "adesivo universal" },
  "tudo-em-um": {
    tipo: "apa",
    glifo: "H⁺PA",
    rotulo: "Ácido + Primer + Adesivo",
    sub: "uma única aplicação",
    leitura: "ácido, primer e adesivo em uma única aplicação",
  },
};

/** Nota do bloco Ácido nos caminhos universais (mapa de diagramas, §3.7). */
const NOTA_SUBSTRATO = { esmalte: "só em esmalte", "esmalte-e-dentina": "esmalte + dentina" } as const;

export function etapasVisuais(id: SubcategoriaId): EtapaVisual[] {
  return SUBCATEGORIA[id].sequencia.map((p) => {
    const e = ETAPA[p];
    const s = SUBCATEGORIA[id];
    const nota = p === "acido" && s.grupo === "universal" && s.substratoAcido ? NOTA_SUBSTRATO[s.substratoAcido] : undefined;
    return nota ? { ...e, sub: nota, leitura: `ácido fosfórico (${nota})` } : e;
  });
}

/** Leitura completa do diagrama para leitores de tela. */
export function leituraDiagrama(id: SubcategoriaId): string {
  const etapas = etapasVisuais(id);
  const passos = etapas.map((e, i) => `${i + 1}. ${e.leitura}`).join("; ");
  const extra = semAcidoSeparado(id) ? " (sem condicionamento ácido separado)" : "";
  return `${rotuloClassificacao(id)}: ${passos}${extra}.`;
}

/** [R2] Autocondicionantes e universal autocond.: abrem com o bloco fantasma riscado. */
export function semAcidoSeparado(id: SubcategoriaId): boolean {
  return SUBCATEGORIA[id].condicionamentoAcidoSeparado === "nao";
}

/** [R2] Substrato condicionado pelo ácido (taxonomia; <SubstrateGlyph>). */
export type SubstratoAcido = Subcategoria["substratoAcido"];

export const substratoAcido = (id: SubcategoriaId): SubstratoAcido => SUBCATEGORIA[id].substratoAcido;

/** [R2] Notação compacta: `+` separa passos; `( )` agrupa o que é aplicado junto. */
export interface TokenNotacao {
  t: string;
  sub?: string;
}

const N = (t: string, sub?: string): TokenNotacao => ({ t, sub });

export const NOTACAO: Record<SubcategoriaId, TokenNotacao[]> = {
  "convencional-3-passos": [N("Ác + P + Ad")],
  "convencional-2-passos": [N("Ác + (P·Ad)")],
  "autocondicionante-2-passos": [N("P", "ac"), N(" + Ad")],
  "autocondicionante-1-passo": [N("(Ác·P·Ad)")],
  "universal-condicionamento-seletivo": [N("Ác", "esm"), N(" + U")],
  "universal-condicionamento-total": [N("Ác + U")],
  "universal-autocondicionante": [N("U")],
};

/** Cor de etapa de cada sigla (Ác azul, P amarelo, Ad/U laranja — DESIGN §1.4). Glifos: H⁺ / P / A. */
export const CLASSE_SIGLA: Record<string, "n-acid" | "n-primer" | "n-adh"> = { "Ác": "n-acid", P: "n-primer", Ad: "n-adh", U: "n-adh" };
export const CLASSE_GLIFO: Record<string, "g-acid" | "g-primer" | "g-adh"> = { "H⁺": "g-acid", P: "g-primer", A: "g-adh" };

export const notacaoTexto = (id: SubcategoriaId) => NOTACAO[id].map((x) => x.t + (x.sub ? `_${x.sub}` : "")).join("");

export const LEGENDA_NOTACAO = [
  "Ác = ácido fosfórico",
  "P = primer",
  "Ad = adesivo",
  "U = adesivo universal",
  "esm = só esmalte",
  "ac = autocondicionante",
  "( ) = aplicados juntos",
];

export function numeroDePassos(id: SubcategoriaId): number {
  return SUBCATEGORIA[id].sequencia.length;
}
