/**
 * Lojas cobertas na v1 (BRIEFING: Dental Cremer, Dental Speed, Dental Med Sul).
 * `dominios` é usado para validar que todo link de compra aponta para a loja
 * certa — e nunca para a home (ver validarUrlDeProduto).
 * TODO(Bula): confirmar domínios oficiais das três lojas.
 */
export const LOJAS = [
  { id: "dental-cremer", nome: "Dental Cremer", dominios: ["dentalcremer.com.br"] },
  { id: "dental-speed", nome: "Dental Speed", dominios: ["dentalspeed.com"] },
  { id: "dental-med-sul", nome: "Dental Med Sul", dominios: ["dentalmedsul.com.br"] },
] as const;

export type LojaId = (typeof LOJAS)[number]["id"];
export const LOJA_IDS = LOJAS.map((l) => l.id) as [LojaId, ...LojaId[]];

export function loja(id: LojaId) {
  return LOJAS.find((l) => l.id === id)!;
}

/** Caminhos/parâmetros de busca e listagem — não são página de produto. */
const CAMINHO_DE_BUSCA = /(^|\/)(busca|buscar|search|catalogsearch|pesquisa)(\/|$)/i;
const PARAMETROS_DE_BUSCA = ["q", "s", "busca", "search", "ft", "termo"];

/**
 * null se `url` é HTTPS, de um dos domínios da loja e parece página de produto;
 * senão, a mensagem do problema. Barra home (/, //, /index.html) e busca.
 * TODO(Bula): padrão de rota de produto por loja, quando confirmado.
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
  return null;
}
