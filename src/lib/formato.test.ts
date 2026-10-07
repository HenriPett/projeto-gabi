import { expect, it } from "vitest";
import { citacaoCurta, formatarBRL, formatarData, formatarVolume, semQuebrarHifen } from "./formato";

it("formata BRL a partir de centavos", () => {
  expect(formatarBRL(8990).replace(/\s/g, " ")).toBe("R$ 89,90");
});
it("formata data ISO como DD/MM/AAAA", () => {
  expect(formatarData("2026-01-05")).toBe("05/01/2026");
});

it("formata volume/massa da apresentação em pt-BR", () => {
  const base = { tipo: "frasco", descricao: "Frasco", quantidade: 1 };
  expect(formatarVolume({ ...base, volumeMl: 5 })).toBe("5 mL");
  expect(formatarVolume({ ...base, volumeMl: 2.5 })).toBe("2,5 mL");
  expect(formatarVolume({ ...base, massaG: 3 })).toBe("3 g");
  expect(formatarVolume({ ...base, tipo: "unidose", quantidade: 50, volumeMl: 0.1 })).toBe("50 × 0,1 mL");
  // kit: descrição do fabricante (nunca a soma dos frascos)
  expect(formatarVolume({ tipo: "kit", descricao: "Kit: primer 6 mL + adesivo 5 mL", quantidade: 1, volumeMl: 11 })).toBe(
    "Kit: primer 6 mL + adesivo 5 mL",
  );
  expect(formatarVolume({ ...base, descricao: "Frasco (volume não informado)" })).toBe("Frasco (volume não informado)");
});

it("hífen inseparável só em termos técnicos (número, sigla)", () => {
  const nb = "\u2011";
  expect(semQuebrarHifen("10-MDP e 4-MET em 1-2 passos; Bis-GMA")).toBe(`10${nb}MDP e 4${nb}MET em 1${nb}2 passos; Bis${nb}GMA`);
  expect(semQuebrarHifen("di-hidrogenofosfato, etch-and-rinse")).toBe("di-hidrogenofosfato, etch-and-rinse");
});

it("citação curta: sobrenome do 1º autor + ano", () => {
  expect(citacaoCurta("Perdigão J. Current perspectives on dental adhesion: (1) Dentin adhesion. Jpn Dent Sci Rev. 2020;56(1):190-207.")).toBe("Perdigão 2020");
  expect(citacaoCurta("Silva e Souza Jr. MH, Carneiro KGK, Lobato MF. Adhesive systems. J Appl Oral Sci. 2010;18(3):207-214.")).toBe("Silva e Souza Jr. 2010");
  expect(citacaoCurta("Kanca J 3rd. Improving bond strength through acid etching. Quintessence Int. 1992;23(1):39-41.")).toBe("Kanca 1992");
  expect(citacaoCurta("Tjäderhane L, Nascimento FD, et al. Strategies. Dent Mater. 2013;29(1):116-35.")).toBe("Tjäderhane 2013");
  expect(citacaoCurta("IFU fictícia")).toBe("IFU fictícia");
});
