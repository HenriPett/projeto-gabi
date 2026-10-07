// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { card } from "./catalogo-fixture";
import { ProductCard } from "../ProductCard";
import { LIMITE_COMPARACAO } from "../comparar/selecao";

describe("<ProductCard> (DESIGN §3.8)", () => {
  it("P-01: nome (link), fabricante, apresentação, ações e preço a partir de", () => {
    render(<ProductCard card={card("ficticio-ambar")} />);
    const c = screen.getByTestId("product-card");
    expect(within(c).getByRole("heading", { name: "Âmbar Fictício" })).toBeTruthy();
    expect(within(c).getByTestId("btn-ver-produto")).toHaveAttribute("href", "/produto/ficticio-ambar");
    expect(within(c).getByTestId("btn-comparar-precos")).toHaveAttribute("href", "/produto/ficticio-ambar#precos");
    expect(c).toHaveTextContent("a partir de R$ 89,90");
    expect(c).toHaveTextContent("Frasco · 4 mL");
  });

  it("sem preço → 'Preço não encontrado'", () => {
    render(<ProductCard card={card("ficticio-multiuso-3p")} />);
    expect(screen.getByText("Preço não encontrado")).toBeTruthy();
  });

  it("P-04: sem componentes → não informado (nunca vazio)", () => {
    render(<ProductCard card={{ ...card("ficticio-ambar"), componentes: [] }} />);
    expect(screen.getByText("Componentes: informação ainda não verificada")).toBeTruthy();
  });

  it("U-03: universal mostra as 3 estratégias, com a atual marcada, e leva ?estrategia=", () => {
    render(<ProductCard card={card("exemplo-universal")} subcategoriaAtual="universal-condicionamento-total" />);
    const chips = screen.getByTestId("strategy-badges");
    expect(chips).toHaveAttribute("data-estrategias", "universal-condicionamento-total,universal-autocondicionante");
    expect(within(chips).getByLabelText("Não indicado para condicionamento seletivo")).toBeTruthy();
    expect(chips.querySelector(".cur")).toHaveAccessibleName("Indicado para condicionamento total");
    expect(screen.getByTestId("btn-ver-produto")).toHaveAttribute("href", "/produto/exemplo-universal?estrategia=condicionamento-total");
  });

  it("toggle Comparar alterna aria-pressed e respeita o limite (CS-03)", async () => {
    const ids = ["a", "b", "c", "d"];
    localStorage.setItem("sa:comparar", JSON.stringify(ids.slice(0, LIMITE_COMPARACAO)));
    let aviso = "";
    window.addEventListener("sa:aviso", (e) => (aviso = (e as CustomEvent<string>).detail), { once: true });
    render(<ProductCard card={card("ficticio-ambar")} />);
    const t = screen.getByTestId("compare-toggle");
    await userEvent.click(t);
    expect(t).toHaveAttribute("aria-pressed", "false");
    expect(aviso).toBe("Limite de 4 produtos na comparação");
    localStorage.setItem("sa:comparar", "[]");
    window.dispatchEvent(new Event("sa:comparar"));
    await userEvent.click(t);
    expect(t).toHaveAttribute("aria-pressed", "true");
    expect(t).toHaveAccessibleName("Remover Âmbar Fictício da comparação");
  });
});

describe("selo curto no card (revisão de fidelidade 4)", () => {
  it("mostra 'Conv. · 2 passos' e mantém o nome completo para leitor de tela", () => {
    render(<ProductCard card={card("ficticio-ambar")} />);
    const selo = screen.getAllByText("Conv. · 2 passos")[0].closest(".badge")!;
    expect(selo).toHaveTextContent("Convencional, 2 passos");
    expect(selo).toHaveAttribute("title", "Convencional, 2 passos");
  });
});

describe("preço no card (BUG-012)", () => {
  it("'a partir de' só com apresentação comparável; senão diz o motivo", () => {
    expect(card("ficticio-ambar").preco).toMatchObject({ tipo: "comparavel", centavos: 8990 });
    expect(card("ficticio-universal-triplo").preco).toEqual({ tipo: "apresentacoes-diferentes" });
    expect(card("ficticio-prime-bond-2-1").preco).toMatchObject({ tipo: "uma-loja" });
    render(<ProductCard card={card("ficticio-universal-triplo")} />);
    expect(screen.getByText("Preços em apresentações diferentes")).toBeTruthy();
    expect(screen.queryByText(/a partir de/)).toBeNull();
  });
});
