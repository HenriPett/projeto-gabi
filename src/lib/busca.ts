import { GRUPO, SUBCATEGORIA, type Produto } from "@/lib/esquema";

/**
 * Busca client-side sobre um índice pequeno gerado no build (§17).
 * Catálogo é de dezenas de itens: substring normalizada basta, sem biblioteca.
 */

/** minúsculas, sem acento, "&" vira espaço, espaços colapsados. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[&+/_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ItemBusca {
  id: string;
  nome: string;
  fabricante: string;
  /** Texto normalizado com tudo que é pesquisável. */
  texto: string;
}

export function itemDeBusca(p: Produto): ItemBusca {
  const subs = p.classificacao.subcategorias.map((s) => SUBCATEGORIA[s.id]);
  const partes = [
    p.nomeComercial,
    ...p.aliases,
    p.fabricante.nome,
    GRUPO[p.classificacao.grupo].rotulo,
    ...subs.map((s) => s.rotulo),
    ...p.composicao.componentes.map((c) => c.nome),
    p.composicao.mdp.valor === "sim" ? "MDP" : "",
  ];
  return { id: p.id, nome: p.nomeComercial, fabricante: p.fabricante.nome, texto: normalizar(partes.join(" ")) };
}

/** Todos os termos da consulta precisam aparecer (AND). */
export function buscar(itens: readonly ItemBusca[], consulta: string): ItemBusca[] {
  const termos = normalizar(consulta).split(" ").filter(Boolean);
  if (!termos.length) return [];
  // "prime bond" deve achar "Prime&Bond" e "primebond": compara também sem espaços
  return itens.filter((i) => {
    const compacto = i.texto.replace(/ /g, "");
    return termos.every((t) => i.texto.includes(t) || compacto.includes(t));
  });
}
