import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtigoGuia } from "@/lib/esquema";

const dir = path.resolve(__dirname, "../fixtures/dados/materiais/sistemas-adesivos/guia");
const artigo = () => JSON.parse(fs.readFileSync(path.join(dir, "exemplo-publicado.json"), "utf8"));
const msgs = (r: ReturnType<typeof ArtigoGuia.safeParse>) => (r.success ? [] : r.error.issues.map((i) => i.message));

describe("esquema do Guia", () => {
  it("fixture é válida", () => expect(msgs(ArtigoGuia.safeParse(artigo()))).toEqual([]));
  it("parágrafo sem fonte é rejeitado", () => {
    const a = artigo();
    a.secoes[0].paragrafos[0].fontes = [];
    expect(ArtigoGuia.safeParse(a).success).toBe(false);
  });
  it("fonte não declarada é rejeitada", () => {
    const a = artigo();
    a.secoes[0].paragrafos[0].fontes = ["nada"];
    expect(msgs(ArtigoGuia.safeParse(a)).join()).toMatch(/não declarada/);
  });
  it("publicado só com fonte de loja é rejeitado", () => {
    const a = artigo();
    a.fontes = [{ id: "artigo", tipo: "loja", titulo: "x", url: "https://example.com/x", acessadoEm: "2026-10-01" }];
    a.secoes = [{ paragrafos: [{ texto: "x", fontes: ["artigo"] }] }];
    expect(msgs(ArtigoGuia.safeParse(a)).join()).toMatch(/fonte técnica/);
  });
});

describe("catalogo().guia", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DADOS_DIR", "tests/fixtures/dados");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("produção: só publicados, sem relacionado oculto", async () => {
    vi.stubEnv("INCLUIR_RASCUNHOS", "0");
    const { catalogo } = await import("@/lib/dados/carregar");
    const g = catalogo().guia["sistemas-adesivos"]!;
    expect(g.map((a) => a.slug)).toEqual(["exemplo-publicado"]);
    expect(g[0].relacionados).toEqual([]);
  });
  it("com rascunhos: todos, ordenados por ordem", async () => {
    vi.stubEnv("INCLUIR_RASCUNHOS", "1");
    const { catalogo } = await import("@/lib/dados/carregar");
    expect(catalogo().guia["sistemas-adesivos"]!.map((a) => a.slug)).toEqual(["exemplo-rascunho", "exemplo-publicado"]);
  });
});
