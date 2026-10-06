import { ProdutoSistemaAdesivo } from "./sistema-adesivo";

export * from "./comum";
export * from "./conteudo";
export * from "./lojas";
export * from "./oferta";
export * from "./sistema-adesivo";
export * from "./taxonomia";

/**
 * Registro de materiais. Para um novo material (ex.: resinas compostas):
 * criar src/lib/esquema/<material>.ts com `material: z.literal("<material>")`,
 * adicionar aqui e criar data/materiais/<material>/.
 */
export const ESQUEMA_POR_MATERIAL = {
  "sistemas-adesivos": ProdutoSistemaAdesivo,
} as const;
export type MaterialId = keyof typeof ESQUEMA_POR_MATERIAL;
export const MATERIAIS = Object.keys(ESQUEMA_POR_MATERIAL) as MaterialId[];

export type Produto = ProdutoSistemaAdesivo;
