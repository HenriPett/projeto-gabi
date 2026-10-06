import { z } from "zod";
import { DataISO, Slug, Url } from "./comum";
import { LOJA_IDS, validarUrlDeProduto } from "./lojas";

/**
 * Ofertas de preço de um produto, por loja e apresentação.
 * Um arquivo por produto: data/materiais/<material>/ofertas/<produtoId>.json.
 * Separado do produto para que a atualização de preços (manual ou automática)
 * mexa só nesses arquivos.
 */

export const TipoPreco = z.enum([
  /** Preço vigente da página, sem condição de pagamento (o "por", não o "de" riscado). Base da comparação. */
  "padrao",
  /** Preço com desconto à vista via Pix. */
  "pix",
  /** Preço no boleto, quando difere do Pix. */
  "boleto",
]);

const Preco = z.object({
  tipo: TipoPreco,
  /** Em centavos de BRL, inteiro. R$ 89,90 → 8990. Nunca float. */
  centavos: z.number().int().positive(),
  /** Condição como a loja descreve. Ex.: "5% de desconto no Pix". */
  condicao: z.string().optional(),
});

export const Oferta = z
  .object({
    lojaId: z.enum(LOJA_IDS),
    /**
     * Apresentação EXATA do produto (mesmo fabricante, nome, volume, quantidade).
     * Se o anúncio da loja não bate com nenhuma apresentação cadastrada, cadastre
     * a apresentação no produto — nunca force o vínculo.
     */
    apresentacaoId: Slug,
    /**
     * disponivel     → página encontrada, com preço.
     * indisponivel   → página existe, mas sem estoque/sem preço.
     * nao-encontrado → a loja não vende esta apresentação (ou não foi achada).
     */
    status: z.enum(["disponivel", "indisponivel", "nao-encontrado"]),
    /** Página ESPECÍFICA do produto na loja (nunca a home). */
    url: Url.optional(),
    tituloNaLoja: z.string().optional(),
    skuLoja: z.string().optional(),
    precos: z.array(Preco).default([]),
    /** Data da consulta → "Última atualização: DD/MM/AAAA". */
    consultadoEm: DataISO,
    observacao: z.string().optional(),
  })
  .superRefine((o, ctx) => {
    const erro = (path: string[], message: string) => ctx.addIssue({ code: "custom", path, message });
    if (o.status !== "nao-encontrado") {
      if (!o.url) erro(["url"], `status "${o.status}" exige url da página do produto`);
      else {
        const problema = validarUrlDeProduto(o.lojaId, o.url);
        if (problema) erro(["url"], problema);
      }
    }
    if (o.status === "disponivel" && !o.precos.some((p) => p.tipo === "padrao"))
      erro(["precos"], 'oferta disponível exige preço do tipo "padrao"');
    if (o.status !== "disponivel" && o.precos.length > 0)
      erro(["precos"], "só ofertas disponíveis têm preço");
    const tipos = o.precos.map((p) => p.tipo);
    if (new Set(tipos).size !== tipos.length) erro(["precos"], "tipo de preço repetido");
  });
export type Oferta = z.infer<typeof Oferta>;

export const OfertasDoProduto = z
  .object({
    $schema: z.string().optional(),
    produtoId: Slug,
    ofertas: z.array(Oferta),
  })
  .superRefine((arq, ctx) => {
    const vistos = new Set<string>();
    arq.ofertas.forEach((o, i) => {
      const chave = `${o.lojaId}/${o.apresentacaoId}`;
      if (vistos.has(chave))
        ctx.addIssue({ code: "custom", path: ["ofertas", i], message: `oferta duplicada: ${chave}` });
      vistos.add(chave);
    });
  });
export type OfertasDoProduto = z.infer<typeof OfertasDoProduto>;
