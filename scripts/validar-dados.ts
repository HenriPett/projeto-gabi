/**
 * pnpm validar:dados — valida todo data/ contra os esquemas zod.
 * Sai com código 1 se houver qualquer erro (usado no CI).
 */
import { lerCatalogo, dirDados } from "../src/lib/dados/carregar";

const { catalogo, erros } = lerCatalogo();
const n = catalogo.produtos.length;
const nOfertas = [...catalogo.ofertas.values()].reduce((s, o) => s + o.length, 0);

if (erros.length) {
  console.error(`✗ ${erros.length} erro(s) em ${dirDados()}:\n`);
  for (const e of erros) console.error(`  ${e.arquivo}\n    → ${e.mensagem}`);
  process.exit(1);
}
const rascunhos = catalogo.produtos.filter((p) => p.revisao.status === "rascunho").length;
const nGuia = Object.values(catalogo.guia).reduce((s, g) => s + (g?.length ?? 0), 0);
console.log(`✓ ${n} produto(s) (${rascunhos} rascunho), ${nOfertas} oferta(s), ${nGuia} artigo(s) do guia — dados válidos.`);
