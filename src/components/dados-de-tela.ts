import "server-only";
import type { Oferta, Produto } from "@/lib/esquema";
import { itemDeBusca } from "@/lib/busca";
import { formatarVolume } from "@/lib/formato";
import { apresentacaoParaComparar, apresentacoesComOferta, compararPrecos } from "@/lib/precos";
import type {
  CardProduto,
  ColunaComparador,
  ComparacaoApresentacao,
  DivergenciaDTO,
  FonteDTO,
  ItemIndice,
  PrecoCard,
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

/** Resumo de preço do card a partir das comparações por apresentação (precos.ts). */
function precoDoCard(p: Produto, ofertas: readonly Oferta[]): PrecoCard {
  const comparacoes = comparacoesDePreco(p, ofertas);
  const comPreco = comparacoes.filter((c) => c.comparacao.linhas.some((l) => l.centavos !== undefined));
  const comparavel = comparacoes.find((c) => c.comparacao.comparavel);
  if (comparavel)
    return {
      tipo: "comparavel",
      centavos: comparavel.comparacao.menorCentavos!,
      apresentacao: comparavel.descricao,
      principal: comparavel.apresentacaoId === p.apresentacaoPrincipal,
    };
  if (comPreco.length > 1) return { tipo: "apresentacoes-diferentes" };
  const unica = comPreco[0]?.comparacao.linhas.find((l) => l.centavos !== undefined);
  if (unica)
    return {
      tipo: "uma-loja",
      centavos: unica.centavos!,
      apresentacao: comPreco[0].descricao,
      principal: comPreco[0].apresentacaoId === p.apresentacaoPrincipal,
    };
  return { tipo: "sem-preco" };
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
    apresentacao: a.tipo === "kit" ? a.descricao : `${rotuloTipoApresentacao(a)} · ${formatarVolume(a)}`,
    estrategia: p.estrategiaAdesiva?.texto,
    componentes: componentesChave(p),
    mdp: p.composicao.mdp.valor === "sim",
    preco: precoDoCard(p, ofertas),
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
    // Todas as apresentações, principal primeiro (BUG-013).
    volume: [...new Set([apresentacaoPrincipal(p), ...p.apresentacoes].map((a) => formatarVolume(a)))].join(" · "),
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
