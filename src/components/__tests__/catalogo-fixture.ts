import { vi } from "vitest";

// dados-de-tela.ts é "server-only"; no teste rodamos fora do React Server.
vi.mock("server-only", () => ({}));

process.env.DADOS_DIR = "tests/fixtures/dados";
process.env.INCLUIR_RASCUNHOS = "0";

const { catalogo } = await import("@/lib/dados/carregar");
const telas = await import("../dados-de-tela");

export const cat = catalogo();
export const produto = (id: string) => {
  const p = cat.produtos.find((x) => x.id === id);
  if (!p) throw new Error(`fixture ${id} não encontrada`);
  return p;
};
export const ofertasDe = (id: string) => cat.ofertas.get(id) ?? [];
export const comparacoes = (id: string) => telas.comparacoesDePreco(produto(id), ofertasDe(id));
export const card = (id: string) => telas.cardDe(produto(id), ofertasDe(id));
export const coluna = (id: string) => telas.colunaComparador(produto(id), ofertasDe(id));
export const indice = () => telas.indiceDeBusca(cat.produtos);
export { telas };
