import { SUBCATEGORIA, type GrupoId, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { GRUPO_CURTO, GRUPO_SINGULAR } from "./rotulos";

/** Selo de classificação — DESIGN §3.2. Cor + forma (::before) + texto. */
export function ClassBadge({
  grupo,
  subcategoria,
  solid = false,
  curto = false,
}: {
  grupo: GrupoId;
  /** Omitir para universais (o produto é um só para várias estratégias). */
  subcategoria?: SubcategoriaId;
  solid?: boolean;
  /** Cards: "Conv. · 2 passos" (o rótulo longo fica na página do produto). */
  curto?: boolean;
}) {
  const g = curto ? GRUPO_CURTO[grupo] : GRUPO_SINGULAR[grupo];
  const texto = subcategoria ? `${g} · ${SUBCATEGORIA[subcategoria].rotulo}` : g;
  const completo = subcategoria ? `${GRUPO_SINGULAR[grupo]}, ${SUBCATEGORIA[subcategoria].rotulo}` : GRUPO_SINGULAR[grupo];
  return (
    <span className={`badge badge--${grupo}${solid ? " badge--solid" : ""}`} title={curto ? completo : undefined}>
      {curto ? (
        <>
          <span aria-hidden="true">{texto}</span>
          <span className="sr-only">{completo}</span>
        </>
      ) : (
        texto
      )}
    </span>
  );
}

export function SeloRascunho() {
  return (
    <span className="badge badge--draft" title="Visível só em desenvolvimento/preview">
      Rascunho
    </span>
  );
}
