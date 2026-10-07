/**
 * pnpm gerar:json-schema — gera data/schemas/*.schema.json a partir dos esquemas
 * zod, para autocomplete/validação no editor ("$schema" em cada JSON).
 * Regras cruzadas (fontes referenciadas, URL da loja...) só o validar:dados pega.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ArtigoGuia, Glossario, ConteudoCategorias, Destaques, OfertasDoProduto, ProdutoSistemaAdesivo } from "../src/lib/esquema";

const saida = path.resolve("data/schemas");
fs.mkdirSync(saida, { recursive: true });
const alvos = {
  "produto-sistema-adesivo": ProdutoSistemaAdesivo,
  ofertas: OfertasDoProduto,
  categorias: ConteudoCategorias,
  destaques: Destaques,
  "artigo-guia": ArtigoGuia,
  glossario: Glossario,
};
for (const [nome, esquema] of Object.entries(alvos)) {
  const json = z.toJSONSchema(esquema, { io: "input", unrepresentable: "any" });
  fs.writeFileSync(path.join(saida, `${nome}.schema.json`), JSON.stringify(json, null, 2) + "\n");
  console.log(`data/schemas/${nome}.schema.json`);
}
