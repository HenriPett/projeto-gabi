import { z } from "zod";

/**
 * Blocos reutilizáveis por qualquer material (sistemas adesivos hoje; resinas,
 * cimentos etc. no futuro). Regra-mãe do briefing: toda afirmação factual
 * aponta para pelo menos uma fonte registrada (URL + data de acesso).
 */

/** Slug kebab-case ASCII: "single-bond-universal". Usado em ids e URLs. */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use kebab-case ASCII (ex.: single-bond-universal)");

/** Data ISO "AAAA-MM-DD". Exibida na UI como DD/MM/AAAA. */
export const DataISO = z.iso.date();

export const Url = z.url({ protocol: /^https?$/ });

/** Id local de uma fonte, único dentro do arquivo do produto. Ex.: "ifu-2024". */
export const FonteId = Slug;

export const TipoFonte = z.enum([
  "ifu", // instruções de uso oficiais
  "ficha-tecnica", // perfil técnico / technical data sheet
  "fds", // ficha de dados de segurança (SDS/FISPQ)
  "site-fabricante", // página do produto no site do fabricante
  "embalagem", // rótulo/caixa (foto ou PDF)
  "literatura", // artigo científico, livro-texto
  "loja", // página do produto em loja
  "outro",
]);

export const Fonte = z.object({
  id: FonteId,
  tipo: TipoFonte,
  titulo: z.string().min(1),
  url: Url,
  /** Data em que a fonte foi consultada. */
  acessadoEm: DataISO,
  /** Idioma/país/versão do documento, revisão da IFU etc. */
  versao: z.string().optional(),
  observacao: z.string().optional(),
});
export type Fonte = z.infer<typeof Fonte>;

/** Lista não vazia de referências a fontes do mesmo arquivo. */
export const Fontes = z.array(FonteId).min(1, "toda afirmação precisa de ao menos uma fonte");

/**
 * Atributo pontual com fonte. Quando o dado não foi encontrado em fonte
 * confiável, usar `{ "valor": "nao-informado" }` (sem fontes) — nunca chutar.
 */
export function atributo<T extends z.ZodType>(valor: T) {
  return z.union([
    z.object({ valor, fontes: Fontes, observacao: z.string().optional() }),
    z.object({ valor: z.literal("nao-informado"), observacao: z.string().optional() }),
  ]);
}

export const SimNao = z.enum(["sim", "nao"]);

/** Texto livre com fonte (indicações, observações de protocolo...). */
export const TextoComFonte = z.object({
  texto: z.string().min(1),
  fontes: Fontes,
});

/**
 * Divergência entre fontes: registramos as versões, NÃO escolhemos.
 * `campo` é o caminho do dado afetado, p.ex. "composicao.hema",
 * "apresentacoes.frasco-5ml", "protocolos.total.etapas.3". A UI mostra um
 * alerta junto ao campo.
 */
export const Divergencia = z.object({
  campo: z.string().min(1),
  descricao: z.string().min(1),
  versoes: z
    .array(z.object({ valor: z.string().min(1), fontes: Fontes }))
    .min(2, "divergência exige ao menos duas versões"),
});

export const Imagem = z.object({
  /** Caminho em /public. Ex.: "/img/produtos/ambar/frasco.webp". */
  arquivo: z.string().regex(/^\/img\/produtos\/[a-z0-9-]+\/[a-z0-9._-]+\.(webp|png|jpe?g|avif)$/),
  alt: z.string().min(1),
  /** De onde a imagem foi obtida (site do fabricante, loja...). */
  fontes: Fontes,
  credito: z.string().optional(),
});

export const StatusRevisao = z.enum([
  "rascunho", // em pesquisa — não aparece em produção
  "publicado", // conferido; aparece no site
]);

export const Revisao = z.object({
  status: StatusRevisao,
  atualizadoEm: DataISO,
  responsavel: z.string().optional(),
  notas: z.string().optional(),
});
