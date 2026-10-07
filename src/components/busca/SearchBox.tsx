"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { ClassBadge } from "../ClassBadge";
import { IconeBusca, IconeFechar } from "../Icones";
import { Miniatura } from "../MidiaProduto";
import type { ItemIndice } from "../tipos";
import { destacar, sugerir, TITULO_GRUPO, type Sugestao } from "./sugestoes";

function Destaque({ rotulo, q }: { rotulo: string; q: string }) {
  return (
    <>
      {destacar(rotulo, q).map((p, i) => (p.marcado ? <mark key={i}>{p.texto}</mark> : <span key={i}>{p.texto}</span>))}
    </>
  );
}

/**
 * Busca fixa com sugestões (combobox ARIA 1.2) — DESIGN §3.1.
 * Debounce de 150ms; ↑↓ navegam, Enter abre, Esc fecha; "/" foca (desktop).
 */
export function SearchBox({ indice }: { indice: ItemIndice[] }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [valor, setValor] = useState("");
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const q = useDeferredValue(consulta);

  useEffect(() => {
    const t = setTimeout(() => setConsulta(valor.trim()), 150);
    return () => clearTimeout(t);
  }, [valor]);

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (alvo?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  const sugestoes = useMemo(() => sugerir(indice, q), [indice, q]);
  const expandido = aberto && q.length > 0;

  function abrir(s: Sugestao) {
    setAberto(false);
    setValor("");
    setConsulta("");
    router.push(s.href);
  }

  function enviar() {
    const termo = valor.trim();
    if (!termo) return;
    setAberto(false);
    router.push(`/busca?q=${encodeURIComponent(termo)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!expandido) return setAberto(true);
      const n = sugestoes.length;
      if (!n) return;
      setAtivo((a) => (e.key === "ArrowDown" ? (a + 1) % n : a <= 0 ? n - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (expandido && ativo >= 0 && sugestoes[ativo]) abrir(sugestoes[ativo]);
      else enviar();
    } else if (e.key === "Escape") {
      if (expandido) setAberto(false);
      else setValor("");
    }
  }

  let indiceGlobal = -1;
  const grupos = (["categoria", "produto", "fabricante", "componente"] as const)
    .map((tipo) => ({ tipo, itens: sugestoes.filter((s) => s.tipo === tipo) }))
    .filter((g) => g.itens.length);

  return (
    <form
      className={`search${valor ? " search--filled" : ""}`}
      role="search"
      action="/busca"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <label htmlFor={`${id}-q`} className="sr-only">
        Pesquisar sistema, marca ou produto
      </label>
      <IconeBusca className="search__icon" />
      <input
        ref={inputRef}
        id={`${id}-q`}
        name="q"
        type="search"
        placeholder="Pesquisar sistema, marca ou produto"
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={expandido}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expandido && ativo >= 0 ? `${id}-opt-${ativo}` : undefined}
        data-testid="search-input"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setAberto(true);
          setAtivo(-1);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        onKeyDown={onKeyDown}
      />
      {valor ? (
        <button
          type="button"
          className="icon-btn search__clear"
          aria-label="Limpar busca"
          onClick={() => {
            setValor("");
            setConsulta("");
            inputRef.current?.focus();
          }}
        >
          <IconeFechar />
        </button>
      ) : (
        <kbd className="search__kbd" aria-hidden="true">
          /
        </kbd>
      )}
      <ul className="suggest" id={listId} role="listbox" aria-label="Sugestões" hidden={!expandido} data-testid="search-results">
        {expandido && !sugestoes.length && (
          <li className="suggest__empty" role="presentation">
            Nada encontrado para “{q}”. Tente o nome comercial, o fabricante ou termos como <em>MDP</em>, <em>2 passos</em>,{" "}
            <em>Universal</em>.
          </li>
        )}
        {grupos.map((g) => (
          <li key={g.tipo} role="presentation">
            <div className="suggest__grp" role="presentation" id={`${id}-g-${g.tipo}`}>
              {TITULO_GRUPO[g.tipo]}
            </div>
            <ul role="group" aria-labelledby={`${id}-g-${g.tipo}`} className="list-none p-0 m-0">
              {g.itens.map((s) => {
                indiceGlobal++;
                const i = indiceGlobal;
                return (
                  <li
                    key={`${s.tipo}-${s.id}`}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={i === ativo}
                    className="suggest__item"
                    data-testid="search-result-item"
                    data-produto-id={s.tipo === "produto" ? s.id : undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => abrir(s)}
                    onMouseEnter={() => setAtivo(i)}
                  >
                    {s.tipo === "produto" && (
                      <span className="suggest__thumb" aria-hidden="true">
                        <Miniatura imagem={s.item.imagem} sizes="32px" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <Destaque rotulo={s.rotulo} q={q} />
                      {s.tipo === "produto" && <small> — {s.item.fabricante}</small>}
                      {(s.tipo === "fabricante" || s.tipo === "componente") && (
                        <small>
                          {" "}
                          — {s.total} {s.total === 1 ? "produto" : "produtos"}
                        </small>
                      )}
                    </span>
                    {s.tipo === "produto" && <ClassBadge grupo={s.item.grupo} />}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </form>
  );
}
