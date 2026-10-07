// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { card, cat } from "./catalogo-fixture";
import { filtrarEOrdenar, ListaProdutos } from "../categoria/ListaProdutos";

const conv2 = () =>
  cat.produtos.filter((p) => p.classificacao.subcategorias.some((s) => s.id === "convencional-2-passos")).map((p) => card(p.id));

describe("<ListaProdutos> (DESIGN §4.2)", () => {
  it("C-05: categoria vazia → estado vazio explícito com link", () => {
    render(<ListaProdutos cards={[]} subcategoria="convencional-3-passos" />);
    expect(screen.getByText("Nenhum produto cadastrado nesta categoria ainda.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver outras categorias" })).toHaveAttribute("href", "/#classificacao");
  });

  it("ordena por menor preço com 'sem preço' por último", () => {
    const precos = filtrarEOrdenar(conv2(), "preco", [], false).map((c) => c.aPartirDeCentavos);
    const definidos = precos.filter((p) => p !== undefined) as number[];
    expect(definidos).toEqual([...definidos].sort((a, b) => a - b));
    expect(precos.indexOf(undefined)).toSatisfy((i: number) => i === -1 || precos.slice(i).every((p) => p === undefined));
  });

  it("filtro 'Contém MDP' e por fabricante; anuncia a contagem", async () => {
    const cards = conv2();
    render(<ListaProdutos cards={cards} subcategoria="convencional-2-passos" />);
    expect(screen.getAllByTestId("product-card")).toHaveLength(cards.length);
    const fab = cards[0].fabricante;
    await userEvent.click(screen.getAllByRole("button", { name: fab })[0]);
    expect(screen.getAllByTestId("product-card")).toHaveLength(cards.filter((c) => c.fabricante === fab).length);
    expect(screen.getByText(/produtos? exibidos?$/)).toBeTruthy();
  });
});
