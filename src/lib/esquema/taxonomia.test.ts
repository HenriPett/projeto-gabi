import { expect, it } from "vitest";
import { SUBCATEGORIA } from "./taxonomia";

it("ácido separado ⇔ substratoAcido definido; seletivo ≠ total", () => {
  for (const s of Object.values(SUBCATEGORIA)) {
    expect(s.substratoAcido !== null).toBe(s.condicionamentoAcidoSeparado === "sim");
  }
  expect(SUBCATEGORIA["universal-condicionamento-seletivo"].substratoAcido).toBe("esmalte");
  expect(SUBCATEGORIA["universal-condicionamento-total"].substratoAcido).toBe("esmalte-e-dentina");
});
