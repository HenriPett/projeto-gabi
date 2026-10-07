// Só taxonomia (sem zod): este módulo vai para o bundle do cliente.
import type { Produto } from "@/lib/esquema";
import { GRUPO, SUBCATEGORIA } from "@/lib/esquema/taxonomia";

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
    // "MDP" e "10-MDP" são o mesmo monômero; indexa as duas grafias (BUG-006)
    p.composicao.mdp.valor === "sim" ? "MDP 10-MDP" : "",
  ];
  return { id: p.id, nome: p.nomeComercial, fabricante: p.fabricante.nome, texto: normalizar(partes.join(" ")) };
}

type Termo = (texto: string) => boolean;

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const palavraInteira = (s: string) => new RegExp(`(^| )${s}( |$)`);

/**
 * Converte a consulta em termos:
 * - "N passo(s)" é uma expressão só ("3 passos" ≠ "3M" + "2 passos");
 * - número solto casa só palavra inteira ("1" não casa "2.1" nem "3m");
 * - demais termos: substring, também sem espaços ("prime bond" acha "Prime&Bond").
 */
function termosDe(consulta: string): Termo[] {
  const palavras = normalizar(consulta).split(" ").filter(Boolean);
  const termos: Termo[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i];
    if (/^\d+$/.test(p) && /^passos?$/.test(palavras[i + 1] ?? "")) {
      const re = palavraInteira(`${p} passos?`);
      termos.push((t) => re.test(t));
      i++;
    } else if (/^\d+$/.test(p)) {
      const re = palavraInteira(escapar(p));
      termos.push((t) => re.test(t));
    } else {
      termos.push((t) => t.includes(p) || t.replace(/ /g, "").includes(p));
    }
  }
  return termos;
}

/** Todos os termos da consulta precisam aparecer (AND). */
export function buscar(itens: readonly ItemBusca[], consulta: string): ItemBusca[] {
  const termos = termosDe(consulta);
  if (!termos.length) return [];
  return itens.filter((i) => termos.every((casa) => casa(i.texto)));
}
