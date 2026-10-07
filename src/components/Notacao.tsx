import type { SubcategoriaId } from "@/lib/esquema/taxonomia";
import { LEGENDA_NOTACAO, NOTACAO } from "./rotulos";

/** [R2] Notação compacta (DESIGN §3.7). Visual: a leitura completa fica no figcaption/aria-label. */
export function Notacao({ subcategoria, className = "" }: { subcategoria: SubcategoriaId; className?: string }) {
  return (
    <span className={`notacao ${className}`} aria-hidden="true" data-notacao={subcategoria}>
      {NOTACAO[subcategoria].map((x, i) => (
        <span key={i}>
          {x.t}
          {x.sub && <sub>{x.sub}</sub>}
        </span>
      ))}
    </span>
  );
}

/** Legenda fixa, uma vez por página. Também decorativa para leitores de tela. */
export function LegendaNotacao({ className = "" }: { className?: string }) {
  return (
    <p className={`legenda-notacao ${className}`} aria-hidden="true">
      {LEGENDA_NOTACAO.map((item, i) => (
        <span key={item} className="whitespace-nowrap">
          {i > 0 && " · "}
          {item}
        </span>
      ))}
    </p>
  );
}
