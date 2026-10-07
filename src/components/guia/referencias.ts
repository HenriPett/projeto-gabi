import type { ArtigoGuia } from "@/lib/esquema";

/**
 * Referências numeradas na ordem da primeira citação no texto; fontes
 * declaradas mas não citadas vão ao fim (ainda listadas, com número).
 */
export function referenciasNumeradas(artigo: Pick<ArtigoGuia, "secoes" | "fontes">) {
  const citadas = artigo.secoes.flatMap((s) => s.paragrafos.flatMap((p) => p.fontes));
  const ordem = [...new Set([...citadas, ...artigo.fontes.map((f) => f.id)])];
  return {
    numero: (id: string) => ordem.indexOf(id) + 1,
    referencias: ordem.flatMap((id) => artigo.fontes.find((f) => f.id === id) ?? []),
  };
}
