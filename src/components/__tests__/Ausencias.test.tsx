// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { coluna } from "./catalogo-fixture";
import { MidiaProduto, Miniatura } from "../MidiaProduto";
import { Galeria } from "../produto/Galeria";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("ids=exemplo-universal,ficticio-ambar"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/comparar",
}));
const { Comparador } = await import("../comparar/Comparador");

const img = { arquivo: "/img/produtos/x/frasco.webp", alt: "Frasco do X" };

describe("ausência de dado verificado", () => {
  it("comparador: 'nao-informado' vira 'Informação ainda não verificada', distinto de Sim/Não (CS-02)", () => {
    render(<Comparador colunas={[coluna("exemplo-universal"), coluna("ficticio-ambar")]} indice={[]} />);
    const hema = screen.getAllByTestId("compare-row").find((r) => r.dataset.atributo === "hema")!;
    expect(hema).toHaveTextContent("Informação ainda não verificada");
    const silano = screen.getAllByTestId("compare-row").find((r) => r.dataset.atributo === "silano")!;
    const [universal, ambar] = silano.querySelectorAll("td");
    expect(universal).toHaveTextContent("Não"); // fonte afirma que não tem
    expect(universal).not.toHaveTextContent("não verificada");
    expect(ambar).toHaveTextContent("Informação ainda não verificada");
  });
});

describe("placeholder de imagem (P-02)", () => {
  it("sem foto: silhueta neutra + 'Imagem ainda não disponível'", () => {
    const { container } = render(<MidiaProduto nome="X" fabricante="Y" sizes="96px" />);
    expect(container.querySelector("svg.bottle")).not.toBeNull();
    expect(screen.getByText("Imagem ainda não disponível")).toBeTruthy();
  });

  it("foto que falha ao carregar cai na silhueta (sem ícone quebrado)", () => {
    const { container } = render(<MidiaProduto imagem={img} nome="X" fabricante="Y" sizes="96px" />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Imagem ainda não disponível")).toBeTruthy();
    const m = render(<Miniatura imagem={img} sizes="32px" />);
    fireEvent.error(m.container.querySelector("img")!);
    expect(m.container.querySelector("svg.bottle")).not.toBeNull();
  });

  it("galeria do produto: falha na única foto → placeholder com nome acessível", () => {
    const { container } = render(<Galeria imagens={[img]} nome="X" fabricante="Y" />);
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByRole("img", { name: "Imagem ainda não disponível — X, Y" })).toBeTruthy();
  });
});
