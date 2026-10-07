import type { SubcategoriaId } from "@/lib/esquema/taxonomia";
import { ESTRATEGIA_CURTA, ESTRATEGIAS_UNIVERSAIS } from "./rotulos";
import { SUBCATEGORIA } from "@/lib/esquema/taxonomia";

/**
 * Chips fixos Seletivo · Total · Autocond. (sempre nessa ordem) — DESIGN §4.5.
 * Mostra que é o MESMO produto em várias estratégias.
 */
export function EstrategiasIndicadas({ indicadas, atual }: { indicadas: readonly SubcategoriaId[]; atual?: SubcategoriaId }) {
  return (
    <div>
      <p className="caption">Estratégias indicadas:</p>
      <ul className="strat" data-testid="strategy-badges" data-estrategias={indicadas.join(",")}>
        {ESTRATEGIAS_UNIVERSAIS.map((id) => {
          const ok = indicadas.includes(id);
          const nome = SUBCATEGORIA[id].rotulo.toLowerCase();
          return (
            <li
              key={id}
              className={`${ok ? "on" : "off"}${id === atual ? " cur" : ""}`}
              aria-label={ok ? `Indicado para ${nome}` : `Não indicado para ${nome}`}
            >
              <span aria-hidden="true">{ok ? "✓" : "—"}</span>
              <span aria-hidden="true">{ESTRATEGIA_CURTA[id]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
