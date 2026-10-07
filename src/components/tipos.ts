import type { ComparacaoPrecos } from "@/lib/precos";
import type { GrupoId, SubcategoriaId } from "@/lib/esquema/taxonomia";

/**
 * Props serializáveis que Server Components passam para Client Components
 * (ARQUITETURA §5). Montadas em ./dados-de-tela.ts, só no servidor.
 */

export interface ImagemDTO {
  arquivo: string;
  alt: string;
}

export interface FonteDTO {
  id: string;
  tipo: string;
  titulo: string;
  url: string;
  acessadoEm: string;
  versao?: string;
}

export interface CardProduto {
  id: string;
  nome: string;
  fabricante: string;
  grupo: GrupoId;
  subcategorias: SubcategoriaId[];
  /** "Frasco · 5 mL" */
  apresentacao: string;
  estrategia?: string;
  componentes: string[];
  mdp: boolean;
  preco: PrecoCard;
  imagem?: ImagemDTO;
  rascunho: boolean;
}

/**
 * Resumo de preço para card/comparador. Só há "a partir de" quando alguma
 * apresentação é comparável (≥ 2 lojas, via compararPrecos) — e sempre com a
 * apresentação (PLANO BUG-012).
 */
export type PrecoCard =
  | { tipo: "comparavel"; centavos: number; apresentacao: string; principal: boolean }
  | { tipo: "uma-loja"; centavos: number; apresentacao: string; principal: boolean }
  | { tipo: "apresentacoes-diferentes" }
  | { tipo: "sem-preco" };

/** Centavos usados só para ORDENAR a lista (sem preço vai para o fim). */
export const centavosParaOrdenar = (p: PrecoCard) => ("centavos" in p ? p.centavos : Infinity);

/** Entrada do índice de busca do header (ItemBusca + o que as sugestões exibem). */
export interface ItemIndice {
  id: string;
  nome: string;
  fabricante: string;
  texto: string;
  grupo: GrupoId;
  subcategorias: SubcategoriaId[];
  componentes: string[];
  mdp: boolean;
  hema: boolean;
  imagem?: ImagemDTO;
}

export type ValorSimNao = "sim" | "nao" | "nao-informado";

export interface DivergenciaDTO {
  campo: string;
  descricao: string;
  versoes: { valor: string; fontes: FonteDTO[] }[];
}

/** Coluna do comparador de sistemas (§4.6). */
export interface ColunaComparador {
  card: CardProduto;
  mdp: ValorSimNao;
  hema: ValorSimNao;
  silano: ValorSimNao;
  solventes: string[] | "nao-informado";
  polimerizacao: string | "nao-informado";
  volume: string;
  divergencias: DivergenciaDTO[];
}

/** Uma apresentação com ofertas, já comparada por compararPrecos. */
export interface ComparacaoApresentacao {
  apresentacaoId: string;
  /** "Fabricante · Nome · Frasco 5 mL · 1 un." */
  identificacao: string;
  descricao: string;
  codigo?: string;
  comparacao: ComparacaoPrecos;
}

export interface EtapaDTO {
  tipo: string;
  titulo: string;
  descricao: string;
  parametros: { tipo: string; texto: string }[];
}

export interface ProtocoloDTO {
  id: string;
  titulo: string;
  aplicaA: SubcategoriaId[];
  etapas: EtapaDTO[];
  observacoes: string[];
  fontes: FonteDTO[];
  divergencias: DivergenciaDTO[];
}
