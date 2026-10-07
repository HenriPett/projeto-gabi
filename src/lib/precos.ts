import { LOJAS, type LojaId, type Oferta } from "@/lib/esquema";

/**
 * Regras de comparação de preço (BRIEFING §12–§16). Funções puras — toda a UI
 * de preço deve passar por aqui; nada de calcular preço em componente.
 *
 * Comparabilidade: só ofertas com o MESMO apresentacaoId (mesmo produto,
 * fabricante, volume, quantidade). A equivalência é decidida na curadoria dos
 * dados (Bula), não por heurística em código.
 */

export interface LinhaLoja {
  lojaId: LojaId;
  lojaNome: string;
  status: Oferta["status"];
  /** Preço "padrao" em centavos, se disponível. */
  centavos?: number;
  /** Preço Pix em centavos, se a loja informa. Informativo; não entra na comparação. */
  pixCentavos?: number;
  url?: string;
  consultadoEm?: string;
  /** Selo "MENOR PREÇO": só quando comparável e há diferença; empatadas no menor recebem todas. */
  menorPreco: boolean;
}

export interface ComparacaoPrecos {
  apresentacaoId: string;
  /**
   * Sempre uma linha por loja. Ordem (DESIGN §4.7): com preço, do menor ao maior;
   * depois as sem preço, em ordem alfabética. Loja sem registro = "nao-encontrado".
   */
  linhas: LinhaLoja[];
  /** true quando ≥ 2 lojas têm preço para esta apresentação. */
  comparavel: boolean;
  menorCentavos?: number;
  maiorCentavos?: number;
  /** maior − menor; só quando comparável e > 0. */
  economiaCentavos?: number;
}

const precoDe = (o: Oferta, tipo: "padrao" | "pix") => o.precos.find((p) => p.tipo === tipo)?.centavos;

export function compararPrecos(ofertas: readonly Oferta[], apresentacaoId: string): ComparacaoPrecos {
  const daApresentacao = ofertas.filter((o) => o.apresentacaoId === apresentacaoId);

  const linhas: LinhaLoja[] = LOJAS.map((loja) => {
    const o = daApresentacao.find((x) => x.lojaId === loja.id);
    if (!o) return { lojaId: loja.id, lojaNome: loja.nome, status: "nao-encontrado", menorPreco: false };
    const centavos = o.status === "disponivel" ? precoDe(o, "padrao") : undefined;
    return {
      lojaId: loja.id,
      lojaNome: loja.nome,
      status: centavos === undefined && o.status === "disponivel" ? "indisponivel" : o.status,
      centavos,
      pixCentavos: o.status === "disponivel" ? precoDe(o, "pix") : undefined,
      url: o.status === "nao-encontrado" ? undefined : o.url,
      consultadoEm: o.consultadoEm,
      menorPreco: false,
    };
  });

  linhas.sort((a, b) => {
    if (a.centavos !== undefined && b.centavos !== undefined)
      return a.centavos - b.centavos || a.lojaNome.localeCompare(b.lojaNome, "pt-BR");
    if (a.centavos !== undefined) return -1;
    if (b.centavos !== undefined) return 1;
    return a.lojaNome.localeCompare(b.lojaNome, "pt-BR");
  });

  const precos = linhas.flatMap((l) => (l.centavos === undefined ? [] : [l.centavos]));
  const comparavel = precos.length >= 2;
  if (!comparavel) return { apresentacaoId, linhas, comparavel };

  const menorCentavos = Math.min(...precos);
  const maiorCentavos = Math.max(...precos);
  const economia = maiorCentavos - menorCentavos;
  // Todos iguais: não há "menor preço" a destacar (DESIGN §4.7, PR-11).
  if (economia > 0) for (const l of linhas) l.menorPreco = l.centavos === menorCentavos;
  return {
    apresentacaoId,
    linhas,
    comparavel,
    menorCentavos,
    maiorCentavos,
    economiaCentavos: economia > 0 ? economia : undefined,
  };
}

/** Apresentações que têm ao menos uma oferta registrada, na ordem das ofertas. */
export function apresentacoesComOferta(ofertas: readonly Oferta[]): string[] {
  return [...new Set(ofertas.map((o) => o.apresentacaoId))];
}

/**
 * Apresentação comparada por padrão na página do produto: a principal, se tiver
 * oferta; senão a com mais lojas com preço. undefined = nenhuma oferta.
 */
export function apresentacaoParaComparar(
  ofertas: readonly Oferta[],
  apresentacaoPrincipal: string,
): string | undefined {
  const ids = apresentacoesComOferta(ofertas);
  if (ids.includes(apresentacaoPrincipal)) return apresentacaoPrincipal;
  const comPreco = (id: string) => compararPrecos(ofertas, id).linhas.filter((l) => l.centavos !== undefined).length;
  return ids.sort((a, b) => comPreco(b) - comPreco(a))[0];
}

/** Para "💰 MELHORES PREÇOS" da home: maiores economias, uma entrada por produto. */
export function maioresEconomias(
  ofertasPorProduto: ReadonlyMap<string, readonly Oferta[]>,
  limite = 6,
): { produtoId: string; comparacao: ComparacaoPrecos }[] {
  const melhores: { produtoId: string; comparacao: ComparacaoPrecos }[] = [];
  for (const [produtoId, ofertas] of ofertasPorProduto) {
    const candidatas = apresentacoesComOferta(ofertas)
      .map((a) => compararPrecos(ofertas, a))
      .filter((c) => c.economiaCentavos !== undefined)
      .sort((a, b) => b.economiaCentavos! - a.economiaCentavos!);
    if (candidatas[0]) melhores.push({ produtoId, comparacao: candidatas[0] });
  }
  return melhores.sort((a, b) => b.comparacao.economiaCentavos! - a.comparacao.economiaCentavos!).slice(0, limite);
}
