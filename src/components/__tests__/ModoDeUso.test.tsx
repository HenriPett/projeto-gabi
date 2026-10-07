// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { produto, telas } from "./catalogo-fixture";
import { EstrategiaProvider } from "../produto/estrategia";
import { ModoDeUso } from "../produto/ModoDeUso";
import { StrategySelector } from "../produto/StrategySelector";
import type { ProtocoloDTO } from "../tipos";

function protocolosDe(id: string): ProtocoloDTO[] {
  const p = produto(id);
  return p.protocolos.map((pr) => ({
    id: pr.id,
    titulo: pr.titulo,
    aplicaA: pr.aplicaA,
    etapas: pr.etapas.map((e) => ({ tipo: e.tipo, titulo: e.titulo, descricao: e.descricao, parametros: e.parametros })),
    observacoes: pr.observacoes.map((o) => o.texto),
    fontes: telas.fontesDe(p, pr.fontes),
    divergencias: telas.divergenciasDe(p, `protocolos.${pr.id}`),
  }));
}

function Universal({ id }: { id: string }) {
  const p = produto(id);
  return (
    <EstrategiaProvider indicadas={p.classificacao.subcategorias.map((s) => s.id)}>
      <StrategySelector />
      <ModoDeUso fabricante={p.fabricante.nome} protocolos={protocolosDe(id)} />
    </EstrategiaProvider>
  );
}

beforeEach(() => window.history.replaceState(null, "", "/produto/x"));

describe("Modo de Uso + seletor de estratégia (DESIGN §4.3, §4.5)", () => {
  it("M-01: etapas numeradas 01, 02… na ordem da IFU, com fonte IFU", () => {
    const p = produto("ficticio-ambar");
    render(<ModoDeUso fabricante={p.fabricante.nome} protocolos={protocolosDe("ficticio-ambar")} subcategoriaFixa="convencional-2-passos" />);
    const etapas = screen.getAllByTestId("protocol-step");
    expect(etapas.map((e) => e.dataset.step)).toEqual(etapas.map((_, i) => String(i + 1).padStart(2, "0")));
    expect(etapas[0]).toHaveTextContent(p.protocolos[0].etapas[0].titulo);
    expect(screen.getAllByTestId("source-link").some((a) => a.dataset.fonteTipo === "ifu")).toBe(true);
  });

  it("M-06: sem protocolo → aviso, nunca protocolo genérico", () => {
    render(<ModoDeUso fabricante="X" protocolos={[]} subcategoriaFixa="convencional-2-passos" />);
    expect(screen.getByText("Protocolo oficial não localizado")).toBeTruthy();
    expect(screen.queryByTestId("protocol-step")).toBeNull();
  });

  it("U-03/M-05: trocar a estratégia troca só o protocolo e atualiza a URL sem novo histórico", async () => {
    render(<Universal id="ficticio-universal-triplo" />);
    const radios = within(screen.getByRole("radiogroup")).getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    const antes = screen.getByTestId("protocol").dataset.protocoloId;
    const historico = window.history.length;
    await userEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("protocol").dataset.protocoloId).not.toBe(antes);
    expect(window.location.search).toBe("?estrategia=condicionamento-total");
    expect(window.history.length).toBe(historico);
  });

  it("UE-03: entrada por ?estrategia= abre o protocolo daquela estratégia", async () => {
    window.history.replaceState(null, "", "/produto/x?estrategia=autocondicionante");
    render(<Universal id="ficticio-universal-triplo" />);
    const radios = within(screen.getByRole("radiogroup")).getAllByRole("radio");
    expect(await screen.findByRole("radio", { checked: true })).toBe(radios[2]);
  });

  it("U-04: estratégia não indicada fica visível, desabilitada e as setas a pulam", async () => {
    render(<Universal id="exemplo-universal" />); // total + autocond., sem seletivo
    const [seletivo, total, auto] = within(screen.getByRole("radiogroup")).getAllByRole("radio");
    expect(seletivo).toHaveAttribute("aria-disabled", "true");
    expect(seletivo).toHaveAccessibleName("Condicionamento seletivo — não indicado");
    await userEvent.click(seletivo);
    expect(seletivo).toHaveAttribute("aria-checked", "false");
    total.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(auto).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(total).toHaveAttribute("aria-checked", "true");
  });
});
