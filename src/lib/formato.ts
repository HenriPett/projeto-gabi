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

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Campos de Apresentacao (esquema) usados na formatação; estrutural para não puxar zod ao cliente. */
export interface ApresentacaoFormatavel {
  tipo: string;
  descricao: string;
  quantidade: number;
  volumeMl?: number;
  massaG?: number;
}

/**
 * "5 mL", "2,5 mL", "3 g", "50 × 0,1 mL". Kit (ou sem volume/massa) → descrição
 * do fabricante, já que somar os frascos do kit induziria a erro.
 */
export function formatarVolume(a: ApresentacaoFormatavel): string {
  if (a.tipo === "kit") return a.descricao;
  const unidade =
    a.volumeMl !== undefined ? `${decimal.format(a.volumeMl)} mL` : a.massaG !== undefined ? `${decimal.format(a.massaG)} g` : undefined;
  if (!unidade) return a.descricao;
  return a.quantidade > 1 ? `${a.quantidade} × ${unidade}` : unidade;
}
