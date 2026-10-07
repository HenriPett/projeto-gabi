// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cat } from "./catalogo-fixture";
import { CartoesGuia, cartoesDoGuia, TOPICOS_GUIA } from "../guia/CartoesGuia";
import { referenciasNumeradas } from "../guia/referencias";

const artigos = cat.guia["sistemas-adesivos"] ?? [];

describe("Guia rápido", () => {
  it("fixture: só o artigo publicado é visível (rascunho some com INCLUIR_RASCUNHOS=0)", () => {
    expect(artigos.map((a) => a.slug)).toEqual(["exemplo-publicado"]);
  });

  it("cards: artigo existente vira link; temas da spec sem artigo ficam 'Em preparação', não interativos", () => {
    render(<CartoesGuia artigos={artigos} />);
    expect(screen.getByRole("link", { name: /Artigo fictício publicado/ })).toHaveAttribute("href", "/guia/exemplo-publicado");
    const pendentes = screen.getAllByTestId("guia-card").filter((c) => c.dataset.pendente === "true");
    expect(pendentes).toHaveLength(TOPICOS_GUIA.length);
    pendentes.forEach((c) => {
      expect(c.tagName).not.toBe("A");
      expect(c).toHaveTextContent("Em preparação");
    });
  });

  it("tema da spec com artigo publicado não aparece duplicado como pendente", () => {
    const comMdp = [{ ...artigos[0], slug: "mdp", titulo: "O que é MDP?" }];
    const cards = cartoesDoGuia(comMdp);
    expect(cards.filter((c) => c.slug === "mdp")).toEqual([expect.objectContaining({ artigo: true })]);
    expect(cards).toHaveLength(TOPICOS_GUIA.length);
  });

  it("referências numeradas pela ordem da primeira citação", () => {
    const { numero, referencias } = referenciasNumeradas({
      secoes: [{ paragrafos: [{ texto: "a", fontes: ["b"] }, { texto: "c", fontes: ["a", "b"] }] }],
      fontes: [
        { id: "a", tipo: "literatura", titulo: "A", url: "https://doi.org/1", acessadoEm: "2026-10-01" },
        { id: "b", tipo: "literatura", titulo: "B", url: "https://doi.org/2", acessadoEm: "2026-10-01" },
        { id: "z", tipo: "literatura", titulo: "Z", url: "https://doi.org/3", acessadoEm: "2026-10-01" },
      ],
    });
    expect(referencias.map((f) => f.id)).toEqual(["b", "a", "z"]);
    expect([numero("b"), numero("a"), numero("z")]).toEqual([1, 2, 3]);
  });
});
