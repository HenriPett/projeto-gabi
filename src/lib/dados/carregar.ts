import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import {
  ConteudoCategorias,
  ESQUEMA_POR_MATERIAL,
  MATERIAIS,
  OfertasDoProduto,
  type MaterialId,
  type Produto,
} from "@/lib/esquema";

/**
 * Leitura dos dados versionados em data/. Roda só em build (Server Components
 * + generateStaticParams) e nos scripts. Dado inválido = build quebra.
 *
 * DADOS_DIR permite apontar para fixtures nos testes (ex.: tests/fixtures/dados).
 */

export interface ErroDeDados {
  arquivo: string;
  mensagem: string;
}

export interface Catalogo {
  produtos: Produto[];
  /** produtoId → ofertas */
  ofertas: Map<string, OfertasDoProduto["ofertas"]>;
  categorias: Partial<Record<MaterialId, ConteudoCategorias>>;
}

export function dirDados() {
  // Só lido no build (todas as rotas são SSG); não rastrear p/ o bundle de servidor.
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DADOS_DIR ?? "data");
}

/** Rascunhos aparecem em dev/preview (com selo) e nunca em produção. */
export function incluirRascunhos() {
  if (process.env.INCLUIR_RASCUNHOS) return process.env.INCLUIR_RASCUNHOS === "1";
  return process.env.VERCEL_ENV !== "production";
}

function lerJson(arquivo: string): unknown {
  return JSON.parse(fs.readFileSync(arquivo, "utf8"));
}

function jsonsEm(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));
}

function formatarErros(arquivo: string, erro: z.ZodError): ErroDeDados[] {
  return erro.issues.map((i) => ({
    arquivo,
    mensagem: `${i.path.join(".") || "(raiz)"}: ${i.message}`,
  }));
}

/** Lê e valida tudo, acumulando erros (usado pelo script validar:dados). */
export function lerCatalogo(): { catalogo: Catalogo; erros: ErroDeDados[] } {
  const raiz = dirDados();
  const rel = (f: string) => path.relative(process.cwd(), f);
  const erros: ErroDeDados[] = [];
  const produtos: Produto[] = [];
  const ofertas = new Map<string, OfertasDoProduto["ofertas"]>();
  const categorias: Catalogo["categorias"] = {};

  for (const material of MATERIAIS) {
    const base = path.join(raiz, "materiais", material);
    const esquema = ESQUEMA_POR_MATERIAL[material];

    const arqCategorias = path.join(base, "categorias.json");
    if (fs.existsSync(arqCategorias)) {
      const r = ConteudoCategorias.safeParse(lerJson(arqCategorias));
      if (r.success) categorias[material] = r.data;
      else erros.push(...formatarErros(rel(arqCategorias), r.error));
    }

    for (const arq of jsonsEm(path.join(base, "produtos"))) {
      const r = esquema.safeParse(lerJson(arq));
      if (!r.success) {
        erros.push(...formatarErros(rel(arq), r.error));
        continue;
      }
      if (path.basename(arq, ".json") !== r.data.id)
        erros.push({ arquivo: rel(arq), mensagem: `nome do arquivo deve ser "${r.data.id}.json"` });
      if (r.data.material !== material)
        erros.push({ arquivo: rel(arq), mensagem: `material "${r.data.material}" na pasta de "${material}"` });
      produtos.push(r.data);
    }

    for (const arq of jsonsEm(path.join(base, "ofertas"))) {
      const r = OfertasDoProduto.safeParse(lerJson(arq));
      if (!r.success) {
        erros.push(...formatarErros(rel(arq), r.error));
        continue;
      }
      const produto = produtos.find((p) => p.id === r.data.produtoId);
      if (!produto) {
        erros.push({ arquivo: rel(arq), mensagem: `produto "${r.data.produtoId}" não existe` });
        continue;
      }
      if (path.basename(arq, ".json") !== produto.id)
        erros.push({ arquivo: rel(arq), mensagem: `nome do arquivo deve ser "${produto.id}.json"` });
      r.data.ofertas.forEach((o, i) => {
        if (!produto.apresentacoes.some((a) => a.id === o.apresentacaoId))
          erros.push({
            arquivo: rel(arq),
            mensagem: `ofertas.${i}.apresentacaoId: "${o.apresentacaoId}" não existe em ${produto.id}`,
          });
      });
      ofertas.set(produto.id, r.data.ofertas);
    }
  }

  const ids = new Map<string, number>();
  produtos.forEach((p) => ids.set(p.id, (ids.get(p.id) ?? 0) + 1));
  for (const [id, n] of ids)
    if (n > 1) erros.push({ arquivo: "data/", mensagem: `id de produto duplicado: ${id}` });

  return { catalogo: { produtos, ofertas, categorias }, erros };
}

let cache: Catalogo | undefined;

/** Catálogo para as páginas: lança se houver erro e aplica a regra de rascunhos. */
export function catalogo(): Catalogo {
  if (cache) return cache;
  const { catalogo: c, erros } = lerCatalogo();
  if (erros.length) {
    throw new Error(
      `Dados inválidos (rode "pnpm validar:dados"):\n` +
        erros.map((e) => `  ${e.arquivo} → ${e.mensagem}`).join("\n"),
    );
  }
  const visiveis = incluirRascunhos() ? c.produtos : c.produtos.filter((p) => p.revisao.status === "publicado");
  cache = { ...c, produtos: visiveis };
  return cache;
}
