import { describe, expect, it } from "vitest";
import { extrairPreco, permitidoPorRobots, precoEmCentavos } from "../../scripts/precos/extrair";

const pagina = (...ld: unknown[]) =>
  `<html><head>${ld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("")}</head></html>`;

const produto = (offers: unknown, extra: object = {}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Adesivo X 5 mL",
  ...extra,
  offers,
});

describe("precoEmCentavos", () => {
  it.each([
    ["89.90", 8990],
    [89.9, 8990],
    ["89", 8900],
    ["1.234,56", 123456],
    ["R$ 89,90", 8990],
    ["0", null],
    ["abc", null],
    ["", null],
    [undefined, null],
  ])("%s → %s", (v, esperado) => expect(precoEmCentavos(v)).toBe(esperado));
});

describe("extrairPreco", () => {
  it("lê Offer simples em estoque", () => {
    const r = extrairPreco(
      pagina(produto({ "@type": "Offer", price: "159.90", priceCurrency: "BRL", availability: "https://schema.org/InStock", sku: "123" })),
    );
    expect(r).toEqual({ ok: true, disponivel: true, centavos: 15990, skus: ["123"], titulo: "Adesivo X 5 mL" });
  });

  it("acha Product dentro de @graph", () => {
    const r = extrairPreco(pagina({ "@graph": [{ "@type": "WebPage" }, produto({ "@type": "Offer", price: 10 })] }));
    expect(r).toMatchObject({ ok: true, centavos: 1000 });
  });

  it("fora de estoque → indisponível, sem preço", () => {
    const r = extrairPreco(pagina(produto({ "@type": "Offer", price: "10", availability: "http://schema.org/OutOfStock" })));
    expect(r).toMatchObject({ ok: true, disponivel: false });
  });

  it("variações com preços diferentes sem SKU → erro (não escolhe)", () => {
    const r = extrairPreco(
      pagina(produto([{ "@type": "Offer", price: "10", sku: "A" }, { "@type": "Offer", price: "20", sku: "B" }])),
    );
    expect(r.ok).toBe(false);
  });

  it("com skuLoja escolhe a variação certa", () => {
    const html = pagina(produto([{ "@type": "Offer", price: "10", sku: "A" }, { "@type": "Offer", price: "20", sku: "B" }]));
    expect(extrairPreco(html, "B")).toMatchObject({ ok: true, centavos: 2000 });
    expect(extrairPreco(html, "C").ok).toBe(false);
  });

  it("AggregateOffer só com faixa de preço → erro", () => {
    const r = extrairPreco(pagina(produto({ "@type": "AggregateOffer", lowPrice: "10", highPrice: "20" })));
    expect(r.ok).toBe(false);
  });

  it("moeda diferente de BRL → erro", () => {
    expect(extrairPreco(pagina(produto({ "@type": "Offer", price: "10", priceCurrency: "USD" }))).ok).toBe(false);
  });

  it("sem JSON-LD ou JSON quebrado → erro", () => {
    expect(extrairPreco("<html></html>").ok).toBe(false);
    expect(extrairPreco('<script type="application/ld+json">{quebrado</script>').ok).toBe(false);
  });
});

describe("permitidoPorRobots", () => {
  const robots = `
User-agent: *
Disallow: /checkout
Disallow: /*?filtro=
Allow: /checkout/ajuda

User-agent: OutroBot
Disallow: /
`;
  it.each([
    ["/adesivo-x-5ml/p", true],
    ["/checkout/carrinho", false],
    ["/checkout/ajuda", true],
    ["/busca?filtro=1", false],
  ])("%s → %s", (caminho, esperado) => expect(permitidoPorRobots(robots, caminho)).toBe(esperado));

  it("robots vazio permite tudo", () => expect(permitidoPorRobots("", "/x")).toBe(true));
  it("grupo específico do agente tem precedência", () =>
    expect(permitidoPorRobots("User-agent: *\nDisallow: /\n\nUser-agent: SistemasAdesivosBot\nAllow: /", "/x")).toBe(true));
});
