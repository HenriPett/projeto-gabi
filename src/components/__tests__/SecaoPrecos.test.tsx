// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { comparacoes } from "./catalogo-fixture";
import { SecaoPrecos } from "../produto/SecaoPrecos";

const linhas = () => screen.getAllByTestId("price-row");

describe("<SecaoPrecos> (DESIGN §4.7, PLANO §3)", () => {
  it("PR-01/14: 3 preços — menor primeiro, selo com texto, economia exata e data por loja", () => {
    render(<SecaoPrecos comparacoes={comparacoes("ficticio-ambar")} />);
    const [primeira, ...resto] = linhas();
    expect(primeira).toHaveAttribute("data-loja", "dental-cremer");
    expect(primeira).toHaveAttribute("data-menor-preco", "true");
    expect(within(primeira).getByTestId("best-price-badge")).toHaveTextContent("MENOR PREÇO");
    expect(resto.every((l) => l.getAttribute("data-menor-preco") === "false")).toBe(true);
    expect(screen.getByTestId("savings-text")).toHaveTextContent("Você economiza R$ 30,45 em relação ao maior preço encontrado.");
    expect(within(primeira).getByTestId("price-updated-at")).toHaveTextContent("Última atualização: 06/10/2026");
    expect(screen.getByRole("link", { name: /Comprar na Dental Cremer/ })).toHaveAttribute("rel", "noopener sponsored");
  });

  it("PR-10: empate — todas as empatadas recebem o selo", () => {
    render(<SecaoPrecos comparacoes={comparacoes("ficticio-single-bond-2")} />);
    expect(screen.getAllByTestId("best-price-badge")).toHaveLength(2);
    expect(screen.getByTestId("savings-text")).toHaveTextContent("R$ 20,00");
  });

  it("PR-11: preços iguais — sem frase de economia, avisa mesmo preço", () => {
    render(<SecaoPrecos comparacoes={comparacoes("ficticio-tudo-em-um")} />);
    expect(screen.queryByTestId("savings-text")).toBeNull();
    expect(screen.getByText("Mesmo preço nas lojas comparadas.")).toBeTruthy();
  });

  it("PR-07/08: um só preço — 3 linhas, sem selo, sem economia, sem botão na loja sem preço", () => {
    render(<SecaoPrecos comparacoes={comparacoes("ficticio-prime-bond-2-1")} />);
    expect(linhas()).toHaveLength(3);
    expect(screen.queryByTestId("best-price-badge")).toBeNull();
    expect(screen.queryByTestId("savings-text")).toBeNull();
    expect(screen.getAllByTestId("btn-comprar")).toHaveLength(1);
    expect(screen.getAllByText("Não encontrado / indisponível")).toHaveLength(2);
  });

  it("PR-09: nenhum preço — nunca R$ 0,00", () => {
    const { container } = render(<SecaoPrecos comparacoes={comparacoes("ficticio-multiuso-3p")} />);
    expect(container.textContent).not.toMatch(/R\$\s*0,00/);
    expect(screen.queryAllByTestId("btn-comprar")).toHaveLength(0);
  });

  it("PR-02: apresentações diferentes — sem ranking, selo nem economia", () => {
    render(<SecaoPrecos comparacoes={comparacoes("ficticio-universal-triplo")} />);
    expect(screen.getByTestId("presentations-differ")).toHaveTextContent("Apresentações diferentes — comparação de preço não disponível.");
    expect(screen.queryByTestId("best-price-badge")).toBeNull();
    expect(screen.queryByTestId("savings-text")).toBeNull();
    expect(screen.queryByTestId("presentation-selector")).toBeNull();
    // as 3 lojas aparecem
    expect(new Set(linhas().map((l) => l.dataset.loja))).toEqual(new Set(["dental-cremer", "dental-speed", "dental-med-sul"]));
  });

  it("PR-06: kit comparado entre 2 lojas; refil isolado fora do selo; seletor troca a apresentação", async () => {
    render(<SecaoPrecos comparacoes={comparacoes("ficticio-dois-frascos")} />);
    expect(screen.getByTestId("savings-text")).toHaveTextContent("R$ 30,00");
    const outras = screen.getByText("Outras apresentações (não comparadas)").closest("div")!;
    expect(outras).toHaveTextContent("Dental Speed");
    const seletor = screen.getByTestId("presentation-selector");
    const radios = within(seletor).getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    await userEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByTestId("best-price-badge")).toBeNull();
  });

  it("offline: mostra aviso com a data dos preços", () => {
    const original = Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    try {
      render(<SecaoPrecos comparacoes={comparacoes("ficticio-ambar")} />);
      expect(screen.getByTestId("offline-banner")).toHaveTextContent("Você está offline — preços de 06/10/2026 podem estar desatualizados.");
    } finally {
      if (original) Object.defineProperty(Navigator.prototype, "onLine", original);
    }
  });

  it("produto sem nenhuma oferta: estado vazio explícito", () => {
    render(<SecaoPrecos comparacoes={[]} />);
    expect(screen.getByText("Nenhuma das três lojas tem este produto disponível no momento.")).toBeTruthy();
  });
});
