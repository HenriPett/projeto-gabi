import { expect, it } from "vitest";
import { buscar, normalizar, type ItemBusca } from "./busca";

const item = (id: string, texto: string): ItemBusca => ({ id, nome: id, fabricante: "", texto: normalizar(texto) });
const itens = [item("pb", "Prime&Bond 2.1 Dentsply Convencionais 2 passos"), item("x", "Adesivo Universal MDP Kuraray")];

it("ignora acento, caixa e &", () => {
  expect(normalizar("Ácido & Primer")).toBe("acido primer");
  expect(buscar(itens, "prime bond").map((i) => i.id)).toEqual(["pb"]);
  expect(buscar(itens, "primebond").map((i) => i.id)).toEqual(["pb"]);
  expect(buscar(itens, "mdp").map((i) => i.id)).toEqual(["x"]);
  expect(buscar(itens, "2 passos").map((i) => i.id)).toEqual(["pb"]);
  expect(buscar(itens, "  ")).toEqual([]);
});
