// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SUBCATEGORIAS } from "@/lib/esquema/taxonomia";
import { StepDiagram } from "../StepDiagram";

describe("<StepDiagram> (DESIGN §3.7, PLANO C-01)", () => {
  it.each([
    ["convencional-2-passos", "acido,primer+adesivo", /1\. ácido, em frasco separado; 2\. primer e adesivo no mesmo frasco/],
    ["convencional-3-passos", "acido,primer,adesivo", /1\. ácido.*2\. primer; 3\. adesivo/],
    ["autocondicionante-1-passo", "tudo-em-um", /ácido, primer e adesivo em um único frasco/],
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

  it("universais: três caminhos com o atual destacado e ácido só em esmalte no seletivo", () => {
    const { container } = render(<StepDiagram subcategoria="universal-condicionamento-seletivo" />);
    expect(container.querySelectorAll(".path")).toHaveLength(3);
    expect(container.querySelector(".path.is-current")).toHaveTextContent("Seletivo");
    expect(container.querySelector(".path.is-current")).toHaveTextContent("só em esmalte");
  });
});
