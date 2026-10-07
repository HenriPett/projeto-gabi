import { buscar, normalizar } from "@/lib/busca";
import { GRUPO, SUBCATEGORIA, SUBCATEGORIAS, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { urlSubcategoria } from "../rotulos";
import type { ItemIndice } from "../tipos";

/**
 * Sugestões do combobox do header (DESIGN §3.1): categorias, produtos,
 * fabricantes e componentes. Produtos vêm de `buscar` (src/lib/busca.ts).
 */

export const MAX_SUGESTOES = 8;

/** Sinônimos da spec: "dois passos", "self-etch", "total etch"… */
const SINONIMOS: [RegExp, string][] = [
  [/\bum passo\b/g, "1 passo"],
  [/\bdois passos\b/g, "2 passos"],
  [/\btres passos\b/g, "3 passos"],
  [/\b(\d)passos?\b/g, "$1 passos"],
  [/\bself ?etch\b/g, "autocondicionante"],
  [/\b(total|etch and rinse) ?etch\b/g, "condicionamento total"],
  [/\bselective ?etch\b/g, "condicionamento seletivo"],
  [/\bauto condicionantes?\b/g, "autocondicionante"],
  [/\buniversais\b/g, "universal"],
];

export function expandirConsulta(q: string): string {
  let n = normalizar(q);
  for (const [re, s] of SINONIMOS) n = n.replace(re, s);
  return n;
}

export type Sugestao =
  | { tipo: "categoria"; id: SubcategoriaId; rotulo: string; href: string }
  | { tipo: "produto"; id: string; rotulo: string; href: string; item: ItemIndice }
  | { tipo: "fabricante"; id: string; rotulo: string; href: string; total: number }
  | { tipo: "componente"; id: string; rotulo: string; href: string; total: number };

export const TITULO_GRUPO: Record<Sugestao["tipo"], string> = {
  categoria: "Categorias",
  produto: "Produtos",
  fabricante: "Fabricantes",
  componente: "Componentes",
};

const hrefBusca = (q: string) => `/busca?q=${encodeURIComponent(q)}`;

/** Todos os termos (AND) aparecem no texto normalizado, também sem espaços. */
function casa(texto: string, consulta: string): boolean {
  const t = normalizar(texto);
  const compacto = t.replace(/ /g, "");
  const termos = consulta.split(" ").filter(Boolean);
  return termos.length > 0 && termos.every((x) => t.includes(x) || compacto.includes(x));
}

export function categoriasQueCasam(q: string): SubcategoriaId[] {
  const c = expandirConsulta(q);
  if (!c) return [];
  return SUBCATEGORIAS.filter((id) => {
    const s = SUBCATEGORIA[id];
    const g = GRUPO[s.grupo];
    return casa(`${g.rotulo} ${g.id} ${s.rotulo}`, c);
  });
}

export function sugerir(indice: readonly ItemIndice[], q: string): Sugestao[] {
  const c = expandirConsulta(q);
  if (!c) return [];

  const categorias: Sugestao[] = categoriasQueCasam(q).map((id) => ({
    tipo: "categoria",
    id,
    rotulo: `${GRUPO[SUBCATEGORIA[id].grupo].rotulo} › ${SUBCATEGORIA[id].rotulo}`,
    href: urlSubcategoria(id),
  }));

  const achados = new Set(buscar(indice, c).map((i) => i.id));
  const produtos: Sugestao[] = indice
    .filter((i) => achados.has(i.id))
    .map((i) => ({ tipo: "produto", id: i.id, rotulo: i.nome, href: `/produto/${i.id}`, item: i }));

  const contar = (chaves: string[]) => {
    const m = new Map<string, { rotulo: string; total: number }>();
    for (const k of chaves) {
      const n = normalizar(k);
      const atual = m.get(n);
      m.set(n, { rotulo: atual?.rotulo ?? k, total: (atual?.total ?? 0) + 1 });
    }
    return [...m.values()].filter((v) => casa(v.rotulo, c));
  };

  const fabricantes: Sugestao[] = contar(indice.map((i) => i.fabricante)).map((f) => ({
    tipo: "fabricante",
    id: f.rotulo,
    rotulo: f.rotulo,
    href: hrefBusca(f.rotulo),
    total: f.total,
  }));

  const componentes: Sugestao[] = contar(indice.flatMap((i) => [...new Set(i.componentes)])).map((x) => ({
    tipo: "componente",
    id: x.rotulo,
    rotulo: x.rotulo,
    href: hrefBusca(x.rotulo),
    total: x.total,
  }));

  // Até 8 no total, mantendo representação de cada grupo antes de completar.
  const grupos = [categorias, produtos, fabricantes, componentes];
  const escolhidos = grupos.map(() => 0);
  let restante = MAX_SUGESTOES;
  while (restante > 0 && grupos.some((g, i) => escolhidos[i] < g.length)) {
    grupos.forEach((g, i) => {
      if (restante > 0 && escolhidos[i] < g.length) {
        escolhidos[i]++;
        restante--;
      }
    });
  }
  return grupos.flatMap((g, i) => g.slice(0, escolhidos[i]));
}

/** Divide o rótulo em partes para destacar o termo casado com <mark>. */
export function destacar(rotulo: string, q: string): { texto: string; marcado: boolean }[] {
  const termo = normalizar(q);
  if (!termo) return [{ texto: rotulo, marcado: false }];
  // normalizar remove acentos 1:1 em NFC comum; mapeia índice a índice
  const base = rotulo.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const i = base.indexOf(termo);
  if (i < 0 || base.length !== rotulo.length) return [{ texto: rotulo, marcado: false }];
  return [
    { texto: rotulo.slice(0, i), marcado: false },
    { texto: rotulo.slice(i, i + termo.length), marcado: true },
    { texto: rotulo.slice(i + termo.length), marcado: false },
  ].filter((p) => p.texto);
}
