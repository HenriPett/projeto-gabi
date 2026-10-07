import type { SubstratoAcido } from "./rotulos";

const COROA = "M8 34V16c0-7 5-12 12-12s12 5 12 12v18z";
const NUCLEO = "M13 34V17c0-4.5 3-7.5 7-7.5s7 3 7 7.5v17z";
const CONDICIONADO = "rgb(37 99 235 / 0.5)"; // --blue-600 (cor da etapa Ácido) a 50%

export const LEGENDA_SUBSTRATO: Record<"esmalte" | "esmalte-e-dentina" | "nenhum", string> = {
  esmalte: "esmalte",
  "esmalte-e-dentina": "esmalte + dentina",
  nenhum: "sem ácido",
};

/**
 * [R2] Corte de dente simplificado: anel = esmalte, núcleo = dentina; a área
 * condicionada pelo ácido fica em azul (DESIGN §3.7). Decorativo + legenda.
 */
export function SubstrateGlyph({ substrato }: { substrato: SubstratoAcido }) {
  const esmalte = substrato !== null;
  const dentina = substrato === "esmalte-e-dentina";
  return (
    <span className="substrato" data-substrato={substrato ?? "nenhum"}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <path d={COROA} fill={esmalte ? CONDICIONADO : "#fff"} stroke="var(--color-text-muted)" strokeWidth="1.5" />
        <path d={NUCLEO} fill={dentina ? CONDICIONADO : "var(--gray-100)"} stroke="var(--color-text-muted)" strokeWidth="1" />
      </svg>
      <span>{LEGENDA_SUBSTRATO[substrato ?? "nenhum"]}</span>
    </span>
  );
}
