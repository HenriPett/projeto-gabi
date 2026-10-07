"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { LinhaLoja } from "@/lib/precos";
import { formatarBRL, formatarData } from "@/lib/formato";
import { IconeAlerta, IconeExterno, IconeTrofeu } from "../Icones";
import type { ComparacaoApresentacao } from "../tipos";

const SEM_PRECO = "Não encontrado / indisponível";

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/** Evita abrir 2 abas no duplo clique (PR-26). */
function useCliqueUnico() {
  const ultimo = useRef(0);
  return (e: React.MouseEvent) => {
    const agora = Date.now();
    if (agora - ultimo.current < 1000) e.preventDefault();
    ultimo.current = agora;
  };
}

function LinhaDeLoja({ l, destacar, onComprar }: { l: LinhaLoja; destacar: boolean; onComprar: (e: React.MouseEvent) => void }) {
  const temPreco = l.centavos !== undefined;
  const melhor = destacar && l.menorPreco;
  return (
    <li
      className={`store${melhor ? " store--best" : ""}${temPreco ? "" : " store--na"}`}
      data-testid="price-row"
      data-loja={l.lojaId}
      data-status={l.status}
      data-menor-preco={melhor}
      data-centavos={l.centavos}
    >
      {melhor && (
        <span className="trophy" data-testid="best-price-badge">
          <IconeTrofeu />
          MENOR PREÇO
        </span>
      )}
      <h3 className="store__name">{l.lojaNome}</h3>
      <p className="store__date" data-testid="price-updated-at">
        {l.consultadoEm ? `Última atualização: ${formatarData(l.consultadoEm)}` : "Sem registro de consulta"}
      </p>
      <p className="store__price" data-testid="price-value">
        {temPreco ? formatarBRL(l.centavos!) : SEM_PRECO}
      </p>
      {temPreco && l.url && (
        <a
          className="btn btn--cta btn--block"
          href={l.url}
          target="_blank"
          rel="noopener sponsored"
          data-testid="btn-comprar"
          onClick={onComprar}
        >
          Comprar na {l.lojaNome}
          <IconeExterno />
          <span className="sr-only"> (abre o site da loja em nova aba)</span>
        </a>
      )}
    </li>
  );
}

/**
 * Comparar preços — DESIGN §4.7. Toda regra (ordem, menor preço, empate,
 * economia, comparabilidade) vem pronta de compararPrecos (src/lib/precos.ts).
 */
export function SecaoPrecos({ comparacoes }: { comparacoes: ComparacaoApresentacao[] }) {
  const [sel, setSel] = useState(0);
  const online = useOnline();
  const onComprar = useCliqueUnico();

  const temPreco = (c: ComparacaoApresentacao) => c.comparacao.linhas.some((l) => l.centavos !== undefined);
  const atual = comparacoes[sel];
  const datas = comparacoes.flatMap((c) => c.comparacao.linhas.flatMap((l) => (l.consultadoEm ? [l.consultadoEm] : []))).sort();
  const ultimaData = datas.at(-1);
  const outras = comparacoes.filter((x) => x !== atual && temPreco(x));
  // Só quando NENHUMA apresentação é comparável e há preço em mais de uma — independe da seleção.
  const nenhumaComparavel = !comparacoes.some((x) => x.comparacao.comparavel);
  const apresentacoesDiferentes = nenhumaComparavel && comparacoes.filter(temPreco).length > 1;

  let corpo: React.ReactNode;
  if (!atual) {
    corpo = <p className="note note--neutral">Nenhuma das três lojas tem este produto disponível no momento.</p>;
  } else {
    const c = atual.comparacao;

    if (apresentacoesDiferentes) {
      // Nenhuma apresentação comparável: lista cada oferta, sem ranking/selo/economia.
      const ofertas = comparacoes.flatMap((x) =>
        x.comparacao.linhas.filter((l) => l.status !== "nao-encontrado").map((l) => ({ l, descricao: x.descricao })),
      );
      const lojasSem = c.linhas.filter((l) => !ofertas.some((o) => o.l.lojaId === l.lojaId));
      corpo = (
        <div className="note note--warn" role="note" data-testid="presentations-differ">
          <IconeAlerta />
          <div>
            <p className="note__title">Apresentações diferentes — comparação de preço não disponível.</p>
            <p className="mt-1">As lojas vendem apresentações diferentes deste produto. Mostramos cada oferta, sem ranking.</p>
            <div className="otherpres">
              <ul>
                {ofertas.map(({ l, descricao }) => (
                  <li key={`${l.lojaId}-${descricao}`} data-testid="price-row" data-loja={l.lojaId} data-status={l.status} data-menor-preco="false" data-centavos={l.centavos}>
                    <span>
                      <strong>{l.lojaNome}</strong> — {descricao}
                      {l.consultadoEm && <span className="caption block">Última atualização: {formatarData(l.consultadoEm)}</span>}
                    </span>
                    <span className="num">
                      {l.centavos !== undefined ? formatarBRL(l.centavos) : SEM_PRECO}
                      {l.centavos !== undefined && l.url && (
                        <>
                          {" · "}
                          <a href={l.url} target="_blank" rel="noopener sponsored" onClick={onComprar}>
                            ver na loja ↗<span className="sr-only"> ({l.lojaNome}, abre o site da loja em nova aba)</span>
                          </a>
                        </>
                      )}
                    </span>
                  </li>
                ))}
                {lojasSem.map((l) => (
                  <li key={l.lojaId} data-testid="price-row" data-loja={l.lojaId} data-status="nao-encontrado" data-menor-preco="false">
                    <strong>{l.lojaNome}</strong>
                    <span>{SEM_PRECO}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    } else {
      const outrasLinhas = outras.flatMap((x) => x.comparacao.linhas.filter((l) => l.centavos !== undefined).map((l) => ({ l, descricao: x.descricao })));
      corpo = (
        <>
          <ul className="stores">
            {c.linhas.map((l) => (
              // Todas iguais (sem economia): o selo em todas não informa nada — fica só o aviso abaixo.
              <LinhaDeLoja key={l.lojaId} l={l} destacar={c.comparavel && c.economiaCentavos !== undefined} onComprar={onComprar} />
            ))}
          </ul>
          {c.economiaCentavos !== undefined && (
            <p className="note note--best mt-4" data-testid="savings-text">
              <span>
                Você economiza <strong className="num">{formatarBRL(c.economiaCentavos)}</strong> em relação ao maior preço encontrado.
              </span>
            </p>
          )}
          {c.comparavel && c.economiaCentavos === undefined && (
            <p className="nota-igual mt-4">
              <b aria-hidden="true">=</b>
              Mesmo preço nas lojas comparadas.
            </p>
          )}
          {!temPreco(atual) && <p className="note note--neutral mt-4">Nenhuma das três lojas tem este produto disponível no momento.</p>}
          {outrasLinhas.length > 0 && (
            <div className="note note--warn mt-4" role="note">
              <IconeAlerta />
              <div className="otherpres m-0 w-full">
                <p className="note__title">Outras apresentações (não comparadas)</p>
                <ul>
                  {outrasLinhas.map(({ l, descricao }) => (
                    <li key={`${l.lojaId}-${descricao}`}>
                      <span>
                        <strong>{l.lojaNome}</strong> — {descricao}
                      </span>
                      <span className="num">
                        {formatarBRL(l.centavos!)}
                        {l.url && (
                          <>
                            {" · "}
                            <a href={l.url} target="_blank" rel="noopener sponsored" onClick={onComprar}>
                              ver na loja ↗<span className="sr-only"> ({l.lojaNome}, abre o site da loja em nova aba)</span>
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      );
    }
  }

  const multiplas = !apresentacoesDiferentes && comparacoes.length > 1;

  return (
    <section className="section" id="precos" aria-labelledby="titulo-precos" data-testid="price-section">
      <h2 id="titulo-precos" tabIndex={-1}>
        Comparar preços
      </h2>
      {!online && (
        <p className="note note--warn mt-3" role="status" data-testid="offline-banner">
          <IconeAlerta />
          <span>Você está offline — preços{ultimaData ? ` de ${formatarData(ultimaData)}` : ""} podem estar desatualizados.</span>
        </p>
      )}
      {atual && !apresentacoesDiferentes && (
        <div className="pricehead">
          <span className="idchip">
            <strong>{atual.identificacao}</strong>
            {atual.codigo && <span className="muted">· cód. {atual.codigo}</span>}
          </span>
        </div>
      )}
      {multiplas && atual && (
        <div className="mb-5">
          <p className="caption mb-2" id="rotulo-apresentacao">
            Apresentação comparada
          </p>
          <div className="seg" role="radiogroup" aria-labelledby="rotulo-apresentacao" data-testid="presentation-selector">
            {comparacoes.map((x, i) => (
              <button
                key={x.apresentacaoId}
                type="button"
                role="radio"
                aria-checked={i === sel}
                tabIndex={i === sel ? 0 : -1}
                onClick={() => setSel(i)}
                onKeyDown={(e) => {
                  const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                  if (!d) return;
                  e.preventDefault();
                  const n = (i + d + comparacoes.length) % comparacoes.length;
                  setSel(n);
                  (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
                }}
              >
                {x.descricao}
              </button>
            ))}
          </div>
        </div>
      )}
      {corpo}
      <p className="caption mt-4">
        Preços coletados nas lojas na data indicada e podem ter mudado. Confirme no site da loja.{" "}
        <a href="/metodologia#precos">Como comparamos preços</a>
      </p>
    </section>
  );
}
