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

/**
 * Hífen inseparável (U+2011) onde a quebra de linha separaria um termo técnico:
 * entre número e letra/número ("10-MDP", "4-MET", "1-2") e antes de sigla em
 * maiúsculas ("Bis-GMA"). Palavras comuns ("di-hidrogenofosfato") não mudam.
 */
export function semQuebrarHifen(texto: string): string {
  return texto.replace(/(?<=\d)-(?=[\p{L}\d])|(?<=[\p{L}\d])-(?=\d)|(?<=\p{L})-(?=\p{Lu}{2,})/gu, "\u2011");
}

/**
 * "Perdigão J. Current perspectives… 2020;56…" → "Perdigão 2020".
 * Sobrenome do 1º autor (antes da 1ª vírgula ou ". ", sem iniciais/sufixo
 * numérico) + 1º ano do título. Sem ano: só o autor.
 */
export function citacaoCurta(titulo: string): string {
  const autor = titulo.split(/,|\. /)[0].trim();
  const partes = autor.split(/\s+/);
  while (partes.length > 1 && /^([A-Z]{1,3}\.?|\d+(st|nd|rd|th)\.?)$/.test(partes[partes.length - 1])) partes.pop();
  const sobrenome = partes.join(" ").replace(/\bJr$/, "Jr.");
  const ano = titulo.match(/\b(19|20)\d{2}\b/)?.[0];
  return ano ? `${sobrenome} ${ano}` : sobrenome;
}
