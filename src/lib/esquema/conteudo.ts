import { z } from "zod";
import { Fonte, Slug, TextoComFonte } from "./comum";
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

/**
 * Curadoria da seção "Em destaque" da Home e da ordenação "Em destaque" da
 * categoria (não é popularidade — ARQUITETURA §9). Ordem do array = ordem exibida.
 * Arquivo: data/materiais/sistemas-adesivos/destaques.json
 */
export const Destaques = z.object({
  $schema: z.string().optional(),
  produtos: z.array(Slug).refine((ids) => new Set(ids).size === ids.length, "produto repetido"),
});
export type Destaques = z.infer<typeof Destaques>;
