"use client";

import { useRef, type ReactNode } from "react";

/**
 * Carrossel horizontal com scroll-snap, sem autoplay; setas ‹ › em ≥1024
 * (DESIGN §4.1 item 4). Os itens continuam acessíveis por Tab e rolagem.
 */
export function Carrossel({ rotuloId, children }: { rotuloId: string; children: ReactNode }) {
  const lista = useRef<HTMLUListElement>(null);
  const rolar = (dir: 1 | -1) => {
    const el = lista.current;
    if (!el) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduzir ? "auto" : "smooth" });
  };
  return (
    <div className="carrossel" role="region" aria-roledescription="carrossel" aria-labelledby={rotuloId}>
      <div className="carrossel__setas">
        <button type="button" className="icon-btn" aria-label="Anteriores" onClick={() => rolar(-1)}>
          ‹
        </button>
        <button type="button" className="icon-btn" aria-label="Próximos" onClick={() => rolar(1)}>
          ›
        </button>
      </div>
      <ul className="rail" ref={lista}>
        {children}
      </ul>
    </div>
  );
}
