import { expect, it } from "vitest";
import { formatarBRL, formatarData, formatarVolume } from "./formato";

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
