/**
 * Extração de preço da página de produto de uma loja, via JSON-LD schema.org
 * (Product → Offer), que as lojas publicam para o Google Shopping. Funções puras:
 * testadas em tests/unit/precos-extrair.test.ts.
 *
 * Regra do BRIEFING: nunca inventar preço. Qualquer ambiguidade vira erro, e o
 * chamador mantém a oferta como estava (com a data antiga) e relata no PR.
 */

export type ResultadoExtracao =
  | { ok: true; disponivel: true; centavos: number; skus: string[]; titulo?: string }
  | { ok: true; disponivel: false; skus: string[]; titulo?: string }
  | { ok: false; erro: string };

type No = Record<string, unknown>;

const ehObjeto = (v: unknown): v is No => typeof v === "object" && v !== null && !Array.isArray(v);
const lista = <T>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const temTipo = (n: No, tipo: string) => lista(n["@type"] as string | string[]).some((t) => String(t).endsWith(tipo));
const texto = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : undefined);

/** Todos os nós de todos os <script type="application/ld+json"> (inclui @graph). */
export function nosJsonLd(html: string): No[] {
  const nos: No[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    let dado: unknown;
    try {
      dado = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const pilha = lista(dado as unknown);
    while (pilha.length) {
      const n = pilha.pop();
      if (Array.isArray(n)) pilha.push(...n);
      else if (ehObjeto(n)) {
        nos.push(n);
        if (n["@graph"]) pilha.push(...lista(n["@graph"] as unknown[]));
      }
    }
  }
  return nos;
}

/** "89.90" | 89.9 | "1.234,56" → centavos inteiros; null se não for preço válido. */
export function precoEmCentavos(v: unknown): number | null {
  let s = texto(v);
  if (!s) return null;
  s = s.replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const centavos = Number(m[1]) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
  return centavos > 0 ? centavos : null;
}

interface OfertaLd {
  centavos: number | null;
  disponivel: boolean;
  sku?: string;
  moeda?: string;
}

function ofertasDoProduto(produto: No): OfertaLd[] {
  const skuProduto = texto(produto.sku) ?? texto(produto.mpn);
  const saida: OfertaLd[] = [];
  for (const o of lista(produto.offers as No | No[]).filter(ehObjeto)) {
    if (temTipo(o, "AggregateOffer") && o.offers) {
      saida.push(...ofertasDoProduto({ sku: produto.sku, offers: o.offers }));
      continue;
    }
    let preco = o.price ?? (ehObjeto(o.priceSpecification) ? o.priceSpecification.price : undefined);
    if (preco == null && temTipo(o, "AggregateOffer") && texto(o.lowPrice) === texto(o.highPrice)) preco = o.lowPrice;
    const disp = texto(o.availability) ?? "";
    saida.push({
      centavos: precoEmCentavos(preco),
      disponivel: !/OutOfStock|SoldOut|Discontinued|PreOrder/i.test(disp),
      sku: texto(o.sku) ?? skuProduto,
      moeda: texto(o.priceCurrency) ?? (ehObjeto(o.priceSpecification) ? texto(o.priceSpecification.priceCurrency) : undefined),
    });
  }
  return saida;
}

export function extrairPreco(html: string, skuEsperado?: string): ResultadoExtracao {
  const produtos = nosJsonLd(html).filter((n) => temTipo(n, "Product"));
  if (!produtos.length) return { ok: false, erro: "página sem JSON-LD de Product" };
  const titulo = texto(produtos[0].name);

  let ofertas = produtos.flatMap(ofertasDoProduto);
  if (!ofertas.length) return { ok: false, erro: "Product sem offers" };
  const skus = [...new Set(ofertas.map((o) => o.sku).filter((s): s is string => !!s))];

  if (skuEsperado) {
    ofertas = ofertas.filter((o) => o.sku === skuEsperado);
    if (!ofertas.length) return { ok: false, erro: `SKU ${skuEsperado} não encontrado na página (achados: ${skus.join(", ") || "nenhum"})` };
  }
  if (ofertas.some((o) => o.moeda && o.moeda !== "BRL")) return { ok: false, erro: "moeda diferente de BRL" };

  const disponiveis = ofertas.filter((o) => o.disponivel && o.centavos);
  if (!disponiveis.length) {
    return ofertas.every((o) => !o.disponivel)
      ? { ok: true, disponivel: false, skus, titulo }
      : { ok: false, erro: "oferta sem preço legível" };
  }
  const precos = new Set(disponiveis.map((o) => o.centavos));
  if (precos.size > 1) {
    return { ok: false, erro: `página com variações de preço (${[...precos].join(", ")} centavos) — cadastre skuLoja na oferta` };
  }
  return { ok: true, disponivel: true, centavos: disponiveis[0].centavos!, skus, titulo };
}

/** Interpretação mínima de robots.txt (grupo do nosso agente ou "*"; Allow/Disallow, regra mais longa vence). */
export function permitidoPorRobots(robotsTxt: string, caminho: string, agente = "SistemasAdesivosBot"): boolean {
  const grupos: { agentes: string[]; regras: { permitir: boolean; prefixo: string }[] }[] = [];
  let atual: (typeof grupos)[number] | null = null;
  let lendoAgentes = false;
  for (const linhaBruta of robotsTxt.split(/\r?\n/)) {
    const linha = linhaBruta.replace(/#.*/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(linha);
    if (!m) continue;
    const campo = m[1].toLowerCase();
    const valor = m[2].trim();
    if (campo === "user-agent") {
      if (!lendoAgentes) grupos.push((atual = { agentes: [], regras: [] }));
      atual!.agentes.push(valor.toLowerCase());
      lendoAgentes = true;
    } else if ((campo === "allow" || campo === "disallow") && atual) {
      lendoAgentes = false;
      if (valor) atual.regras.push({ permitir: campo === "allow", prefixo: valor });
    }
  }
  const grupo =
    grupos.find((g) => g.agentes.includes(agente.toLowerCase())) ?? grupos.find((g) => g.agentes.includes("*"));
  if (!grupo) return true;
  const casa = (prefixo: string) => {
    const re = new RegExp("^" + prefixo.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*"));
    return re.test(caminho);
  };
  const regra = grupo.regras
    .filter((r) => casa(r.prefixo.replace(/\$$/, "")))
    .sort((a, b) => b.prefixo.length - a.prefixo.length || Number(b.permitir) - Number(a.permitir))[0];
  return regra ? regra.permitir : true;
}
