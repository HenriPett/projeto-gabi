import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OfertasDoProduto, ProdutoSistemaAdesivo } from "@/lib/esquema";

const base = path.resolve(__dirname, "../fixtures/dados/materiais/sistemas-adesivos");
const ler = (f: string) => JSON.parse(fs.readFileSync(path.join(base, f), "utf8"));
const produto = () => ler("produtos/exemplo-universal.json");
const ofertas = () => ler("ofertas/exemplo-universal.json");
const erros = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => i.message);

describe("esquema de produto", () => {
  it("fixture é válida", () => {
    expect(erros(ProdutoSistemaAdesivo.safeParse(produto()))).toEqual([]);
  });
  it("rejeita referência a fonte não declarada", () => {
    const p = produto();
    p.composicao.mdp.fontes = ["inexistente"];
    expect(erros(ProdutoSistemaAdesivo.safeParse(p)).join()).toMatch(/não declarada/);
  });
  it("rejeita afirmação sem fonte", () => {
    const p = produto();
    p.composicao.mdp.fontes = [];
    expect(ProdutoSistemaAdesivo.safeParse(p).success).toBe(false);
  });
  it("rejeita protocolo sem fonte oficial", () => {
    const p = produto();
    p.fontes.push({ id: "artigo", tipo: "literatura", titulo: "x", url: "https://example.com", acessadoEm: "2026-10-01" });
    p.protocolos[0].fontes = ["artigo"];
    expect(erros(ProdutoSistemaAdesivo.safeParse(p)).join()).toMatch(/fonte oficial/);
  });
  it("não universal tem exatamente uma subcategoria do próprio grupo", () => {
    const p = produto();
    p.classificacao.grupo = "convencional";
    expect(ProdutoSistemaAdesivo.safeParse(p).success).toBe(false);
  });
  it("publicado exige protocolo para cada estratégia", () => {
    const p = produto();
    p.protocolos = [p.protocolos[0]];
    expect(erros(ProdutoSistemaAdesivo.safeParse(p)).join()).toMatch(/sem protocolo/);
  });
  it("divergência exige duas versões", () => {
    const p = produto();
    p.divergencias[0].versoes.pop();
    expect(ProdutoSistemaAdesivo.safeParse(p).success).toBe(false);
  });
});

describe("esquema de ofertas", () => {
  it("fixture é válida", () => {
    expect(erros(OfertasDoProduto.safeParse(ofertas()))).toEqual([]);
  });
  it("rejeita link para a home da loja", () => {
    const o = ofertas();
    o.ofertas[0].url = "https://www.dentalcremer.com.br/";
    expect(erros(OfertasDoProduto.safeParse(o)).join()).toMatch(/home/);
  });
  it("rejeita link de outra loja", () => {
    const o = ofertas();
    o.ofertas[0].url = "https://www.dentalspeed.com/produto.html";
    expect(erros(OfertasDoProduto.safeParse(o)).join()).toMatch(/não pertence/);
  });
  it("disponível exige preço padrão; preço não pode ser float", () => {
    const o = ofertas();
    o.ofertas[0].precos = [{ tipo: "pix", centavos: 100 }];
    expect(OfertasDoProduto.safeParse(o).success).toBe(false);
    const o2 = ofertas();
    o2.ofertas[0].precos[0].centavos = 159.9;
    expect(OfertasDoProduto.safeParse(o2).success).toBe(false);
  });
  it("não encontrado não pode ter preço", () => {
    const o = ofertas();
    o.ofertas[2].precos = [{ tipo: "padrao", centavos: 100 }];
    expect(OfertasDoProduto.safeParse(o).success).toBe(false);
  });
});

describe("padrão de página de produto por loja", async () => {
  const { validarUrlDeProduto } = await import("@/lib/esquema");
  it.each([
    ["dental-cremer", "https://www.dentalcremer.com.br/adesivo-exemplo-fgm-356588.html"],
    ["dental-cremer", "https://www.dentalcremer.com.br/adesivo-exemplo-maquira.html"],
    ["dental-speed", "https://www.dentalspeed.com/adesivo-exemplo-5ml-angelus-ang38251a.html"],
    ["dental-med-sul", "https://www.dentalmedsul.com.br/adesivo-exemplo-4ml-fgm"],
  ] as const)("aceita %s %s", (loja, url) => {
    expect(validarUrlDeProduto(loja, url)).toBeNull();
  });
  it.each([
    ["dental-cremer", "https://www.dentalcremer.com.br/dentistica-e-estetica/adesivo.html"],
    ["dental-cremer", "https://www.dentalcremer.com.br/adesivo-exemplo"],
    ["dental-speed", "https://www.dentalspeed.com/catalogsearch/result/?q=adesivo"],
    ["dental-speed", "https://www.dentalspeed.com/dentistica-e-estetica/adesivo.html"],
    ["dental-med-sul", "https://www.dentalmedsul.com.br/especialidades/dentistica"],
    ["dental-med-sul", "https://www.dentalmedsul.com.br/catalogsearch/result/?q=adesivo"],
    ["dental-med-sul", "https://www.dentalmedsul.com.br/media/catalog/product/a/b.jpg"],
    ["dental-med-sul", "https://www.dentalmedsul.com.br/adesivo-exemplo.html"],
  ] as const)("rejeita %s %s", (loja, url) => {
    expect(validarUrlDeProduto(loja, url)).not.toBeNull();
  });
});
