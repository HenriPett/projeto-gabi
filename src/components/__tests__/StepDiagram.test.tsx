// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SUBCATEGORIAS } from "@/lib/esquema/taxonomia";
import { StepDiagram } from "../StepDiagram";

describe("<StepDiagram> (DESIGN §3.7, PLANO C-01)", () => {
  it.each([
    ["convencional-2-passos", "acido,primer+adesivo", /1\. ácido fosfórico, aplicado separadamente; 2\. primer e adesivo no mesmo frasco/],
    ["convencional-3-passos", "acido,primer,adesivo", /1\. ácido.*2\. primer; 3\. adesivo/],
    ["autocondicionante-1-passo", "tudo-em-um", /ácido, primer e adesivo em uma única aplicação.*sem condicionamento ácido separado/],
    ["autocondicionante-2-passos", "primer-autocondicionante,adesivo", /1\. primer autocondicionante; 2\. adesivo/],
    ["universal-autocondicionante", "adesivo-universal", /Exibindo autocondicionante/],
  ] as const)("%s: sequência e leitura acessível", (id, sequencia, leitura) => {
    render(<StepDiagram subcategoria={id} />);
    const fig = screen.getByTestId("step-diagram");
    expect(fig).toHaveAttribute("data-sequencia", sequencia);
    expect(fig.querySelector("figcaption")).toHaveTextContent(leitura);
    // blocos visuais escondidos do leitor de tela
    expect(fig.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("C-03: renderiza para as 7 subcategorias", () => {
    for (const id of SUBCATEGORIAS) {
      const { unmount } = render(<StepDiagram subcategoria={id} />);
      expect(screen.getByText("Como identificar?")).toBeTruthy();
      unmount();
    }
  });

  it("[R2] contador é 'passo N', nunca 'frasco N'; notação compacta e legenda", () => {
    const { container } = render(<StepDiagram subcategoria="convencional-3-passos" />);
    const contadores = [...container.querySelectorAll(".step__count")].map((e) => e.textContent);
    expect(contadores.join(" ")).toMatch(/passo 1.*passo 2.*passo 3/);
    expect(container.textContent).not.toMatch(/frasco \d/);
    expect(container.querySelector("[data-notacao]")).toHaveTextContent("Ác + P + Ad");
    expect(container.querySelector("[data-notacao]")).toHaveAttribute("aria-hidden", "true");
    expect(container.textContent).toContain("Ác = ácido fosfórico");
  });

  it("[R2] autocondicionantes abrem com o bloco fantasma riscado, que não conta como passo", () => {
    const { container } = render(<StepDiagram subcategoria="autocondicionante-2-passos" />);
    expect(container.querySelector(".step-ghost")).toHaveTextContent("Ácido fosfórico separadonão usa");
    expect(container.querySelector(".step-ghost s")).toBeTruthy();
    expect(container.querySelectorAll(".step__count")).toHaveLength(2);
    expect(container.querySelector("[data-notacao] sub")).toHaveTextContent("ac");
    const { container: conv } = render(<StepDiagram subcategoria="convencional-2-passos" />);
    expect(conv.querySelector(".step-ghost")).toBeNull();
  });

  it("[R2] substrato: convencional condiciona esmalte + dentina; universais distinguem os 3 caminhos", () => {
    const { container: conv } = render(<StepDiagram subcategoria="convencional-2-passos" />);
    expect(conv.querySelector("[data-substrato]")).toHaveAttribute("data-substrato", "esmalte-e-dentina");
    const { container } = render(<StepDiagram subcategoria="universal-condicionamento-total" />);
    expect([...container.querySelectorAll(".path > [data-substrato]")].map((e) => e.getAttribute("data-substrato"))).toEqual([
      "esmalte",
      "esmalte-e-dentina",
      "nenhum",
    ]);
  });

  it("universais: três caminhos com o atual destacado e ácido só em esmalte no seletivo", () => {
    const { container } = render(<StepDiagram subcategoria="universal-condicionamento-seletivo" />);
    expect(container.querySelectorAll(".path")).toHaveLength(3);
    expect(container.querySelector(".path.is-current")).toHaveTextContent("Seletivo");
    expect(container.querySelector(".path.is-current")).toHaveTextContent("só em esmalte");
  });
});
