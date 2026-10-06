import { describe, expect, it } from "vitest";
import type { Oferta } from "@/lib/esquema";
import { apresentacaoParaComparar, compararPrecos, maioresEconomias } from "./precos";

const oferta = (o: Partial<Oferta> & Pick<Oferta, "lojaId" | "apresentacaoId">): Oferta => ({
  status: "disponivel",
  url: "https://www.dentalcremer.com.br/x",
  precos: [],
  consultadoEm: "2026-10-01",
  ...o,
});
const preco = (centavos: number) => [{ tipo: "padrao" as const, centavos }];

describe("compararPrecos", () => {
  it("sempre devolve as 3 lojas; ausente = nao-encontrado", () => {
    const c = compararPrecos([oferta({ lojaId: "dental-cremer", apresentacaoId: "a", precos: preco(1000) })], "a");
    expect(c.linhas.map((l) => l.lojaId)).toEqual(["dental-cremer", "dental-med-sul", "dental-speed"]);
    expect(c.linhas[2].status).toBe("nao-encontrado");
    expect(c.comparavel).toBe(false);
    expect(c.economiaCentavos).toBeUndefined();
  });

  it("nunca compara apresentações diferentes", () => {
    const ofertas = [
      oferta({ lojaId: "dental-cremer", apresentacaoId: "frasco-5ml", precos: preco(15000) }),
      oferta({ lojaId: "dental-speed", apresentacaoId: "frasco-3ml", precos: preco(9000) }),
    ];
    expect(compararPrecos(ofertas, "frasco-5ml").comparavel).toBe(false);
    expect(compararPrecos(ofertas, "frasco-3ml").comparavel).toBe(false);
  });

  it("marca menor preço (empates inclusive) e calcula economia em centavos", () => {
    const c = compararPrecos(
      [
        oferta({ lojaId: "dental-cremer", apresentacaoId: "a", precos: preco(8990) }),
        oferta({ lojaId: "dental-speed", apresentacaoId: "a", precos: preco(7990) }),
        oferta({ lojaId: "dental-med-sul", apresentacaoId: "a", precos: preco(7990) }),
      ],
      "a",
    );
    // ordenado por preço; empate desempata por nome
    expect(c.linhas.map((l) => [l.lojaId, l.menorPreco])).toEqual([
      ["dental-med-sul", true],
      ["dental-speed", true],
      ["dental-cremer", false],
    ]);
    expect(c.economiaCentavos).toBe(1000);
  });

  it("preço Pix não entra na comparação", () => {
    const c = compararPrecos(
      [
        oferta({ lojaId: "dental-cremer", apresentacaoId: "a", precos: [...preco(10000), { tipo: "pix", centavos: 5000 }] }),
        oferta({ lojaId: "dental-speed", apresentacaoId: "a", precos: preco(9000) }),
      ],
      "a",
    );
    expect(c.menorCentavos).toBe(9000);
    expect(c.linhas.find((l) => l.lojaId === "dental-cremer")?.pixCentavos).toBe(5000);
  });

  it("preços iguais: comparável, sem economia", () => {
    const c = compararPrecos(
      [
        oferta({ lojaId: "dental-cremer", apresentacaoId: "a", precos: preco(5000) }),
        oferta({ lojaId: "dental-speed", apresentacaoId: "a", precos: preco(5000) }),
      ],
      "a",
    );
    expect(c.comparavel).toBe(true);
    expect(c.economiaCentavos).toBeUndefined();
  });

  it("indisponível não tem preço nem conta para comparação", () => {
    const c = compararPrecos(
      [
        oferta({ lojaId: "dental-cremer", apresentacaoId: "a", status: "indisponivel" }),
        oferta({ lojaId: "dental-speed", apresentacaoId: "a", precos: preco(5000) }),
      ],
      "a",
    );
    expect(c.linhas.find((l) => l.lojaId === "dental-cremer")).toMatchObject({ status: "indisponivel", centavos: undefined });
    expect(c.comparavel).toBe(false);
  });
});

describe("maioresEconomias", () => {
  it("ordena por economia e ignora produtos sem comparação", () => {
    const m = maioresEconomias(
      new Map([
        ["p1", [oferta({ lojaId: "dental-cremer", apresentacaoId: "a", precos: preco(1000) })]],
        [
          "p2",
          [
            oferta({ lojaId: "dental-cremer", apresentacaoId: "a", precos: preco(1000) }),
            oferta({ lojaId: "dental-speed", apresentacaoId: "a", precos: preco(1500) }),
          ],
        ],
      ]),
    );
    expect(m.map((x) => x.produtoId)).toEqual(["p2"]);
    expect(m[0].comparacao.economiaCentavos).toBe(500);
  });
});

describe("apresentacaoParaComparar", () => {
  it("prefere a principal; senão a com mais preços", () => {
    const ofertas = [
      oferta({ lojaId: "dental-cremer", apresentacaoId: "b", precos: preco(1) }),
      oferta({ lojaId: "dental-cremer", apresentacaoId: "c", precos: preco(1) }),
      oferta({ lojaId: "dental-speed", apresentacaoId: "c", precos: preco(1) }),
    ];
    expect(apresentacaoParaComparar(ofertas, "b")).toBe("b");
    expect(apresentacaoParaComparar(ofertas, "a")).toBe("c");
    expect(apresentacaoParaComparar([], "a")).toBeUndefined();
  });
});
