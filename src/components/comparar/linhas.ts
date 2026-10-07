import { SUBCATEGORIA, type PassoVisual, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { ESTRATEGIA_CURTA, GRUPO_SINGULAR, notacaoTexto, numeroDePassos } from "../rotulos";
import type { ColunaComparador, DivergenciaDTO, ValorSimNao } from "../tipos";

/**
 * Linhas da tabela de comparação (DESIGN §4.6). Etapas/passos são derivados da
 * taxonomia (ARQUITETURA §3.2), não do JSON do produto.
 */

export type Celula =
  | { tipo: "texto"; texto: string }
  /** [R2] "2 · Ác + (P·Ad)"; universais: um item por estratégia indicada. */
  | { tipo: "passos"; itens: { estrategia?: string; n: number; subcategoria: SubcategoriaId }[] }
  | { tipo: "simnao"; valor: ValorSimNao }
  | { tipo: "preco"; centavos?: number; produtoId: string };

export const GRUPOS_LINHA = ["Classificação", "Etapas", "Composição", "Uso", "Produto"] as const;

export interface Linha {
  atributo: string;
  rotulo: string;
  grupo: (typeof GRUPOS_LINHA)[number];
  celulas: Celula[];
  /** Divergências por coluna, quando o campo tem. */
  divergencias: DivergenciaDTO[][];
}

const t = (texto: string): Celula => ({ tipo: "texto", texto });


/** Para universais, junta por estratégia: "Total: 2 passos · Autocond.: 1 passo". */
function porEstrategia(subs: SubcategoriaId[], f: (id: SubcategoriaId) => string): string {
  if (subs.length === 1) return f(subs[0]);
  const valores = subs.map(f);
  if (new Set(valores).size === 1) return valores[0];
  return subs.map((id, i) => `${ESTRATEGIA_CURTA[id] ?? SUBCATEGORIA[id].rotulo}: ${valores[i]}`).join(" · ");
}

const CONDICIONAMENTO = (id: SubcategoriaId) =>
  ({ sim: "Ácido aplicado separadamente", nao: "Sem ácido separado", opcional: "Opcional" })[SUBCATEGORIA[id].condicionamentoAcidoSeparado];

function primerDe(seq: PassoVisual[]): string {
  if (seq.includes("primer")) return "Frasco separado";
  if (seq.includes("primer+adesivo")) return "Junto com o adesivo";
  if (seq.includes("primer-autocondicionante")) return "Primer autocondicionante";
  if (seq.includes("tudo-em-um")) return "Junto (frasco único)";
  if (seq.includes("adesivo-universal")) return "Incorporado ao adesivo universal";
  return "—";
}

function adesivoDe(seq: PassoVisual[]): string {
  if (seq.includes("adesivo")) return "Frasco separado";
  if (seq.includes("primer+adesivo")) return "Junto com o primer";
  if (seq.includes("tudo-em-um")) return "Frasco único";
  if (seq.includes("adesivo-universal")) return "Adesivo universal";
  return "—";
}

export function montarLinhas(colunas: ColunaComparador[]): Linha[] {
  const div = (campo: string) => colunas.map((c) => c.divergencias.filter((d) => d.campo === campo));
  const semDiv = colunas.map(() => []);
  const subs = (c: ColunaComparador) => c.card.subcategorias;
  const seq = (id: SubcategoriaId) => SUBCATEGORIA[id].sequencia;

  return [
    { atributo: "classificacao", rotulo: "Classificação", grupo: "Classificação", celulas: colunas.map((c) => t(GRUPO_SINGULAR[c.card.grupo])), divergencias: div("classificacao") },
    {
      atributo: "estrategia",
      rotulo: "Estratégia",
      grupo: "Classificação",
      // Universais: as estratégias indicadas; demais: a frase da estratégia adesiva do produto.
      celulas: colunas.map((c) =>
        c.card.grupo === "universal"
          ? t(subs(c).map((id) => SUBCATEGORIA[id].rotulo).join(" · "))
          : c.card.estrategia
            ? t(c.card.estrategia)
            : { tipo: "simnao", valor: "nao-informado" },
      ),
      divergencias: semDiv,
    },
    {
      atributo: "passos",
      rotulo: "Número de passos",
      grupo: "Classificação",
      celulas: colunas.map((c) => ({
        tipo: "passos",
        itens: subs(c).map((id) => ({
          estrategia: subs(c).length > 1 ? ESTRATEGIA_CURTA[id] : undefined,
          n: numeroDePassos(id),
          subcategoria: id,
        })),
      })),
      divergencias: semDiv,
    },
    { atributo: "condicionamento", rotulo: "Condicionamento", grupo: "Etapas", celulas: colunas.map((c) => t(porEstrategia(subs(c), CONDICIONAMENTO))), divergencias: semDiv },
    { atributo: "primer", rotulo: "Primer", grupo: "Etapas", celulas: colunas.map((c) => t(porEstrategia(subs(c), (id) => primerDe(seq(id))))), divergencias: semDiv },
    { atributo: "adesivo", rotulo: "Adesivo", grupo: "Etapas", celulas: colunas.map((c) => t(porEstrategia(subs(c), (id) => adesivoDe(seq(id))))), divergencias: semDiv },
    { atributo: "mdp", rotulo: "MDP", grupo: "Composição", celulas: colunas.map((c) => ({ tipo: "simnao", valor: c.mdp })), divergencias: div("composicao.mdp") },
    { atributo: "hema", rotulo: "HEMA", grupo: "Composição", celulas: colunas.map((c) => ({ tipo: "simnao", valor: c.hema })), divergencias: div("composicao.hema") },
    { atributo: "silano", rotulo: "Silano", grupo: "Composição", celulas: colunas.map((c) => ({ tipo: "simnao", valor: c.silano })), divergencias: div("composicao.silano") },
    {
      atributo: "solvente",
      rotulo: "Solvente",
      grupo: "Composição",
      celulas: colunas.map((c) => (c.solventes === "nao-informado" ? { tipo: "simnao", valor: "nao-informado" } : t(c.solventes.join(", ")))),
      divergencias: div("composicao.solventes"),
    },
    {
      atributo: "polimerizacao",
      rotulo: "Fotopolimerização",
      grupo: "Uso",
      celulas: colunas.map((c) => (c.polimerizacao === "nao-informado" ? { tipo: "simnao", valor: "nao-informado" } : t(c.polimerizacao))),
      divergencias: div("composicao.polimerizacao"),
    },
    { atributo: "volume", rotulo: "Volume", grupo: "Produto", celulas: colunas.map((c) => t(c.volume)), divergencias: semDiv },
    { atributo: "fabricante", rotulo: "Fabricante", grupo: "Produto", celulas: colunas.map((c) => t(c.card.fabricante)), divergencias: semDiv },
    {
      atributo: "menor-preco",
      rotulo: "Menor preço",
      grupo: "Produto",
      celulas: colunas.map((c) => ({ tipo: "preco", centavos: c.card.aPartirDeCentavos, produtoId: c.card.id })),
      divergencias: semDiv,
    },
  ];
}

const chave = (c: Celula) =>
  c.tipo === "texto"
    ? c.texto
    : c.tipo === "simnao"
      ? c.valor
      : c.tipo === "passos"
        ? c.itens.map((i) => `${i.estrategia}:${notacaoTexto(i.subcategoria)}`).join("|")
        : String(c.centavos);

/** true quando todas as colunas têm o mesmo valor (para "Destacar diferenças"). */
export function linhaIgual(l: Linha): boolean {
  return new Set(l.celulas.map(chave)).size <= 1;
}

/** Ids válidos, únicos, na ordem da URL (máx. 4). */
export function idsDaUrl(param: string | null, validos: ReadonlySet<string>, limite = 4) {
  const brutos = (param ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const unicos = [...new Set(brutos)];
  const ids = unicos.filter((id) => validos.has(id)).slice(0, limite);
  const invalidos = unicos.filter((id) => !validos.has(id));
  return { ids, invalidos, excedente: unicos.filter((id) => validos.has(id)).length > limite };
}
