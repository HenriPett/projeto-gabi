import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { catalogo as catalogoDasPaginas, lerCatalogo, type Catalogo } from "@/lib/dados/carregar";
import { OfertasDoProduto } from "@/lib/esquema";
import { validarUrlDeProduto } from "@/lib/esquema/lojas";
import { buscar, itemDeBusca } from "@/lib/busca";
import { apresentacaoParaComparar, compararPrecos, maioresEconomias } from "@/lib/precos";
import { formatarBRL, formatarData } from "@/lib/formato";

/**
 * Cenários de borda do PLANO-DE-TESTES (seções 3 e 4) sobre o catálogo fictício
 * em tests/fixtures/dados. Os mesmos produtos alimentam os testes E2E.
 *
 * `it.fails` = bug conhecido (BUG-xxx no plano). Quando o bug for corrigido o
 * teste passa a falhar: troque por `it` e remova a marcação.
 */

let cat: Catalogo;
beforeAll(() => {
  process.env.DADOS_DIR = path.resolve(__dirname, "../fixtures/dados");
  const { catalogo, erros } = lerCatalogo();
  expect(erros).toEqual([]);
  cat = catalogo;
});

const ofertas = (id: string) => cat.ofertas.get(id) ?? [];
const comparar = (id: string, apr: string) => compararPrecos(ofertas(id), apr);
const precoPorLoja = (id: string, apr: string) =>
  Object.fromEntries(comparar(id, apr).linhas.map((l) => [l.lojaId, l]));

describe("preços — cenários das fixtures", () => {
  it("PR-01/PR-14: menor preço e economia exata (R$ 89,90 × 120,35 × 104,10 → R$ 30,45)", () => {
    const c = comparar("ficticio-ambar", "frasco-4ml");
    expect(c.comparavel).toBe(true);
    expect(c.linhas.map((l) => l.lojaId)).toEqual(["dental-cremer", "dental-med-sul", "dental-speed"]);
    expect(c.linhas.filter((l) => l.menorPreco).map((l) => l.lojaId)).toEqual(["dental-cremer"]);
    expect(c.economiaCentavos).toBe(3045);
    expect(formatarBRL(c.economiaCentavos!).replace(/\s/g, " ")).toBe("R$ 30,45");
  });

  it("PR-16/PR-18: cada loja mantém sua própria data, sem deslocamento de fuso", () => {
    const l = precoPorLoja("ficticio-ambar", "frasco-4ml");
    expect(formatarData(l["dental-cremer"].consultadoEm!)).toBe("06/10/2026");
    expect(formatarData(l["dental-speed"].consultadoEm!)).toBe("05/10/2026");
    expect(formatarData(l["dental-med-sul"].consultadoEm!)).toBe("30/09/2026");
  });

  it("PR-10: empate no menor preço marca as duas lojas", () => {
    const c = comparar("ficticio-single-bond-2", "frasco-6g");
    expect(c.linhas.filter((l) => l.menorPreco).map((l) => l.lojaId).sort()).toEqual(["dental-cremer", "dental-speed"]);
    expect(c.economiaCentavos).toBe(2000);
  });

  it("PR-11: três preços iguais → todas menor preço, sem economia", () => {
    const c = comparar("ficticio-tudo-em-um", "frasco-5ml");
    expect(c.comparavel).toBe(true);
    expect(c.economiaCentavos).toBeUndefined();
  });

  it("PR-07/PR-08: um só preço → não comparável, sem menor preço e sem economia; demais lojas listadas", () => {
    const c = comparar("ficticio-prime-bond-2-1", "frasco-4ml");
    expect(c.comparavel).toBe(false);
    expect(c.linhas).toHaveLength(3);
    expect(c.linhas.some((l) => l.menorPreco)).toBe(false);
    expect(c.economiaCentavos).toBeUndefined();
    const l = precoPorLoja("ficticio-prime-bond-2-1", "frasco-4ml");
    expect(l["dental-speed"]).toMatchObject({ status: "nao-encontrado", centavos: undefined, url: undefined });
    expect(l["dental-med-sul"]).toMatchObject({ status: "indisponivel", centavos: undefined });
  });

  it("PR-09: nenhuma loja com preço → 3 linhas sem valor", () => {
    const c = comparar("ficticio-multiuso-3p", "kit-3-frascos");
    expect(c.comparavel).toBe(false);
    expect(c.linhas.every((l) => l.centavos === undefined)).toBe(true);
    expect(c.linhas.map((l) => l.status).sort()).toEqual(["indisponivel", "nao-encontrado", "nao-encontrado"]);
  });

  it("PR-06: apresentação diferente (refil) fica fora da comparação do kit", () => {
    const kit = comparar("ficticio-dois-frascos", "kit-primer-adesivo");
    expect(kit.economiaCentavos).toBe(3000);
    expect(precoPorLoja("ficticio-dois-frascos", "kit-primer-adesivo")["dental-speed"].centavos).toBeUndefined();
    const refil = comparar("ficticio-dois-frascos", "refil-adesivo-5ml");
    expect(refil.comparavel).toBe(false);
  });

  it("PR-02: 3 mL × 5 mL nunca se comparam", () => {
    const c5 = comparar("ficticio-universal-triplo", "frasco-5ml");
    const c3 = comparar("ficticio-universal-triplo", "frasco-3ml");
    expect(c5.comparavel).toBe(false);
    expect(c3.comparavel).toBe(false);
    expect(c5.linhas.find((l) => l.lojaId === "dental-cremer")?.centavos).toBeUndefined();
  });

  it("PR-27: Melhores preços só usa preços comparáveis e ignora produtos sem economia", () => {
    const ids = maioresEconomias(cat.ofertas).map((m) => m.produtoId);
    expect(ids).toEqual(["ficticio-rascunho", "ficticio-ambar", "ficticio-dois-frascos", "ficticio-single-bond-2", "exemplo-universal"]);
  });

  it("BUG-005: em produção, catalogo().ofertas não inclui ofertas de rascunho (vazaria em Melhores preços → link 404)", () => {
    process.env.INCLUIR_RASCUNHOS = "0";
    const c = catalogoDasPaginas();
    expect(c.produtos.map((p) => p.id)).not.toContain("ficticio-rascunho");
    expect(maioresEconomias(c.ofertas).map((m) => m.produtoId)).not.toContain("ficticio-rascunho");
  });

  it("apresentacaoParaComparar usa a principal quando ela tem oferta", () => {
    expect(apresentacaoParaComparar(ofertas("ficticio-universal-triplo"), "frasco-5ml")).toBe("frasco-5ml");
  });
});

describe("validação de URL de compra", () => {
  it("BUG-002: rejeita http:// (sem TLS)", () => {
    expect(validarUrlDeProduto("dental-cremer", "http://www.dentalcremer.com.br/produto-x")).not.toBeNull();
  });
  it("BUG-003: rejeita página de busca da loja (não é página de produto)", () => {
    expect(validarUrlDeProduto("dental-cremer", "https://www.dentalcremer.com.br/busca?q=ambar")).not.toBeNull();
  });
  it("BUG-003: rejeita variações da home (/index.html, //)", () => {
    expect(validarUrlDeProduto("dental-cremer", "https://www.dentalcremer.com.br/index.html")).not.toBeNull();
    expect(validarUrlDeProduto("dental-cremer", "https://www.dentalcremer.com.br//")).not.toBeNull();
  });
  it("rejeita domínio parecido que não é da loja", () => {
    expect(validarUrlDeProduto("dental-cremer", "https://www.fakedentalcremer.com.br/x")).not.toBeNull();
    expect(validarUrlDeProduto("dental-cremer", "https://dentalcremer.com.br.evil.com/x")).not.toBeNull();
  });
  it("BUG-004: rejeita consultadoEm no futuro", () => {
    const arq = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../fixtures/dados/materiais/sistemas-adesivos/ofertas/ficticio-ambar.json"),
        "utf8",
      ),
    );
    arq.ofertas[0].consultadoEm = "2099-01-01";
    expect(OfertasDoProduto.safeParse(arq).success).toBe(false);
  });
});

describe("busca — cenários das fixtures", () => {
  const ids = (q: string) => buscar(cat.produtos.filter((p) => p.revisao.status === "publicado").map(itemDeBusca), q).map((i) => i.id).sort();

  it("B-01: acento e caixa", () => {
    for (const q of ["Âmbar", "ambar", "AMBAR"]) expect(ids(q)).toEqual(["ficticio-ambar"]);
  });
  it("B-03/B-04: Prime&Bond e variações", () => {
    for (const q of ["Prime&Bond", "prime & bond", "prime bond", "primebond", "PRIME&BOND"])
      expect(ids(q)).toEqual(["ficticio-prime-bond-2-1"]);
  });
  it("B-06: MDP só onde a composição confirma", () => {
    for (const q of ["MDP", "mdp", "10-MDP"]) expect(ids(q)).toContain("ficticio-tudo-em-um");
    expect(ids("MDP")).toEqual(["exemplo-universal", "ficticio-tudo-em-um", "ficticio-universal-triplo"]);
  });
  it("B-07: '2 passos' traz convencionais e autocondicionantes de 2 passos", () => {
    expect(ids("2 passos")).toEqual(
      expect.arrayContaining(["ficticio-ambar", "ficticio-single-bond-2", "ficticio-prime-bond-2-1", "ficticio-dois-frascos"]),
    );
  });
  it("BUG-001: '3 passos' não traz produto de 2 passos só porque o fabricante é '3M'", () => {
    expect(ids("3 passos")).toEqual(["ficticio-multiuso-3p"]);
  });
  it("BUG-001: '1 passo' não traz 'Prime&Bond 2.1' (2 passos) por causa do '.1'", () => {
    expect(ids("1 passo")).toEqual(["ficticio-tudo-em-um"]);
  });
  it("BUG-006: '10-MDP' acha todo produto com MDP confirmado, mesmo cadastrado só como 'MDP'", () => {
    expect(ids("10-MDP")).toEqual(ids("MDP"));
  });
  it("BUG-001 (regressão): variações de 'N passos' e números em nomes", () => {
    expect(ids("2passos")).toEqual(ids("2 PASSOS"));
    expect(ids("3passos")).toEqual(["ficticio-multiuso-3p"]);
    expect(ids("Single Bond 2")).toEqual(["ficticio-single-bond-2"]);
    expect(ids("2.1")).toEqual(["ficticio-prime-bond-2-1"]);
    expect(ids("3M")).toEqual(["ficticio-single-bond-2", "ficticio-universal-triplo"]);
  });
  it("B-10/U-05: universal aparece uma vez", () => {
    expect(ids("Universal Triplo")).toEqual(["ficticio-universal-triplo"]);
  });
  it("B-13: fabricante", () => {
    expect(ids("kuraray")).toEqual(["ficticio-tudo-em-um"]);
  });
  it("B-15/B-20: vazio e metacaracteres de regex não quebram", () => {
    expect(ids("   ")).toEqual([]);
    for (const q of ["(", "*", "[", "\\", ".*", "%E0"]) expect(() => ids(q)).not.toThrow();
  });
  it("rascunho fora quando filtrado como em produção", () => {
    expect(ids("Rascunho")).toEqual([]);
  });
});
