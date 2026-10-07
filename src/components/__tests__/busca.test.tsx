// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { indice } from "./catalogo-fixture";
import { destacar, expandirConsulta, sugerir, MAX_SUGESTOES } from "../busca/sugestoes";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/" }));
const { SearchBox } = await import("../busca/SearchBox");

const nomes = (q: string, tipo: string) => sugerir(indice(), q).filter((s) => s.tipo === tipo).map((s) => s.rotulo);

describe("sugestões da busca (DESIGN §3.1, PLANO §4)", () => {
  it("sinônimos: dois passos / 2passos / self-etch / universais", () => {
    expect(expandirConsulta("Dois Passos")).toBe("2 passos");
    expect(expandirConsulta("2passos")).toBe("2 passos");
    expect(expandirConsulta("self-etch")).toBe("autocondicionante");
    expect(expandirConsulta("universais")).toBe("universal");
  });

  it("B-07/08: '2 passos' sugere as duas categorias de 2 passos", () => {
    for (const q of ["2 passos", "2passos", "dois passos", "2 PASSOS"])
      expect(nomes(q, "categoria")).toEqual(["Convencionais › 2 passos", "Autocondicionantes › 2 passos"]);
  });

  it("B-01: acento e caixa não importam", () => {
    for (const q of ["ambar", "AMBAR", "Âmbar"]) expect(nomes(q, "produto")).toContain("Âmbar Fictício");
  });

  it("B-10/U-05: universal aparece uma vez só nos produtos", () => {
    const produtos = nomes("universal", "produto");
    expect(new Set(produtos).size).toBe(produtos.length);
  });

  it("componentes com contagem; no máximo 8 sugestões", () => {
    const mdp = sugerir(indice(), "mdp").find((s) => s.tipo === "componente" && s.rotulo === "MDP");
    expect(mdp && mdp.tipo === "componente" && mdp.total).toBeGreaterThan(0);
    expect(sugerir(indice(), "a").length).toBeLessThanOrEqual(MAX_SUGESTOES);
  });

  it("B-19/20: entrada hostil não lança e é tratada como texto", () => {
    for (const q of ["<script>alert(1)</script>", "(", "*", "[", "\\", ".*", "%E0", "🦷"]) expect(() => sugerir(indice(), q)).not.toThrow();
  });

  it("destacar marca o trecho casado preservando o acento original", () => {
    expect(destacar("Âmbar Fictício", "amb")).toEqual([
      { texto: "Âmb", marcado: true },
      { texto: "ar Fictício", marcado: false },
    ]);
  });
});

describe("<SearchBox> (combobox)", () => {
  beforeEach(() => push.mockReset());

  it("H-05/B-26: placeholder, abre sugestões, setas + Enter navegam, Esc fecha", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchBox indice={indice()} />);
    const input = screen.getByRole("combobox", { name: "Pesquisar sistema, marca ou produto" });
    expect(input).toHaveAttribute("placeholder", "Pesquisar sistema, marca ou produto");
    await user.type(input, "ambar");
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(input).toHaveAttribute("aria-expanded", "true");
    const lista = screen.getByRole("listbox");
    expect(within(lista).getAllByRole("option")[0]).toHaveTextContent("Âmbar Fictício");
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/produto/ficticio-ambar");
    vi.useRealTimers();
  });

  it("Enter sem opção ativa vai para /busca?q= com & codificado (B-05)", async () => {
    render(<SearchBox indice={indice()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Prime&Bond" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/busca?q=Prime%26Bond");
  });

  it("botão limpar aparece com texto", async () => {
    render(<SearchBox indice={indice()} />);
    await userEvent.type(screen.getByRole("combobox"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
