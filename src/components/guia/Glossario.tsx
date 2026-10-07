"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { normalizar } from "@/lib/busca";
import { SourceLink } from "../SourceLink";
import type { FonteDTO } from "../tipos";

export interface TermoDTO {
  id: string;
  termo: string;
  sigla?: string;
  nomeCompleto?: string;
  sinonimos: string[];
  definicao: string;
  fontes: FonteDTO[];
  artigos: { slug: string; titulo: string }[];
  relacionados: { id: string; termo: string }[];
}

const letraDe = (t: string) => normalizar(t).charAt(0).toUpperCase();

/** Ordem alfabética pt-BR e agrupamento por letra (DESIGN §4.9 ③). */
export function agruparPorLetra(termos: readonly TermoDTO[]) {
  const ordenados = [...termos].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR", { sensitivity: "base" }));
  const grupos = new Map<string, TermoDTO[]>();
  for (const t of ordenados) grupos.set(letraDe(t.termo), [...(grupos.get(letraDe(t.termo)) ?? []), t]);
  return [...grupos.entries()].map(([letra, itens]) => ({ letra, itens }));
}

/** "MDP — 10-metacriloiloxidecil…"; sem nome por extenso diferente da sigla, só o termo. */
export function tituloDoTermo(t: Pick<TermoDTO, "termo" | "sigla" | "nomeCompleto">) {
  const extenso = t.nomeCompleto ?? t.termo;
  return t.sigla && normalizar(extenso) !== normalizar(t.sigla) ? `${t.sigla} — ${extenso}` : t.termo;
}

/** Filtro por termo, sigla, nome completo e sinônimo, sem acento nem caixa. */
export function filtrarTermos(termos: readonly TermoDTO[], q: string) {
  const n = normalizar(q);
  if (!n) return [...termos];
  return termos.filter((t) => [t.termo, t.sigla, t.nomeCompleto, ...t.sinonimos].some((x) => x && normalizar(x).includes(n)));
}

/** Âncora #termo-{id} atual: o termo-alvo nunca some com o filtro (DESIGN §4.9 ③). */
function useAlvo() {
  const [alvo, setAlvo] = useState<string | null>(null);
  useEffect(() => {
    const ler = () => setAlvo(window.location.hash.startsWith("#termo-") ? window.location.hash.slice(7) : null);
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, []);
  return alvo;
}

export function Glossario({ termos }: { termos: TermoDTO[] }) {
  const [q, setQ] = useState("");
  const consulta = useDeferredValue(q);
  const alvo = useAlvo();
  const filtrados = filtrarTermos(termos, consulta);
  const visiveis = alvo && consulta && !filtrados.some((t) => t.id === alvo) ? [...filtrados, ...termos.filter((t) => t.id === alvo)] : filtrados;
  const grupos = agruparPorLetra(visiveis);
  const indice = agruparPorLetra(termos);
  const plural = (n: number) => `${n} ${n === 1 ? "termo" : "termos"}`;

  return (
    <section className="glossario" aria-labelledby="titulo-glossario">
      <p className="sobretitulo">Termos</p>
      <h2 id="titulo-glossario" className="estudo-bloco__titulo mb-1">
        Glossário
      </h2>
      <p className="caption mb-4">{plural(termos.length)}</p>
      <div className="glossario__barra">
        <label className="sr-only" htmlFor="filtro-glossario">
          Filtrar termos
        </label>
        <input
          id="filtro-glossario"
          className="glossario__filtro"
          type="search"
          placeholder="Filtrar termos"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <nav aria-label="Índice do glossário" className="glossario__nav">
          <ul className="glossario__az">
            {indice.map((g) => (
              <li key={g.letra}>
                <a className="glossario__chip" href={`#letra-${g.letra.toLowerCase()}`}>
                  {g.letra}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="sr-only" aria-live="polite">
        {consulta ? plural(filtrados.length) : ""}
      </p>
      {visiveis.length === 0 ? (
        <p className="muted mt-4">Nenhum termo para “{consulta}”.</p>
      ) : (
        grupos.map((g) => (
          <div key={g.letra} className="glossario__letra">
            <p className="glossario__separador" id={`letra-${g.letra.toLowerCase()}`} aria-hidden="true">
              {g.letra}
            </p>
            <div className="glossario__grade">
              {g.itens.map((t) => (
                <article key={t.id} id={`termo-${t.id}`} className="glossario__termo" data-testid="glossario-termo" aria-labelledby={`h-termo-${t.id}`}>
                  <h3 id={`h-termo-${t.id}`} className="glossario__titulo">
                    {tituloDoTermo(t)}
                  </h3>
                  {t.sinonimos.length > 0 && <p className="caption">Também: {t.sinonimos.join(", ")}</p>}
                  <p className="glossario__def">{t.definicao}</p>
                  {t.relacionados.length > 0 && (
                    <p className="glossario__rel">
                      <span className="caption">Relacionados:</span>
                      {t.relacionados.map((r) => (
                        <a key={r.id} className="glossario__chip glossario__chip--rel" href={`/guia#termo-${r.id}`}>
                          {r.termo}
                        </a>
                      ))}
                    </p>
                  )}
                  <SourceLink fontes={t.fontes} compacto />
                  {t.artigos.map((a) => (
                    <p key={a.slug} className="caption">
                      Leia mais: <Link href={`/guia/${a.slug}`}>{a.titulo}</Link> →
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
