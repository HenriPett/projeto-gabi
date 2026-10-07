import { SUBCATEGORIA, type GrupoId, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { GRUPO_SINGULAR } from "./rotulos";

/** Selo de classificação — DESIGN §3.2. Cor + forma (::before) + texto. */
export function ClassBadge({
  grupo,
  subcategoria,
  solid = false,
}: {
  grupo: GrupoId;
  /** Omitir para universais (o produto é um só para várias estratégias). */
  subcategoria?: SubcategoriaId;
  solid?: boolean;
}) {
  const texto = subcategoria ? `${GRUPO_SINGULAR[grupo]} · ${SUBCATEGORIA[subcategoria].rotulo}` : GRUPO_SINGULAR[grupo];
  return <span className={`badge badge--${grupo}${solid ? " badge--solid" : ""}`}>{texto}</span>;
}

export function SeloRascunho() {
  return (
    <span className="badge badge--draft" title="Visível só em desenvolvimento/preview">
      Rascunho
    </span>
  );
}
