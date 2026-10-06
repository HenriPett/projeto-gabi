/**
 * Lojas cobertas na v1 (BRIEFING: Dental Cremer, Dental Speed, Dental Med Sul).
 * Domínios e padrões de URL confirmados pelo Bula em 2026-10-06.
 * `paginaDeProduto` = forma do caminho de uma página de produto. Med Sul não
 * usa ".html", então o padrão não separa produto de categoria de um nível só:
 * lá a revisão humana do link continua sendo a garantia.
 */
export const LOJAS = [
  {
    id: "dental-cremer",
    nome: "Dental Cremer",
    dominios: ["dentalcremer.com.br"],
    // /adesivo-ambar-fgm-356588.html · categoria /dentistica-e-estetica/adesivo.html tem 2 níveis
    paginaDeProduto: /^\/[a-z0-9-]+\.html$/,
  },
  {
    id: "dental-speed",
    nome: "Dental Speed",
    dominios: ["dentalspeed.com"],
    // /adesivo-ankor-u-bond-5ml-angelus-ang38251a.html
    paginaDeProduto: /^\/[a-z0-9-]+\.html$/,
  },
  {
    id: "dental-med-sul",
    nome: "Dental Med Sul",
    dominios: ["dentalmedsul.com.br"],
    // /adesivo-ambar-4ml-fgm · categorias em /especialidades/... (2+ níveis)
    paginaDeProduto: /^\/[a-z0-9-]+$/,
  },
] as const;

export type LojaId = (typeof LOJAS)[number]["id"];
export const LOJA_IDS = LOJAS.map((l) => l.id) as [LojaId, ...LojaId[]];

export function loja(id: LojaId) {
  return LOJAS.find((l) => l.id === id)!;
}

/** Caminhos/parâmetros de busca e listagem — não são página de produto. */
const CAMINHO_DE_BUSCA = /(^|\/)(busca|buscar|search|catalogsearch|pesquisa|especialidades|media)(\/|$)/i;
const PARAMETROS_DE_BUSCA = ["q", "s", "busca", "search", "ft", "termo"];

/**
 * null se `url` é HTTPS, de um dos domínios da loja e parece página de produto;
 * senão, a mensagem do problema. Barra home (/, //, /index.html) e busca.
 */
export function validarUrlDeProduto(lojaId: LojaId, url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "URL inválida";
  }
  if (u.protocol !== "https:") return "link de compra deve usar https://";
  const host = u.hostname.replace(/^www\./, "");
  const { dominios } = loja(lojaId);
  if (!dominios.some((d) => host === d || host.endsWith(`.${d}`))) {
    return `URL não pertence à loja ${lojaId} (${dominios.join(", ")})`;
  }
  const caminho = u.pathname.replace(/\/{2,}/g, "/").replace(/\/index\.\w+$/i, "/");
  if (caminho === "/" || caminho === "") {
    return "URL aponta para a home da loja — use a página específica do produto";
  }
  if (CAMINHO_DE_BUSCA.test(caminho) || PARAMETROS_DE_BUSCA.some((p) => u.searchParams.has(p))) {
    return "URL aponta para uma busca da loja — use a página específica do produto";
  }
  if (!loja(lojaId).paginaDeProduto.test(caminho.toLowerCase())) {
    return `caminho "${u.pathname}" não tem a forma de página de produto da ${loja(lojaId).nome}`;
  }
  return null;
}
