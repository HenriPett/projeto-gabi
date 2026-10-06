import { z } from "zod";
import {
  atributo,
  Divergencia,
  Fonte,
  Fontes,
  Imagem,
  Revisao,
  SimNao,
  Slug,
  TextoComFonte,
} from "./comum";
import { GRUPOS, SUBCATEGORIA, SUBCATEGORIAS } from "./taxonomia";

/**
 * Produto da categoria "sistemas-adesivos". Um arquivo JSON por produto em
 * data/materiais/sistemas-adesivos/produtos/<id>.json. Preços NÃO ficam aqui
 * (ver oferta.ts) — eles mudam com outra frequência e serão atualizados por
 * automação.
 */

const Componente = z.object({
  /** Nome como na documentação do fabricante. Ex.: "10-MDP", "Bis-GMA", "Etanol". */
  nome: z.string().min(1),
  /** Função declarada pelo fabricante/literatura, se houver. Ex.: "monômero funcional". */
  funcao: z.string().optional(),
  /** Em qual frasco/componente do kit está, para sistemas de 2+ frascos. Ex.: "primer". */
  frasco: z.string().optional(),
  fontes: Fontes,
});

const Composicao = z.object({
  /** Apenas componentes confirmados em documentação (BRIEFING §5, §20). */
  componentes: z.array(Componente),
  // Colunas da tabela COMPARAR (§11). "nao-informado" quando a doc não diz.
  mdp: atributo(SimNao),
  hema: atributo(SimNao),
  silano: atributo(SimNao),
  solventes: atributo(z.array(z.string().min(1)).min(1)),
  polimerizacao: atributo(z.enum(["fotopolimerizavel", "dual", "autopolimerizavel"])),
  /** Atributos extras exibidos na ficha (pH, carga...). */
  outros: z
    .array(z.object({ rotulo: z.string().min(1), valor: z.string().min(1), fontes: Fontes }))
    .default([]),
});

export const TipoEtapa = z.enum([
  "condicionamento-acido",
  "lavagem",
  "secagem",
  "controle-umidade",
  "aplicacao-primer",
  "aplicacao-adesivo",
  "friccao",
  "nova-aplicacao",
  "evaporacao-solvente",
  "jato-de-ar",
  "fotopolimerizacao",
  "outro",
]);

/** Parâmetros exibidos como chips na etapa (DESIGN §4.3). Só o que a IFU informa. */
export const TipoParametro = z.enum([
  "tempo", // "15 s", "no mínimo 10 s"
  "camadas", // "2 camadas", "reaplicar 1 vez"
  "friccao", // "fricção ativa 20 s"
  "jato-de-ar", // "jato de ar suave 5 s"
  "luz", // "10 s · ≥ 1000 mW/cm²"
  "substrato", // "esmalte e dentina", "somente esmalte"
  "outro",
]);

const Etapa = z.object({
  /** Usado para ícone/ilustração; o texto exibido é `titulo` + `descricao`. */
  tipo: TipoEtapa,
  titulo: z.string().min(1),
  /** Instrução conforme a IFU (traduzida fielmente quando a IFU não tem pt-BR). */
  descricao: z.string().min(1),
  /** Valores como escritos na IFU. */
  parametros: z.array(z.object({ tipo: TipoParametro, texto: z.string().min(1) })).default([]),
  fontes: Fontes,
});

const Protocolo = z.object({
  id: Slug,
  titulo: z.string().min(1),
  /** Estratégias/subcategorias em que este protocolo vale. Universais têm um protocolo por estratégia. */
  aplicaA: z.array(z.enum(SUBCATEGORIAS)).min(1),
  etapas: z.array(Etapa).min(1),
  observacoes: z.array(TextoComFonte).default([]),
  /** Deve incluir a IFU (ou doc oficial do fabricante). Nunca copiar de outro produto. */
  fontes: Fontes,
});

const Apresentacao = z.object({
  /** Chave de comparação de preço: ofertas só se comparam com o MESMO apresentacaoId. */
  id: Slug,
  tipo: z.enum(["frasco", "kit", "refil", "unidose", "seringa", "outro"]),
  /** Texto exibido. Ex.: "Frasco 5 mL", "Kit: ácido 3 g + adesivo 4 mL". */
  descricao: z.string().min(1),
  /** Número de unidades na embalagem vendida (ex.: 50 unidoses → 50). */
  quantidade: z.number().int().positive(),
  /** Conteúdo por unidade. */
  volumeMl: z.number().positive().optional(),
  massaG: z.number().positive().optional(),
  /** Itens de um kit, conforme fabricante. */
  itens: z.array(z.string().min(1)).default([]),
  codigoFabricante: z.string().optional(),
  ean: z.string().regex(/^\d{8,14}$/).optional(),
  fontes: Fontes,
});

export const ProdutoSistemaAdesivo = z
  .object({
    $schema: z.string().optional(),
    id: Slug,
    material: z.literal("sistemas-adesivos"),
    nomeComercial: z.string().min(1),
    fabricante: z.object({ id: Slug, nome: z.string().min(1) }),
    /** Outros nomes p/ busca: "Prime&Bond", "Single Bond 2", "SBU". */
    aliases: z.array(z.string().min(1)).default([]),
    classificacao: z.object({
      grupo: z.enum(GRUPOS),
      /**
       * Convencionais/autocondicionantes: exatamente 1.
       * Universais: uma entrada por estratégia COM INDICAÇÃO OFICIAL (§7, §8).
       */
      subcategorias: z.array(z.object({ id: z.enum(SUBCATEGORIAS), fontes: Fontes })).min(1),
      observacao: z.string().optional(),
    }),
    /** Frase curta da estratégia adesiva p/ card e ficha (§4, §5). */
    estrategiaAdesiva: z.object({ texto: z.string().min(1), fontes: Fontes }).optional(),
    composicao: Composicao,
    indicacoes: z.array(TextoComFonte).default([]),
    contraindicacoes: z.array(TextoComFonte).default([]),
    protocolos: z.array(Protocolo).default([]),
    apresentacoes: z.array(Apresentacao).min(1),
    /** Apresentação mostrada no card. */
    apresentacaoPrincipal: Slug,
    imagens: z.array(Imagem).default([]),
    fontes: z.array(Fonte).min(1),
    divergencias: z.array(Divergencia).default([]),
    revisao: Revisao,
  })
  .superRefine((p, ctx) => {
    const erro = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    // Ids únicos
    const fonteIds = new Set<string>();
    p.fontes.forEach((f, i) => {
      if (fonteIds.has(f.id)) erro(["fontes", i, "id"], `fonte duplicada: ${f.id}`);
      fonteIds.add(f.id);
    });
    const aprIds = new Set<string>();
    p.apresentacoes.forEach((a, i) => {
      if (aprIds.has(a.id)) erro(["apresentacoes", i, "id"], `apresentação duplicada: ${a.id}`);
      if (a.volumeMl === undefined && a.massaG === undefined && a.tipo !== "kit")
        erro(["apresentacoes", i], "informe volumeMl ou massaG");
      aprIds.add(a.id);
    });
    if (!aprIds.has(p.apresentacaoPrincipal))
      erro(["apresentacaoPrincipal"], `não existe apresentação "${p.apresentacaoPrincipal}"`);

    // Toda referência a fonte existe
    for (const { path, id } of referenciasDeFonte(p)) {
      if (!fonteIds.has(id)) erro(path, `fonte "${id}" não declarada em "fontes"`);
    }

    // Classificação coerente com a taxonomia
    const subs = p.classificacao.subcategorias.map((s) => s.id);
    subs.forEach((id, i) => {
      if (SUBCATEGORIA[id].grupo !== p.classificacao.grupo)
        erro(["classificacao", "subcategorias", i], `${id} não pertence ao grupo ${p.classificacao.grupo}`);
    });
    if (new Set(subs).size !== subs.length) erro(["classificacao", "subcategorias"], "subcategoria repetida");
    if (p.classificacao.grupo !== "universal" && subs.length !== 1)
      erro(["classificacao", "subcategorias"], "não universais têm exatamente 1 subcategoria");

    // Protocolos: só para subcategorias do produto, fonte oficial obrigatória
    const fontePorId = new Map(p.fontes.map((f) => [f.id, f]));
    p.protocolos.forEach((pr, i) => {
      pr.aplicaA.forEach((id, j) => {
        if (!subs.includes(id))
          erro(["protocolos", i, "aplicaA", j], `${id} não está na classificação do produto`);
      });
      const oficial = pr.fontes.some((id) =>
        ["ifu", "ficha-tecnica", "site-fabricante", "embalagem"].includes(fontePorId.get(id)?.tipo ?? ""),
      );
      if (!oficial) erro(["protocolos", i, "fontes"], "protocolo precisa de fonte oficial do fabricante (IFU)");
    });

    // Publicado ⇒ cada estratégia tem protocolo
    if (p.revisao.status === "publicado") {
      for (const id of subs) {
        if (!p.protocolos.some((pr) => pr.aplicaA.includes(id)))
          erro(["protocolos"], `produto publicado sem protocolo para ${id}`);
      }
    }
  });

export type ProdutoSistemaAdesivo = z.infer<typeof ProdutoSistemaAdesivo>;

/** Varre o objeto e retorna toda referência a fonte (arrays `fontes` de strings). */
function referenciasDeFonte(raiz: unknown) {
  const refs: { path: (string | number)[]; id: string }[] = [];
  const visitar = (v: unknown, path: (string | number)[]) => {
    if (Array.isArray(v)) return v.forEach((x, i) => visitar(x, [...path, i]));
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "fontes" && Array.isArray(x) && x.every((s) => typeof s === "string")) {
          x.forEach((id, i) => refs.push({ path: [...path, k, i], id }));
        } else visitar(x, [...path, k]);
      }
    }
  };
  visitar(raiz, []);
  return refs;
}
