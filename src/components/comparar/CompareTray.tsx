"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconeComparar } from "../Icones";
import { Miniatura } from "../MidiaProduto";
import type { ItemIndice } from "../tipos";
import { LIMITE_COMPARACAO, removerDaComparacao, useSelecaoComparar } from "./selecao";

/** Barra fixa de comparação — DESIGN §3.9. */
export function CompareTray({ indice }: { indice: ItemIndice[] }) {
  const ids = useSelecaoComparar();
  const pathname = usePathname();
  const [aviso, setAviso] = useState<string>();

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const ouvir = (e: Event) => {
      setAviso((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setAviso(undefined), 3500);
    };
    window.addEventListener("sa:aviso", ouvir);
    return () => {
      window.removeEventListener("sa:aviso", ouvir);
      clearTimeout(t);
    };
  }, []);

  // Ignora ids que não existem mais no catálogo.
  const itens = ids.flatMap((id) => indice.find((i) => i.id === id) ?? []);
  const faltam = 2 - itens.length;
  const visivel = itens.length > 0 && pathname !== "/comparar";

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {itens.length ? `${itens.length} de ${LIMITE_COMPARACAO} produtos selecionados para comparação` : ""}
      </p>
      {aviso && (
        <p className="toast" role="status">
          {aviso}
        </p>
      )}
      {visivel && (
        <section className="tray" aria-label="Produtos selecionados para comparação" data-testid="compare-tray">
          <div className="tray__inner">
            <ul className="tray__thumbs">
              {itens.map((i) => (
                <li key={i.id} className="tray__thumb" title={i.nome}>
                  <Miniatura imagem={i.imagem} sizes="44px" />
                  <button type="button" aria-label={`Remover ${i.nome}`} onClick={() => removerDaComparacao(i.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <span className="tray__count" data-testid="compare-count">
              {itens.length} de {LIMITE_COMPARACAO}
            </span>
            {faltam > 0 ? (
              <span className="btn btn--primary" aria-disabled="true" data-testid="btn-comparar">
                Selecione mais {faltam}
              </span>
            ) : (
              <Link className="btn btn--primary" href={`/comparar?ids=${itens.map((i) => i.id).join(",")}`} data-testid="btn-comparar">
                COMPARAR
              </Link>
            )}
          </div>
        </section>
      )}
    </>
  );
}

/** "Comparar (n)" do header. */
export function LinkComparar({ className, children }: { className?: string; children?: React.ReactNode }) {
  const ids = useSelecaoComparar();
  const href = ids.length ? `/comparar?ids=${ids.join(",")}` : "/comparar";
  return (
    // Nome acessível fixo em qualquer largura (BUG-014); o conteúdo visual varia.
    <Link className={className} href={href} aria-label={`Comparar ${ids.length} ${ids.length === 1 ? "produto selecionado" : "produtos selecionados"}`}>
      {/* < 360px: só ícone + contador */}
      <IconeComparar className="compare-link__icone" />
      <span className="compare-link__txt" aria-hidden="true">
        {children ?? "Comparar"}
      </span>
      <span className="compare-link__paren" aria-hidden="true">
        ({ids.length})
      </span>
      <span className="compare-link__n" aria-hidden="true">
        {ids.length}
      </span>
    </Link>
  );
}
