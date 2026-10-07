"use client";

import { useEffect, useRef, useState } from "react";
import { CompareToggle } from "../comparar/CompareToggle";

function irParaPrecos(e: React.MouseEvent<HTMLAnchorElement>) {
  const alvo = document.getElementById("titulo-precos");
  if (!alvo) return;
  e.preventDefault();
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  alvo.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  alvo.focus({ preventScroll: true });
  window.history.replaceState(window.history.state, "", "#precos");
}

/**
 * COMPARAR PREÇOS (cta) + ⊕ — DESIGN §4.3 item 4. Em mobile vira barra sticky
 * no rodapé enquanto estas ações estiverem fora da tela.
 */
export function AcoesProduto({ id, nome }: { id: string; nome: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fora, setFora] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const precos = document.getElementById("precos");
    let acoesFora = false;
    let precosVisivel = false;
    const atualizar = () => setFora(acoesFora && !precosVisivel);
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.target === el) acoesFora = !e.isIntersecting && e.boundingClientRect.top < 0;
        else precosVisivel = e.isIntersecting;
      }
      atualizar();
    });
    obs.observe(el);
    if (precos) obs.observe(precos);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div className="prod__actions" ref={ref}>
        <a className="btn btn--cta btn--lg" href="#precos" onClick={irParaPrecos}>
          COMPARAR PREÇOS
        </a>
        <CompareToggle id={id} nome={nome} variante="caixa" />
      </div>
      {fora && (
        <div className="sticky-cta">
          <a className="btn btn--cta btn--lg btn--block" href="#precos" onClick={irParaPrecos}>
            COMPARAR PREÇOS
          </a>
          <CompareToggle id={id} nome={nome} variante="caixa" />
        </div>
      )}
    </>
  );
}
