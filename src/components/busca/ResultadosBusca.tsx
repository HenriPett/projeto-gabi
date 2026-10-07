"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { buscar } from "@/lib/busca";
import { GRUPO, SUBCATEGORIA, type GrupoId } from "@/lib/esquema/taxonomia";
import { EstadoVazio } from "../EstadoVazio";
import { ProductCard } from "../ProductCard";
import { MiniDiagram } from "../StepDiagram";
import { GRUPO_SINGULAR, urlSubcategoria } from "../rotulos";
import type { CardProduto, ItemIndice } from "../tipos";
import { categoriasQueCasam, expandirConsulta } from "./sugestoes";

const SUGESTOES = ["MDP", "2 passos", "Universal", "Autocondicionante"];

function lerQ(params: URLSearchParams): string {
  // URLSearchParams já decodifica; "%E0" malformado vira o texto cru, sem lançar.
  return (params.get("q") ?? "").slice(0, 200).trim();
}

/** Resultados `/busca?q=` — DESIGN §3.1 e §4.8. Categorias primeiro; depois produtos. */
export function ResultadosBusca({ indice, cards }: { indice: ItemIndice[]; cards: CardProduto[] }) {
  const params = useSearchParams();
  const q = lerQ(new URLSearchParams(params.toString()));
  const [grupo, setGrupo] = useState<GrupoId | null>(null);
  const [fabricante, setFabricante] = useState<string | null>(null);
  const [mdp, setMdp] = useState(false);
  const [hema, setHema] = useState(false);

  const categorias = useMemo(() => categoriasQueCasam(q), [q]);
  const achados = useMemo(() => {
    const ids = new Set(buscar(indice, expandirConsulta(q)).map((i) => i.id));
    return indice.filter((i) => ids.has(i.id));
  }, [indice, q]);
  const fabricantes = [...new Set(achados.map((i) => i.fabricante))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const grupos = (Object.keys(GRUPO) as GrupoId[]).filter((g) => achados.some((i) => i.grupo === g));
  const filtrados = achados.filter(
    (i) => (!grupo || i.grupo === grupo) && (!fabricante || i.fabricante === fabricante) && (!mdp || i.mdp) && (!hema || i.hema),
  );
  const total = categorias.length + filtrados.length;

  if (!q) {
    return (
      <>
        <h1 className="pt-4 pb-6">Pesquisar</h1>
        <p className="muted">Use a busca no topo: nome comercial, fabricante ou termos como MDP, 2 passos, Universal.</p>
      </>
    );
  }

  return (
    <>
      <h1 className="pt-4 pb-2">Resultados para “{q}”</h1>
      <p className="muted mb-6" aria-live="polite" role="status">
        {total} {total === 1 ? "resultado" : "resultados"} para ‘{q}’
      </p>

      {!achados.length && !categorias.length ? (
        <EstadoVazio titulo={`Nada encontrado para “${q}”.`}>
          <p className="muted">
            Tente o nome comercial, o fabricante ou termos como <em>MDP</em>, <em>2 passos</em>, <em>Universal</em>.
          </p>
          <ul className="flex flex-wrap justify-center gap-2 list-none p-0">
            {SUGESTOES.map((s) => (
              <li key={s}>
                <Link className="fchip" href={`/busca?q=${encodeURIComponent(s)}`}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </EstadoVazio>
      ) : (
        <>
          {categorias.length > 0 && (
            <section aria-labelledby="res-categorias" className="mb-10">
              <h2 id="res-categorias" className="mb-4">
                Categorias
              </h2>
              <ul className="cards">
                {categorias.map((id) => {
                  const s = SUBCATEGORIA[id];
                  return (
                    <li key={id} className={`grp grp--${s.grupo}`}>
                      <div className="grp__body">
                        <Link className="subcard" href={urlSubcategoria(id)} data-testid="search-result-item">
                          <span className="sobretitulo sobretitulo--muted">{GRUPO_SINGULAR[s.grupo]}</span>
                          <span className="subcard__label">{s.rotulo}</span>
                          <MiniDiagram subcategoria={id} />
                          <span className="subcard__arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {achados.length > 0 && (
            <section aria-labelledby="res-produtos">
              <h2 id="res-produtos" className="mb-4">
                Produtos
              </h2>
              <div className="toolbar" role="group" aria-label="Filtros">
                {grupos.length > 1 &&
                  grupos.map((g) => (
                    <button key={g} type="button" className="fchip" aria-pressed={grupo === g} onClick={() => setGrupo(grupo === g ? null : g)}>
                      {GRUPO[g].rotulo}
                    </button>
                  ))}
                {fabricantes.length > 1 &&
                  fabricantes.map((f) => (
                    <button key={f} type="button" className="fchip" aria-pressed={fabricante === f} onClick={() => setFabricante(fabricante === f ? null : f)}>
                      {f}
                    </button>
                  ))}
                <button type="button" className="fchip" aria-pressed={mdp} onClick={() => setMdp(!mdp)}>
                  Contém MDP
                </button>
                <button type="button" className="fchip" aria-pressed={hema} onClick={() => setHema(!hema)}>
                  Contém HEMA
                </button>
              </div>
              {filtrados.length ? (
                <ul className="cards">
                  {filtrados.map((i) => {
                    const card = cards.find((c) => c.id === i.id);
                    return card ? (
                      <li key={i.id} data-testid="search-result-item" data-produto-id={i.id}>
                        <ProductCard card={card} />
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : (
                <p className="note note--neutral">Nenhum produto com esses filtros.</p>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
