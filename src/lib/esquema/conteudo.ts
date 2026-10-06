import { z } from "zod";
import { Fonte, TextoComFonte } from "./comum";
import { GRUPOS, SUBCATEGORIAS } from "./taxonomia";

/**
 * Textos das páginas de categoria (explicação curta do §3), com fonte.
 * Arquivo: data/materiais/sistemas-adesivos/categorias.json
 */
export const ConteudoCategorias = z.object({
  $schema: z.string().optional(),
  fontes: z.array(Fonte),
  grupos: z.partialRecord(z.enum(GRUPOS), z.object({ explicacao: TextoComFonte })),
  subcategorias: z.partialRecord(z.enum(SUBCATEGORIAS), z.object({ explicacao: TextoComFonte })),
});
export type ConteudoCategorias = z.infer<typeof ConteudoCategorias>;
