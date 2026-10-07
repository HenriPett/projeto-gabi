"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { SubcategoriaId } from "@/lib/esquema/taxonomia";
import { EstadoVazio } from "../EstadoVazio";
import { IconeFechar, IconeFiltro } from "../Icones";
import { ProductCard } from "../ProductCard";
import type { CardProduto } from "../tipos";

type Ordem = "destaque" | "preco" | "az";

const ROTULO_ORDEM: Record<Ordem, string> = { destaque: "Em destaque", preco: "Menor preço", az: "A–Z" };

/** Ordena/filtra só a apresentação (o preço já vem de compararPrecos). */
export function filtrarEOrdenar(
  cards: readonly CardProduto[],
  ordem: Ordem,
  fabricantes: readonly string[],
  soMdp: boolean,
  destaques: readonly string[] = [],
) {
  const filtrados = cards.filter((c) => (!fabricantes.length || fabricantes.includes(c.fabricante)) && (!soMdp || c.mdp));
  const porNome = (a: CardProduto, b: CardProduto) => a.nome.localeCompare(b.nome, "pt-BR");
  const rank = (c: CardProduto) => (destaques.includes(c.id) ? destaques.indexOf(c.id) : Infinity);
  return [...filtrados].sort((a, b) => {
    if (ordem === "destaque" && rank(a) !== rank(b)) return rank(a) - rank(b);
    if (ordem === "preco") {
      const pa = a.aPartirDeCentavos ?? Infinity;
      const pb = b.aPartirDeCentavos ?? Infinity;
      if (pa !== pb) return pa - pb;
    }
    return porNome(a, b);
  });
}

function Controles({
  ordens,
  ordem,
  setOrdem,
  todos,
  fabricantes,
  setFabricantes,
  soMdp,
  setSoMdp,
  idBase,
}: {
  ordens: Ordem[];
  ordem: Ordem;
  setOrdem: (o: Ordem) => void;
  todos: string[];
  fabricantes: string[];
  setFabricantes: (f: string[]) => void;
  soMdp: boolean;
  setSoMdp: (v: boolean) => void;
  idBase: string;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={`${idBase}-ordem`}>
        Ordenar por
      </label>
      <select id={`${idBase}-ordem`} className="select" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
        {ordens.map((o) => (
          <option key={o} value={o}>
            Ordenar: {ROTULO_ORDEM[o]}
          </option>
        ))}
      </select>
      {todos.length > 1 && (
        <fieldset className="filter-group">
          <legend className="small muted">Fabricante:</legend>
          {todos.map((f) => {
            const on = fabricantes.includes(f);
            return (
              <button
                key={f}
                type="button"
                className="fchip"
                aria-pressed={on}
                onClick={() => setFabricantes(on ? fabricantes.filter((x) => x !== f) : [...fabricantes, f])}
              >
                {on && <span aria-hidden="true">✓</span>}
                {f}
              </button>
            );
          })}
        </fieldset>
      )}
      <button type="button" className="fchip" aria-pressed={soMdp} onClick={() => setSoMdp(!soMdp)}>
        {soMdp && <span aria-hidden="true">✓</span>}
        Contém MDP
      </button>
    </>
  );
}

/** Barra de ferramentas + grade de cards — DESIGN §4.2 item 4. */
export function ListaProdutos({
  cards,
  subcategoria,
  destaques = [],
}: {
  cards: CardProduto[];
  subcategoria: SubcategoriaId;
  /** Ids da curadoria (catalogo().destaques), na ordem. */
  destaques?: string[];
}) {
  // "Em destaque" só existe se a curadoria tiver produto desta lista.
  const temDestaque = cards.some((c) => destaques.includes(c.id));
  const ordens: Ordem[] = temDestaque ? ["destaque", "preco", "az"] : ["preco", "az"];
  const [ordem, setOrdem] = useState<Ordem>(temDestaque ? "destaque" : "az");
  const [fabricantes, setFabricantes] = useState<string[]>([]);
  const [soMdp, setSoMdp] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);

  const todos = useMemo(() => [...new Set(cards.map((c) => c.fabricante))].sort((a, b) => a.localeCompare(b, "pt-BR")), [cards]);
  const visiveis = useMemo(() => filtrarEOrdenar(cards, ordem, fabricantes, soMdp, destaques), [cards, ordem, fabricantes, soMdp, destaques]);
  const filtrosAtivos = fabricantes.length + (soMdp ? 1 : 0);
  const props = { ordens, ordem, setOrdem, todos, fabricantes, setFabricantes, soMdp, setSoMdp };

  if (!cards.length) {
    return (
      <EstadoVazio titulo="Nenhum produto cadastrado nesta categoria ainda.">
        <Link href="/#classificacao">Ver outras categorias</Link>
      </EstadoVazio>
    );
  }

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--secondary toolbar__sheet-btn" onClick={() => sheet.current?.showModal()}>
          <IconeFiltro />
          Filtrar e ordenar{filtrosAtivos ? ` (${filtrosAtivos})` : ""}
        </button>
        <div className="toolbar__inline">
          <Controles {...props} idBase="inline" />
        </div>
      </div>
      <dialog ref={sheet} className="sheet" aria-labelledby="titulo-filtros" onClick={(e) => e.target === sheet.current && sheet.current.close()}>
        <div className="sheet__head">
          <h2 id="titulo-filtros" className="h3-sans">
            Filtrar e ordenar
          </h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={() => sheet.current?.close()}>
            <IconeFechar />
          </button>
        </div>
        <div className="stack">
          <Controles {...props} idBase="sheet" />
        </div>
        <button type="button" className="btn btn--primary btn--block mt-6" onClick={() => sheet.current?.close()}>
          Ver {visiveis.length} {visiveis.length === 1 ? "produto" : "produtos"}
        </button>
      </dialog>
      <p className="sr-only" aria-live="polite">
        {visiveis.length} {visiveis.length === 1 ? "produto exibido" : "produtos exibidos"}
      </p>
      {visiveis.length ? (
        <ul className="cards">
          {visiveis.map((c) => (
            <li key={c.id}>
              <ProductCard card={c} subcategoriaAtual={subcategoria} />
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVazio titulo="Nenhum produto com esses filtros.">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setFabricantes([]);
              setSoMdp(false);
            }}
          >
            Limpar filtros
          </button>
        </EstadoVazio>
      )}
    </>
  );
}
