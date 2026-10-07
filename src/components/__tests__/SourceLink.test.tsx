// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModoDeUso } from "../produto/ModoDeUso";
import { SourceLink } from "../SourceLink";
import type { FonteDTO, ProtocoloDTO } from "../tipos";

const ifu: FonteDTO = {
  id: "ifu",
  tipo: "ifu",
  titulo: "IFU fictícia",
  url: "https://example.com/ifu.pdf",
  acessadoEm: "2026-10-01",
  versao: "rev. 2",
  observacao: "Texto adaptado de PT-PT; valores intactos.",
};

describe("<SourceLink> (DESIGN §3.5)", () => {
  it("título, versão, data DD/MM/AAAA, nova aba e observação da fonte", () => {
    render(<SourceLink fontes={[ifu]} />);
    const link = screen.getByRole("link", { name: /IFU fictícia \(rev\. 2\)/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("data-fonte-tipo", "ifu");
    expect(link.closest("li")).toHaveTextContent("acesso em 01/10/2026");
    expect(screen.getByTestId("source-note")).toHaveTextContent("Texto adaptado de PT-PT; valores intactos.");
  });

  it("sem observação não renderiza nota vazia", () => {
    render(<SourceLink fontes={[{ ...ifu, observacao: undefined }]} />);
    expect(screen.queryByTestId("source-note")).toBeNull();
  });
});

describe("observação da IFU no Modo de Uso", () => {
  const protocolo: ProtocoloDTO = {
    id: "p",
    titulo: "Protocolo",
    aplicaA: ["convencional-2-passos"],
    etapas: [{ tipo: "condicionamento-acido", titulo: "Condicionamento", descricao: "Texto.", parametros: [] }],
    observacoes: [],
    fontes: [ifu],
    divergencias: [],
  };

  it("aparece junto do 'Ver IFU original', porque o texto das etapas pode não ser literal", () => {
    render(<ModoDeUso fabricante="Fabricante" protocolos={[protocolo]} subcategoriaFixa="convencional-2-passos" />);
    const verIfu = screen.getByRole("link", { name: /Ver IFU original/ });
    const nota = screen.getAllByTestId("source-note")[0];
    expect(nota).toHaveTextContent("Texto adaptado de PT-PT; valores intactos.");
    // a nota vem logo depois do parágrafo com o link
    expect(verIfu.closest("p")!.nextElementSibling).toBe(nota);
  });
});
