// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cat } from "./catalogo-fixture";
import { ColaCategorias } from "../guia/ColaCategorias";
import { agruparPorLetra, filtrarTermos, Glossario, tituloDoTermo, type TermoDTO } from "../guia/Glossario";
import { Trilha } from "../guia/Trilha";

const t = (id: string, termo: string, extra: Partial<TermoDTO> = {}): TermoDTO => ({
  id, termo, sinonimos: [], definicao: "Definição.", fontes: [], artigos: [], relacionados: [], ...extra,
});
const termos = [
  t("smear", "Smear layer", { sinonimos: ["lama dentinária"] }),
  t("mdp", "MDP", { sigla: "MDP", nomeCompleto: "10-metacriloiloxidecil di-hidrogenofosfato", relacionados: [{ id: "hema", termo: "HEMA" }] }),
  t("hema", "HEMA", { sigla: "HEMA" }),
  t("acido", "Ácido fosfórico"),
];

describe("glossário (DESIGN §4.9 ③)", () => {
  it("agrupa por letra em ordem alfabética pt-BR (Á junto de A)", () => {
    expect(agruparPorLetra(termos).map((g) => [g.letra, g.itens.map((i) => i.id)])).toEqual([
      ["A", ["acido"]], ["H", ["hema"]], ["M", ["mdp"]], ["S", ["smear"]],
    ]);
  });

  it("título: sigla — extenso; sem extenso diferente, só o termo (nada de 'Bis-GMA — Bis-GMA')", () => {
    expect(tituloDoTermo({ termo: "MDP", sigla: "MDP", nomeCompleto: "10-MDP completo" })).toBe("MDP — 10-MDP completo");
    expect(tituloDoTermo({ termo: "Bis-GMA", sigla: "Bis-GMA" })).toBe("Bis-GMA");
    expect(tituloDoTermo({ termo: "Smear layer" })).toBe("Smear layer");
  });

  it("filtra por termo, sigla, nome completo e sinônimo, sem acento nem caixa", () => {
    expect(filtrarTermos(termos, "LAMA DENTINARIA").map((x) => x.id)).toEqual(["smear"]);
    expect(filtrarTermos(termos, "metacriloiloxidecil").map((x) => x.id)).toEqual(["mdp"]);
    expect(filtrarTermos(termos, "acido").map((x) => x.id)).toEqual(["acido"]);
  });

  it("article#termo-{id}, h3 com sigla — nome completo, chips de relacionados e A–Z para #letra-{x}", () => {
    render(<Glossario termos={termos} />);
    const mdp = document.getElementById("termo-mdp")!;
    expect(mdp.tagName).toBe("ARTICLE");
    expect(within(mdp).getByRole("heading", { level: 3 })).toHaveTextContent("MDP — 10\u2011metacriloiloxidecil di-hidrogenofosfato"); // hífen inseparável após número
    expect(within(mdp).getByRole("link", { name: "HEMA" })).toHaveAttribute("href", "/guia#termo-hema");
    expect(screen.getByRole("link", { name: "S" })).toHaveAttribute("href", "#letra-s");
    expect(document.getElementById("letra-s")).not.toBeNull();
    expect(screen.getByText("4 termos")).toBeTruthy();
  });

  it("filtro sem resultado avisa; o termo-alvo da âncora nunca some", () => {
    window.history.replaceState(null, "", "/guia#termo-hema");
    render(<Glossario termos={termos} />);
    act(() => void window.dispatchEvent(new HashChangeEvent("hashchange")));
    fireEvent.change(screen.getByRole("searchbox", { name: "Filtrar termos" }), { target: { value: "smear" } });
    expect(document.getElementById("termo-smear")).not.toBeNull();
    expect(document.getElementById("termo-hema")).not.toBeNull(); // alvo preservado
    expect(document.getElementById("termo-mdp")).toBeNull();
    window.history.replaceState(null, "", "/guia");
    act(() => void window.dispatchEvent(new HashChangeEvent("hashchange")));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    expect(screen.getByText("Nenhum termo para “zzz”.")).toBeTruthy();
  });
});

describe("trilha e cola", () => {
  it("trilha segue a ordem dos artigos: só número + título (sem repetir o resumo dos cartões)", () => {
    const artigos = cat.guia["sistemas-adesivos"] ?? [];
    render(<Trilha artigos={artigos} />);
    const itens = screen.getAllByRole("listitem");
    expect(itens.map((i) => i.dataset.slug)).toEqual(artigos.map((a) => a.slug));
    expect(itens[0]).toHaveTextContent(`1${artigos[0].titulo}`);
    expect(itens[0]).not.toHaveTextContent(artigos[0].resumo);
  });

  it("cola: 7 linhas, passos da taxonomia, '—' com nome acessível quando não há produto", () => {
    render(<ColaCategorias produtos={cat.produtos} />);
    const tabela = screen.getByRole("table", { name: "Cola das 7 categorias" });
    const linhas = within(tabela).getAllByRole("row").filter((r) => r.classList.contains("cola__linha"));
    expect(linhas).toHaveLength(7);
    const conv3 = linhas.find((l) => within(l).queryByRole("link", { name: "3 passos" }) && l.textContent!.includes("Ác + P + Ad"))!;
    expect(conv3).toHaveTextContent("3");
    expect(within(tabela).getAllByRole("rowheader").length).toBeGreaterThanOrEqual(7);
  });

  it("cola sem produtos publicados: '—' com aria-label, nunca 0", () => {
    const { container } = render(<ColaCategorias produtos={[]} />);
    expect(container.querySelectorAll('[aria-label="nenhum produto"]')).toHaveLength(7);
  });
});
