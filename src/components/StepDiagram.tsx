import type { CSSProperties } from "react";
import { SUBCATEGORIA, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { IconeSetaBaixo } from "./Icones";
import { ESTRATEGIA_CURTA, ESTRATEGIAS_UNIVERSAIS, etapasVisuais, leituraDiagrama } from "./rotulos";

function Etapas({ id, contador }: { id: SubcategoriaId; contador: boolean }) {
  const etapas = etapasVisuais(id);
  return (
    <ol className="diagram__steps" aria-hidden="true">
      {etapas.flatMap((e, i) => [
        i > 0 && (
          <li key={`seta-${i}`} className="arrow">
            <IconeSetaBaixo />
          </li>
        ),
        <li key={i} className={`step step--${e.tipo}`} style={{ "--i": i * 2 } as CSSProperties}>
          <span className="step__glyph">{e.glifo}</span>
          <span className="step__label">
            {e.rotulo}
            {e.sub && <span className="step__sub">{e.sub}</span>}
          </span>
          {contador && <span className="step__count">frasco {i + 1}</span>}
        </li>,
      ])}
    </ol>
  );
}

/**
 * Diagrama "Como identificar?" — DESIGN §3.7. Vertical; blocos aria-hidden e
 * leitura completa no figcaption.
 */
export function StepDiagram({ subcategoria, compacto = false }: { subcategoria: SubcategoriaId; compacto?: boolean }) {
  const s = SUBCATEGORIA[subcategoria];
  if (s.grupo === "universal") return <UniversalPaths atual={subcategoria} compacto={compacto} />;
  return (
    <figure
      className={`diagram${compacto ? " diagram--compact" : ""}`}
      data-testid="step-diagram"
      data-sequencia={s.sequencia.join(",")}
    >
      <figcaption>
        <span className="sobretitulo">Como identificar?</span>
        <span className="sr-only"> {leituraDiagrama(subcategoria)}</span>
      </figcaption>
      <Etapas id={subcategoria} contador />
    </figure>
  );
}

/**
 * Universais: os três caminhos lado a lado (≥640) ou empilhados com "OU",
 * com o atual destacado. `indicadas` marca as não indicadas para o produto.
 */
export function UniversalPaths({
  atual,
  indicadas,
  compacto = false,
}: {
  atual: SubcategoriaId;
  indicadas?: readonly SubcategoriaId[];
  compacto?: boolean;
}) {
  const leitura = ESTRATEGIAS_UNIVERSAIS.map((id) => {
    const nao = indicadas && !indicadas.includes(id) ? " (não indicado para este produto)" : "";
    return leituraDiagrama(id) + nao;
  }).join(" Ou: ");
  return (
    <figure
      className={`diagram${compacto ? " diagram--compact" : ""}`}
      data-testid="step-diagram"
      data-sequencia={SUBCATEGORIA[atual].sequencia.join(",")}
    >
      <figcaption>
        <span className="sobretitulo">Como identificar?</span>
        <span className="sr-only">
          {" "}
          Mesmo adesivo universal, três estratégias. Exibindo {SUBCATEGORIA[atual].rotulo.toLowerCase()}. {leitura}
        </span>
      </figcaption>
      <div className="paths" aria-hidden="true">
        {ESTRATEGIAS_UNIVERSAIS.flatMap((id, i) => [
          i > 0 && (
            <span key={`ou-${i}`} className="or">
              OU
            </span>
          ),
          <div key={id} className={`path${id === atual ? " is-current" : ""}`}>
            <div className="path__title">
              {ESTRATEGIA_CURTA[id]}
              {indicadas && !indicadas.includes(id) && <small>não indicado</small>}
            </div>
            <Etapas id={id} contador={false} />
            {id === "universal-autocondicionante" && <p className="caption mt-1.5">sem ácido separado</p>}
          </div>,
        ])}
      </div>
    </figure>
  );
}

/** Mini-diagrama dos cards de subcategoria da Home (§4.1). */
export function MiniDiagram({ subcategoria }: { subcategoria: SubcategoriaId }) {
  return (
    <span className="mini" aria-hidden="true">
      {SUBCATEGORIA[subcategoria].sequencia.map((p, i) => (
        <span key={i} className={p.replace("+", "-")} />
      ))}
    </span>
  );
}
