// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cat, coluna, indice } from "./catalogo-fixture";
import { idsDaUrl, linhaIgual, montarLinhas } from "../comparar/linhas";

let busca = new URLSearchParams();
let pathname = "/comparar";
const replace = vi.fn((url: string) => {
  busca = new URLSearchParams(url.split("?")[1] ?? "");
});
vi.mock("next/navigation", () => ({
  useSearchParams: () => busca,
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => pathname,
}));
const { Comparador } = await import("../comparar/Comparador");
const { CompareTray } = await import("../comparar/CompareTray");

const colunas = () => cat.produtos.map((p) => coluna(p.id));

describe("linhas do comparador (DESIGN §4.6, PLANO CS-01/02)", () => {
  it("CS-01: as 13 linhas pedidas + menor preço, na ordem dos grupos", () => {
    const l = montarLinhas([coluna("ficticio-ambar"), coluna("ficticio-tudo-em-um")]);
    expect(l.map((x) => x.rotulo)).toEqual([
      "Classificação", "Estratégia", "Número de passos", "Condicionamento", "Primer", "Adesivo",
      "MDP", "HEMA", "Silano", "Solvente", "Fotopolimerização", "Volume", "Fabricante", "Menor preço",
    ]);
  });

  it("número de passos e etapas derivados da taxonomia; universal por estratégia", () => {
    const [classe, , passos, cond, primer] = montarLinhas([coluna("ficticio-ambar"), coluna("exemplo-universal")]);
    expect(classe.celulas[0]).toEqual({ tipo: "texto", texto: "Convencional" });
    expect(passos.celulas[0]).toEqual({ tipo: "texto", texto: "2 passos" });
    expect(passos.celulas[1]).toEqual({ tipo: "texto", texto: "Total: 2 passos · Autocond.: 1 passo" });
    expect(cond.celulas[1]).toEqual({ tipo: "texto", texto: "Total: Ácido em frasco separado · Autocond.: Sem ácido separado" });
    expect(primer.celulas[0]).toEqual({ tipo: "texto", texto: "Junto com o adesivo" });
  });

  it("CS-02: Sim / Não / Não informado são distintos; divergência ligada à célula", () => {
    const linhas = montarLinhas([coluna("exemplo-universal"), coluna("ficticio-ambar")]);
    const hema = linhas.find((l) => l.atributo === "hema")!;
    expect(hema.celulas[0]).toEqual({ tipo: "simnao", valor: "nao-informado" });
    expect(hema.divergencias[0][0].campo).toBe("composicao.hema");
    expect(linhaIgual(linhas.find((l) => l.atributo === "fabricante")!)).toBe(false);
  });

  it("CS-04/06: ids da URL deduplicados, inválidos ignorados, limite 4", () => {
    const validos = new Set(["a", "b", "c", "d", "e"]);
    expect(idsDaUrl("a,a,b,zzz", validos)).toEqual({ ids: ["a", "b"], invalidos: ["zzz"], excedente: false });
    expect(idsDaUrl("a,b,c,d,e", validos).excedente).toBe(true);
    expect(idsDaUrl(null, validos).ids).toEqual([]);
  });
});

describe("<Comparador>", () => {
  beforeEach(() => {
    replace.mockClear();
    busca = new URLSearchParams();
  });

  it("vazio: pede de 2 a 4 produtos", () => {
    render(<Comparador colunas={colunas()} indice={indice()} />);
    expect(screen.getByText("Selecione de 2 a 4 produtos para comparar.")).toBeTruthy();
  });

  it("tabela real com cabeçalhos de linha/coluna; remover atualiza a URL (CS-05)", async () => {
    busca = new URLSearchParams("ids=ficticio-ambar,ficticio-tudo-em-um,nao-existe");
    render(<Comparador colunas={colunas()} indice={indice()} />);
    const tabela = screen.getByTestId("compare-table");
    expect(within(tabela.querySelector("thead")!).getAllByRole("columnheader").length).toBe(3);
    expect(within(tabela).getByRole("rowheader", { name: "MDP" })).toBeTruthy();
    expect(screen.getByText(/não existe mais e foi ignorado/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Remover Âmbar Fictício" }));
    expect(replace).toHaveBeenCalledWith("/comparar?ids=ficticio-tudo-em-um", { scroll: false });
  });

  it("'Destacar diferenças' marca linhas iguais como .same", async () => {
    busca = new URLSearchParams("ids=ficticio-ambar,ficticio-single-bond-2");
    render(<Comparador colunas={colunas()} indice={indice()} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Destacar diferenças" }));
    const linha = (a: string) => screen.getAllByTestId("compare-row").find((r) => r.dataset.atributo === a)!;
    expect(linha("classificacao")).toHaveClass("same");
    expect(linha("fabricante")).toHaveClass("diff");
  });
});

describe("<CompareTray> (DESIGN §3.9)", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("CS-03: com 1 produto o botão fica desabilitado com dica; com 2 vira link", async () => {
    localStorage.setItem("sa:comparar", JSON.stringify(["ficticio-ambar"]));
    const { rerender } = render(<CompareTray indice={indice()} />);
    expect(screen.getByTestId("compare-count")).toHaveTextContent("1 de 4");
    expect(screen.getByTestId("btn-comparar")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("btn-comparar")).toHaveTextContent("Selecione mais 1");
    localStorage.setItem("sa:comparar", JSON.stringify(["ficticio-ambar", "ficticio-tudo-em-um"]));
    window.dispatchEvent(new Event("sa:comparar"));
    rerender(<CompareTray indice={indice()} />);
    expect(await screen.findByRole("link", { name: "COMPARAR" })).toHaveAttribute("href", "/comparar?ids=ficticio-ambar,ficticio-tudo-em-um");
  });
});
