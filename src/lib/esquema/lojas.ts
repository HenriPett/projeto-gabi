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

/** true se `url` é de um dos domínios da loja e não é a home. */
export function validarUrlDeProduto(lojaId: LojaId, url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "URL inválida";
  }
  const host = u.hostname.replace(/^www\./, "");
  const { dominios } = loja(lojaId);
  if (!dominios.some((d) => host === d || host.endsWith(`.${d}`))) {
    return `URL não pertence à loja ${lojaId} (${dominios.join(", ")})`;
  }
  if (u.pathname === "/" || u.pathname === "") {
    return "URL aponta para a home da loja — use a página específica do produto";
  }
  return null;
}
