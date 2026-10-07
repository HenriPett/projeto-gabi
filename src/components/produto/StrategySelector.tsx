"use client";

import { useRef } from "react";
import { SUBCATEGORIA } from "@/lib/esquema/taxonomia";
import { ESTRATEGIA_CURTA, ESTRATEGIAS_UNIVERSAIS } from "../rotulos";
import { useEstrategia } from "./estrategia";

/** Controle segmentado (radiogroup) "Escolha a estratégia de uso" — DESIGN §4.5. */
export function StrategySelector() {
  const ctx = useEstrategia();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  if (!ctx) return null;
  const { atual, indicadas, escolher } = ctx;
  const naoIndicadas = ESTRATEGIAS_UNIVERSAIS.filter((id) => !indicadas.includes(id));

  function mover(de: number, passo: number) {
    const n = ESTRATEGIAS_UNIVERSAIS.length;
    for (let k = 1; k <= n; k++) {
      const i = (de + passo * k + n) % n;
      const id = ESTRATEGIAS_UNIVERSAIS[i];
      if (indicadas.includes(id)) {
        escolher(id);
        refs.current[i]?.focus();
        return;
      }
    }
  }

  return (
    <section className="selector" aria-labelledby="titulo-estrategia" data-testid="strategy-selector">
      <h2 id="titulo-estrategia" className="h3-sans">
        Escolha a estratégia de uso
      </h2>
      <div className="selector__art">
        <svg width="120" height="64" viewBox="0 0 120 64" aria-hidden="true">
          <g transform="translate(0 4) scale(0.4)">
            <rect x="30" y="4" width="20" height="22" rx="3" fill="var(--color-primary)" />
            <rect x="26" y="24" width="28" height="10" rx="2" fill="var(--color-primary-hover)" />
            <path d="M20 40c0-4 4-6 8-6h24c4 0 8 2 8 6v88c0 5-4 8-8 8H28c-4 0-8-3-8-8z" fill="#fff" stroke="var(--color-border-accent)" strokeWidth="3" />
          </g>
          <path d="M36 32 C60 32 70 10 112 10M36 32H112M36 32C60 32 70 54 112 54" fill="none" stroke="var(--color-border-accent)" strokeWidth="2" />
          {ESTRATEGIAS_UNIVERSAIS.map((id, i) =>
            indicadas.includes(id) ? (
              <circle key={id} cx="112" cy={10 + i * 22} r="4" fill="var(--grp-univ-solid)" />
            ) : (
              <circle key={id} cx="112" cy={10 + i * 22} r="4" fill="#fff" stroke="var(--gray-400)" strokeWidth="1.5" strokeDasharray="2 2" />
            ),
          )}
        </svg>
        <p className="small">
          <strong>Mesmo frasco, formas diferentes de usar.</strong>
          <br />
          <span className="muted">É um único produto — muda só a técnica de aplicação. Nome, composição e preço são os mesmos.</span>
        </p>
      </div>
      <div className="seg" role="radiogroup" aria-labelledby="titulo-estrategia">
        {ESTRATEGIAS_UNIVERSAIS.map((id, i) => {
          const ok = indicadas.includes(id);
          const marcado = id === atual;
          return (
            <button
              key={id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={marcado}
              aria-disabled={!ok || undefined}
              aria-label={ok ? SUBCATEGORIA[id].rotulo : `${SUBCATEGORIA[id].rotulo} — não indicado`}
              aria-describedby={ok ? undefined : "estrategia-nao-indicada"}
              tabIndex={marcado ? 0 : -1}
              onClick={() => ok && escolher(id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  mover(i, 1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  mover(i, -1);
                }
              }}
            >
              {ESTRATEGIA_CURTA[id]}
            </button>
          );
        })}
      </div>
      {naoIndicadas.length > 0 && (
        <p id="estrategia-nao-indicada" className="caption mt-2">
          {naoIndicadas.map((id) => SUBCATEGORIA[id].rotulo).join(" e ")}: não{" "}
          {naoIndicadas.length > 1 ? "indicados" : "indicado"} pelo fabricante para este produto.
        </p>
      )}
    </section>
  );
}
