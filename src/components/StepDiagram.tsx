import type { CSSProperties } from "react";
import { SUBCATEGORIA, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { IconeFechar, IconeSetaBaixo } from "./Icones";
import { LegendaNotacao, Notacao } from "./Notacao";
import { CLASSE_GLIFO, ESTRATEGIA_CURTA, ESTRATEGIAS_UNIVERSAIS, etapasVisuais, leituraDiagrama, semAcidoSeparado, substratoAcido } from "./rotulos";
import { LEGENDA_SUBSTRATO, SubstrateGlyph } from "./SubstrateGlyph";

/** [R2] Bloco fantasma riscado: não conta como passo. */
function EtapaAusente() {
  return (
    <>
      <li className="step-ghost">
        <IconeFechar />
        <s>Ácido fosfórico separado</s>
        <em>não usa</em>
      </li>
      <li className="ghost-link" />
    </>
  );
}

function Etapas({ id, contador, substratoNoAcido }: { id: SubcategoriaId; contador: boolean; substratoNoAcido: boolean }) {
  const etapas = etapasVisuais(id);
  return (
    <ol className="diagram__steps" aria-hidden="true">
      {semAcidoSeparado(id) && <EtapaAusente />}
      {etapas.flatMap((e, i) => [
        i > 0 && (
          <li key={`seta-${i}`} className="arrow">
            <IconeSetaBaixo />
          </li>
        ),
        <li key={i} className={`step step--${e.tipo}`} style={{ "--i": i * 2 } as CSSProperties}>
          <span className="step__glyph">
            {/* glifos combinados ("P+A", "H⁺PA"): cada letra na cor da sua etapa */}
            {/* um único filho: o .step__glyph é grid e empilharia cada letra numa linha */}
            {e.glifo.length > 2 ? (
              <span>{e.glifo.split(/(H⁺|P|A)/).map((g, j) => (CLASSE_GLIFO[g] ? <span key={j} className={CLASSE_GLIFO[g]}>{g}</span> : g))}</span>
            ) : (
              e.glifo
            )}
          </span>
          <span className="step__label">
            {e.rotulo}
            {e.sub && <span className="step__sub">{e.sub}</span>}
            {/* < 640px a legenda do substrato desce para cá (DESIGN §3.7) */}
            {e.tipo === "acid" && substratoNoAcido && (
              <span className="step__sub step__sub--substrato">{LEGENDA_SUBSTRATO[substratoAcido(id) ?? "nenhum"]}</span>
            )}
          </span>
          {e.tipo === "acid" && substratoNoAcido ? (
            <span className="step__count step__substrato">
              <SubstrateGlyph substrato={substratoAcido(id)} />
              {contador && <span>passo {i + 1}</span>}
            </span>
          ) : (
            contador && <span className="step__count">passo {i + 1}</span>
          )}
        </li>,
      ])}
    </ol>
  );
}

/**
 * Diagrama "Como identificar?" — DESIGN §3.7 (R2). Vertical; blocos aria-hidden
 * e leitura completa no figcaption. Passo = aplicação clínica, não frasco.
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
        <Notacao subcategoria={subcategoria} className="notacao--diagrama" />
      </figcaption>
      <Etapas id={subcategoria} contador substratoNoAcido={s.grupo === "convencional"} />
      <LegendaNotacao />
    </figure>
  );
}

/**
 * Universais: os três caminhos lado a lado (≥640) ou empilhados com "OU",
 * com o atual destacado e o substrato de cada um. `indicadas` marca as não
 * indicadas para o produto.
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
              <span>
                {ESTRATEGIA_CURTA[id]} <Notacao subcategoria={id} />
              </span>
              {indicadas && !indicadas.includes(id) && <small>não indicado</small>}
            </div>
            <SubstrateGlyph substrato={substratoAcido(id)} />
            <Etapas id={id} contador={false} substratoNoAcido={false} />
          </div>,
        ])}
      </div>
      <LegendaNotacao />
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
