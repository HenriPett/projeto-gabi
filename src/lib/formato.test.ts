import { expect, it } from "vitest";
import { formatarBRL, formatarData } from "./formato";

it("formata BRL a partir de centavos", () => {
  expect(formatarBRL(8990).replace(/\s/g, " ")).toBe("R$ 89,90");
});
it("formata data ISO como DD/MM/AAAA", () => {
  expect(formatarData("2026-01-05")).toBe("05/01/2026");
});
