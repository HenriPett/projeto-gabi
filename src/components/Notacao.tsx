import { Fragment } from "react";
import type { SubcategoriaId } from "@/lib/esquema/taxonomia";
import { CLASSE_SIGLA, LEGENDA_NOTACAO, NOTACAO } from "./rotulos";

/** Separa "Ác + (P·Ad)" em siglas coloridas pela etapa e o resto (sinais) sem cor. */
function colorir(texto: string, chave: string) {
  return texto.split(/(Ác|Ad|P|U)/).map((parte, i) =>
    CLASSE_SIGLA[parte] ? (
      <span key={`${chave}-${i}`} className={CLASSE_SIGLA[parte]}>
        {parte}
      </span>
    ) : (
      parte
    ),
  );
}

/** [R2] Notação compacta (DESIGN §3.7). Visual: a leitura completa fica no figcaption/aria-label. */
export function Notacao({ subcategoria, className = "" }: { subcategoria: SubcategoriaId; className?: string }) {
  return (
    <span className={`notacao ${className}`} aria-hidden="true" data-notacao={subcategoria}>
      {NOTACAO[subcategoria].map((x, i) => (
        <span key={i} className={x.sub ? CLASSE_SIGLA[x.t] : undefined}>
          {x.sub ? x.t : colorir(x.t, String(i))}
          {x.sub && <sub>{x.sub}</sub>}
        </span>
      ))}
    </span>
  );
}

/** "Ác = ácido fosfórico": a sigla antes do " = " ganha a cor da etapa. */
function colorirLegenda(item: string) {
  const [sigla, ...resto] = item.split(" = ");
  const classe = CLASSE_SIGLA[sigla];
  return classe ? (
    <>
      <span className={classe}>{sigla}</span> = {resto.join(" = ")}
    </>
  ) : (
    item
  );
}

/** Legenda fixa, uma vez por página. Também decorativa para leitores de tela. */
export function LegendaNotacao({ className = "" }: { className?: string }) {
  return (
    <p className={`legenda-notacao ${className}`} aria-hidden="true">
      {LEGENDA_NOTACAO.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && " · "}
          <span className="whitespace-nowrap">{colorirLegenda(item)}</span>
        </Fragment>
      ))}
    </p>
  );
}
