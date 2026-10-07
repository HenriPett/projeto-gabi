import { z } from "zod";
import { Fonte, Fontes, Revisao, Slug, TextoComFonte } from "./comum";
import { FONTES_TECNICAS, referenciasDeFonte } from "./sistema-adesivo";
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
}).superRefine((c, ctx) => {
  const ids = new Set<string>();
  c.fontes.forEach((f, i) => {
    if (ids.has(f.id)) ctx.addIssue({ code: "custom", path: ["fontes", i, "id"], message: `fonte duplicada: ${f.id}` });
    ids.add(f.id);
  });
  for (const { path, id } of referenciasDeFonte({ grupos: c.grupos, subcategorias: c.subcategorias })) {
    if (!ids.has(id)) ctx.addIssue({ code: "custom", path, message: `fonte "${id}" não declarada em "fontes"` });
  }
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

/**
 * Artigo do Guia rápido (§21). Arquivo: data/materiais/<material>/guia/<slug>.json.
 * Todo parágrafo cita fontes; mesma regra de rascunho dos produtos.
 */
export const ArtigoGuia = z
  .object({
    $schema: z.string().optional(),
    slug: Slug,
    titulo: z.string().min(1),
    /** Uma frase para o card da Home e a meta description. */
    resumo: z.string().min(1),
    /** Posição no índice do guia e na Home (crescente). */
    ordem: z.number().int(),
    secoes: z
      .array(
        z.object({
          titulo: z.string().min(1).optional(),
          paragrafos: z.array(z.object({ texto: z.string().min(1), fontes: Fontes })).min(1),
        }),
      )
      .min(1),
    /** Referências do artigo (DOI vai na url: https://doi.org/...). */
    fontes: z.array(Fonte).min(1),
    relacionados: z.array(Slug).default([]),
    revisao: Revisao,
  })
  .superRefine((a, ctx) => {
    const ids = new Set<string>();
    a.fontes.forEach((f, i) => {
      if (ids.has(f.id)) ctx.addIssue({ code: "custom", path: ["fontes", i, "id"], message: `fonte duplicada: ${f.id}` });
      ids.add(f.id);
    });
    for (const { path, id } of referenciasDeFonte({ secoes: a.secoes })) {
      if (!ids.has(id)) ctx.addIssue({ code: "custom", path, message: `fonte "${id}" não declarada em "fontes"` });
    }
    if (a.revisao.status === "publicado" && !a.fontes.some((f) => FONTES_TECNICAS.has(f.tipo)))
      ctx.addIssue({ code: "custom", path: ["fontes"], message: "artigo publicado exige ao menos uma fonte técnica/científica" });
    if (a.slug === "glossario")
      ctx.addIssue({ code: "custom", path: ["slug"], message: '"glossario" é reservado para a rota /guia/glossario' });
    if (a.relacionados.includes(a.slug))
      ctx.addIssue({ code: "custom", path: ["relacionados"], message: "artigo relacionado a si mesmo" });
  });
export type ArtigoGuia = z.infer<typeof ArtigoGuia>;

/**
 * Glossário de adesão (/guia). Arquivo: data/materiais/<material>/glossario.json.
 * Ordem alfabética é responsabilidade da UI. `artigos` (slugs do guia) é conferido
 * no carregador; `relacionados` aponta para ids de termos do mesmo arquivo.
 */
export const Glossario = z
  .object({
    $schema: z.string().optional(),
    fontes: z.array(Fonte).min(1),
    termos: z
      .array(
        z.object({
          id: Slug,
          termo: z.string().min(1),
          /** Grafias alternativas, usadas também na busca: "10-MDP", "smear layer". */
          sinonimos: z.array(z.string().min(1)).default([]),
          definicao: z.string().min(1),
          fontes: Fontes,
          artigos: z.array(Slug).default([]),
          relacionados: z.array(Slug).default([]),
        }),
      )
      .min(1),
    revisao: Revisao,
  })
  .superRefine((g, ctx) => {
    const erro = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    const fontes = new Set<string>();
    g.fontes.forEach((f, i) => {
      if (fontes.has(f.id)) erro(["fontes", i, "id"], `fonte duplicada: ${f.id}`);
      fontes.add(f.id);
    });
    const termos = new Set<string>();
    g.termos.forEach((t, i) => {
      if (termos.has(t.id)) erro(["termos", i, "id"], `termo duplicado: ${t.id}`);
      termos.add(t.id);
    });
    g.termos.forEach((t, i) => {
      t.fontes.forEach((id, j) => {
        if (!fontes.has(id)) erro(["termos", i, "fontes", j], `fonte "${id}" não declarada em "fontes"`);
      });
      t.relacionados.forEach((id, j) => {
        if (!termos.has(id) || id === t.id) erro(["termos", i, "relacionados", j], `termo relacionado inválido: ${id}`);
      });
    });
    if (g.revisao.status === "publicado" && !g.fontes.some((f) => FONTES_TECNICAS.has(f.tipo)))
      erro(["fontes"], "glossário publicado exige ao menos uma fonte técnica/científica");
  });
export type Glossario = z.infer<typeof Glossario>;
