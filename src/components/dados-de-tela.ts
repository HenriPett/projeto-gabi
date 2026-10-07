import "server-only";
import type { Oferta, Produto } from "@/lib/esquema";
import { itemDeBusca } from "@/lib/busca";
import { apresentacaoParaComparar, apresentacoesComOferta, compararPrecos } from "@/lib/precos";
import type {
  CardProduto,
  ColunaComparador,
  ComparacaoApresentacao,
  DivergenciaDTO,
  FonteDTO,
  ItemIndice,
} from "./tipos";

/**
 * Monta as props serializáveis das telas a partir do catálogo (só servidor).
 * Nenhuma regra de preço aqui: tudo vem de src/lib/precos.ts.
 */

type Apresentacao = Produto["apresentacoes"][number];

const TIPO_APRESENTACAO: Record<Apresentacao["tipo"], string> = {
  frasco: "Frasco",
  kit: "Kit",
  refil: "Refil",
  unidose: "Unidose",
  seringa: "Seringa",
  outro: "Outro",
};

export const rotuloTipoApresentacao = (a: Apresentacao) => TIPO_APRESENTACAO[a.tipo];

// TODO(Molar): mover para src/lib/formato.ts (formatarVolume) se aprovado.
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** "5 mL", "3 g", "50 × 0,1 mL"; kit → descrição do fabricante. */
export function volumeDe(a: Apresentacao): string {
  if (a.tipo === "kit") return a.descricao;
  const unidade = a.volumeMl !== undefined ? `${decimal.format(a.volumeMl)} mL` : a.massaG !== undefined ? `${decimal.format(a.massaG)} g` : a.descricao;
  return a.quantidade > 1 ? `${a.quantidade} × ${unidade}` : unidade;
}

export function apresentacaoPrincipal(p: Produto): Apresentacao {
  return p.apresentacoes.find((a) => a.id === p.apresentacaoPrincipal) ?? p.apresentacoes[0];
}

export function fontesDe(p: Produto, ids: readonly string[] = []): FonteDTO[] {
  return ids.flatMap((id) => {
    const f = p.fontes.find((x) => x.id === id);
    return f ? [{ id: f.id, tipo: f.tipo, titulo: f.titulo, url: f.url, acessadoEm: f.acessadoEm, versao: f.versao }] : [];
  });
}

export function divergenciasDe(p: Produto, prefixo?: string): DivergenciaDTO[] {
  return p.divergencias
    .filter((d) => !prefixo || d.campo === prefixo || d.campo.startsWith(`${prefixo}.`))
    .map((d) => ({
      campo: d.campo,
      descricao: d.descricao,
      versoes: d.versoes.map((v) => ({ valor: v.valor, fontes: fontesDe(p, v.fontes) })),
    }));
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Componentes-chave para chips (MDP, HEMA, silano, solventes); senão, os confirmados. */
export function componentesChave(p: Produto): string[] {
  const c = p.composicao;
  const chave = [
    c.mdp.valor === "sim" ? "MDP" : "",
    c.hema.valor === "sim" ? "HEMA" : "",
    c.silano.valor === "sim" ? "Silano" : "",
    ...(c.solventes.valor === "nao-informado" ? [] : c.solventes.valor.map(capitalizar)),
  ].filter(Boolean);
  return chave.length ? chave : c.componentes.map((x) => x.nome);
}

/** Menor preço da apresentação que a página do produto compara por padrão. */
function aPartirDe(p: Produto, ofertas: readonly Oferta[]): number | undefined {
  const id = apresentacaoParaComparar(ofertas, p.apresentacaoPrincipal);
  if (!id) return undefined;
  return compararPrecos(ofertas, id).linhas.find((l) => l.centavos !== undefined)?.centavos;
}

export function cardDe(p: Produto, ofertas: readonly Oferta[] = []): CardProduto {
  const a = apresentacaoPrincipal(p);
  const img = p.imagens[0];
  return {
    id: p.id,
    nome: p.nomeComercial,
    fabricante: p.fabricante.nome,
    grupo: p.classificacao.grupo,
    subcategorias: p.classificacao.subcategorias.map((s) => s.id),
    apresentacao: a.tipo === "kit" ? a.descricao : `${rotuloTipoApresentacao(a)} · ${volumeDe(a)}`,
    estrategia: p.estrategiaAdesiva?.texto,
    componentes: componentesChave(p),
    mdp: p.composicao.mdp.valor === "sim",
    aPartirDeCentavos: aPartirDe(p, ofertas),
    imagem: img ? { arquivo: img.arquivo, alt: img.alt } : undefined,
    rascunho: p.revisao.status === "rascunho",
  };
}

export function indiceDeBusca(produtos: readonly Produto[]): ItemIndice[] {
  return produtos.map((p) => {
    const img = p.imagens[0];
    return {
      ...itemDeBusca(p),
      grupo: p.classificacao.grupo,
      subcategorias: p.classificacao.subcategorias.map((s) => s.id),
      componentes: [
        ...p.composicao.componentes.map((c) => c.nome),
        ...(p.composicao.mdp.valor === "sim" ? ["MDP"] : []),
        ...(p.composicao.hema.valor === "sim" ? ["HEMA"] : []),
      ],
      mdp: p.composicao.mdp.valor === "sim",
      hema: p.composicao.hema.valor === "sim",
      imagem: img ? { arquivo: img.arquivo, alt: img.alt } : undefined,
    };
  });
}

const POLIMERIZACAO: Record<string, string> = {
  fotopolimerizavel: "Fotopolimerizável",
  dual: "Dual",
  autopolimerizavel: "Autopolimerizável",
};

export function colunaComparador(p: Produto, ofertas: readonly Oferta[] = []): ColunaComparador {
  const c = p.composicao;
  return {
    card: cardDe(p, ofertas),
    mdp: c.mdp.valor,
    hema: c.hema.valor,
    silano: c.silano.valor,
    solventes: c.solventes.valor === "nao-informado" ? "nao-informado" : c.solventes.valor.map(capitalizar),
    polimerizacao: c.polimerizacao.valor === "nao-informado" ? "nao-informado" : POLIMERIZACAO[c.polimerizacao.valor],
    volume: volumeDe(apresentacaoPrincipal(p)),
    divergencias: divergenciasDe(p),
  };
}

/**
 * Comparações de preço por apresentação, a padrão primeiro
 * (apresentacaoParaComparar), depois as demais com oferta.
 */
export function comparacoesDePreco(p: Produto, ofertas: readonly Oferta[] = []): ComparacaoApresentacao[] {
  const padrao = apresentacaoParaComparar(ofertas, p.apresentacaoPrincipal);
  if (!padrao) return [];
  const ids = [padrao, ...apresentacoesComOferta(ofertas).filter((id) => id !== padrao)];
  return ids.map((id) => {
    const a = p.apresentacoes.find((x) => x.id === id)!;
    return {
      apresentacaoId: id,
      identificacao: [p.fabricante.nome, p.nomeComercial, a.descricao, `${a.quantidade} un.`].join(" · "),
      descricao: a.descricao,
      codigo: a.codigoFabricante,
      comparacao: compararPrecos(ofertas, id),
    };
  });
}
