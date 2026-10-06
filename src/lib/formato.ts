const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 8990 → "R$ 89,90" */
export function formatarBRL(centavos: number): string {
  return brl.format(centavos / 100);
}

/** "2026-10-06" → "06/10/2026" (sem passar por Date: evita erro de fuso). */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
