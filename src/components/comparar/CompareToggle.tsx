"use client";

import { alternarComparar, useSelecaoComparar } from "./selecao";

/** Toggle ⊕/✓ "Comparar" — DESIGN §3.8 item 3. */
export function CompareToggle({ id, nome, variante = "redondo" }: { id: string; nome: string; variante?: "redondo" | "caixa" }) {
  const selecionado = useSelecaoComparar().includes(id);
  return (
    <button
      type="button"
      className={`cmp-toggle${variante === "caixa" ? " cmp-toggle--box" : ""}`}
      aria-pressed={selecionado}
      aria-label={selecionado ? `Remover ${nome} da comparação` : `Adicionar ${nome} à comparação`}
      data-testid="compare-toggle"
      data-produto-id={id}
      onClick={() => alternarComparar(id)}
    >
      <span aria-hidden="true">{selecionado ? "✓" : "+"}</span>
    </button>
  );
}
