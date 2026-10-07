"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buscar } from "@/lib/busca";
import { formatarBRL } from "@/lib/formato";
import { ClassBadge } from "../ClassBadge";
import { LegendaNotacao, Notacao } from "../Notacao";
import { EstadoVazio } from "../EstadoVazio";
import { Frasco, IconeAlerta, IconeFechar } from "../Icones";
import type { ColunaComparador, ItemIndice, ValorSimNao } from "../tipos";
import { GRUPOS_LINHA, idsDaUrl, linhaIgual, montarLinhas, type Celula } from "./linhas";
import { definirComparacao, LIMITE_COMPARACAO } from "./selecao";

function SimNao({ valor }: { valor: ValorSimNao }) {
  if (valor === "sim")
    return (
      <span className="yes">
        <span aria-hidden="true">✓ </span>Sim
      </span>
    );
  if (valor === "nao")
    return (
      <span className="no">
        <span aria-hidden="true">— </span>Não
      </span>
    );
  return <span className="ni">Não informado</span>;
}

function ValorCelula({ c }: { c: Celula }) {
  if (c.tipo === "simnao") return <SimNao valor={c.valor} />;
  if (c.tipo === "passos")
    return (
      <ul className="list-none p-0 m-0">
        {c.itens.map((i) => (
          <li key={i.subcategoria}>
            {i.estrategia && <span className="muted">{i.estrategia}: </span>}
            <span className="num">{i.n}</span>
            <span className="sr-only"> {i.n === 1 ? "passo" : "passos"}</span>
            <span aria-hidden="true"> · </span>
            <Notacao subcategoria={i.subcategoria} />
          </li>
        ))}
      </ul>
    );
  if (c.tipo === "preco")
    return c.centavos !== undefined ? (
      <>
        <span className="num font-semibold">a partir de {formatarBRL(c.centavos)}</span>
        <br />
        <Link href={`/produto/${c.produtoId}#precos`}>ver preços</Link>
      </>
    ) : (
      <span className="ni">Preço não encontrado</span>
    );
  return <>{c.texto}</>;
}

/** Comparador de sistemas `/comparar?ids=a,b,c` — DESIGN §4.6. Estado na URL. */
export function Comparador({ colunas, indice }: { colunas: ColunaComparador[]; indice: ItemIndice[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const validos = new Set(colunas.map((c) => c.card.id));
  const { ids, invalidos, excedente } = idsDaUrl(params.get("ids"), validos, LIMITE_COMPARACAO);
  const selecionadas = ids.map((id) => colunas.find((c) => c.card.id === id)!);
  const linhas = montarLinhas(selecionadas);
  const [soDiferencas, setSoDiferencas] = useState(false);
  const [rolado, setRolado] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const [termo, setTermo] = useState("");

  // A seleção da barra acompanha a URL (link compartilhado vira a seleção atual).
  const chaveIds = ids.join(",");
  useEffect(() => {
    if (chaveIds) definirComparacao(chaveIds.split(","));
  }, [chaveIds]);

  function irPara(novos: string[]) {
    definirComparacao(novos);
    router.replace(novos.length ? `/comparar?ids=${novos.join(",")}` : "/comparar", { scroll: false });
  }

  const achados = termo.trim() ? new Set(buscar(indice, termo).map((i) => i.id)) : null;
  const candidatos = indice.filter((i) => (!achados || achados.has(i.id)) && !ids.includes(i.id));

  const avisos = (
    <>
      {invalidos.length > 0 && (
        <p className="note note--warn mb-4" role="status">
          <IconeAlerta />
          <span>
            {invalidos.length === 1 ? "Um produto do link não existe mais e foi ignorado" : `${invalidos.length} produtos do link não existem mais e foram ignorados`}.
          </span>
        </p>
      )}
      {excedente && (
        <p className="note note--warn mb-4" role="status">
          <IconeAlerta />
          <span>Limite de {LIMITE_COMPARACAO} produtos na comparação — exibindo os {LIMITE_COMPARACAO} primeiros.</span>
        </p>
      )}
    </>
  );

  const adicionar = (
    <dialog ref={dialogo} className="sheet" aria-labelledby="titulo-adicionar" onClick={(e) => e.target === dialogo.current && dialogo.current.close()}>
      <div className="sheet__head">
        <h2 id="titulo-adicionar" className="h3-sans">
          Adicionar produto
        </h2>
        <button type="button" className="icon-btn" aria-label="Fechar" onClick={() => dialogo.current?.close()}>
          <IconeFechar />
        </button>
      </div>
      <label htmlFor="busca-comparar" className="sr-only">
        Pesquisar produto para adicionar
      </label>
      <div className="search">
        <input id="busca-comparar" type="search" placeholder="Pesquisar sistema, marca ou produto" value={termo} onChange={(e) => setTermo(e.target.value)} autoComplete="off" />
      </div>
      <ul className="list-none p-0 m-0">
        {candidatos.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              className="suggest__item w-full text-left border-0 bg-transparent"
              disabled={ids.length >= LIMITE_COMPARACAO}
              onClick={() => {
                irPara([...ids, i.id]);
                dialogo.current?.close();
                setTermo("");
              }}
            >
              <span className="min-w-0 flex-1">
                {i.nome} <small>— {i.fabricante}</small>
              </span>
              <ClassBadge grupo={i.grupo} />
            </button>
          </li>
        ))}
        {!candidatos.length && <li className="suggest__empty">Nada encontrado para “{termo}”.</li>}
      </ul>
    </dialog>
  );

  const cabecalho = (
    <header className="pagehead sm:flex-row sm:items-center sm:justify-between">
      <h1>Comparar sistemas</h1>
      <div className="flex flex-wrap gap-2">
        {ids.length < LIMITE_COMPARACAO && (
          <button type="button" className="btn btn--secondary" onClick={() => dialogo.current?.showModal()}>
            Adicionar produto
          </button>
        )}
        {ids.length > 0 && (
          <button type="button" className="btn btn--ghost" onClick={() => irPara([])}>
            Limpar
          </button>
        )}
      </div>
    </header>
  );

  if (selecionadas.length < 2) {
    return (
      <>
        {cabecalho}
        {avisos}
        <EstadoVazio titulo="Selecione de 2 a 4 produtos para comparar.">
          {selecionadas.length === 1 && <p className="muted">Você selecionou {selecionadas[0].card.nome}. Adicione mais 1.</p>}
          <Link className="btn btn--primary" href="/#classificacao">
            Explorar categorias
          </Link>
        </EstadoVazio>
        {adicionar}
      </>
    );
  }

  return (
    <>
      {cabecalho}
      {avisos}
      <label className="switch">
        <input type="checkbox" checked={soDiferencas} onChange={(e) => setSoDiferencas(e.target.checked)} />
        Destacar diferenças
      </label>
      <div
        className={`tablewrap mt-2${rolado ? " is-scrolled" : ""}`}
        role="region"
        aria-label="Tabela de comparação, role para os lados"
        tabIndex={0}
        onScroll={(e) => setRolado(e.currentTarget.scrollLeft > 0)}
      >
        <table className={`cmp${soDiferencas ? " only-diff" : ""}`} data-testid="compare-table">
          <caption className="sr-only">Comparação entre {selecionadas.map((c) => c.card.nome).join(", ")}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Atributo</span>
              </th>
              {selecionadas.map(({ card }) => (
                <th key={card.id} scope="col" data-produto-id={card.id}>
                  <div className="cmphead">
                    <span className="cmphead__img" aria-hidden="true">
                      {card.imagem ? <Image src={card.imagem.arquivo} alt="" fill sizes="64px" style={{ objectFit: "contain" }} /> : <Frasco />}
                    </span>
                    <Link href={`/produto/${card.id}`}>{card.nome}</Link>
                    <span className="caption">{card.fabricante}</span>
                    <ClassBadge grupo={card.grupo} subcategoria={card.grupo === "universal" ? undefined : card.subcategorias[0]} />
                    <button type="button" className="icon-btn" aria-label={`Remover ${card.nome}`} onClick={() => irPara(ids.filter((x) => x !== card.id))}>
                      <IconeFechar />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {GRUPOS_LINHA.map((grupo) => (
            <tbody key={grupo}>
              <tr className="grouprow">
                <th scope="rowgroup" colSpan={selecionadas.length + 1}>
                  {grupo}
                </th>
              </tr>
              {linhas
                .filter((l) => l.grupo === grupo)
                .map((l) => {
                  const igual = linhaIgual(l);
                  return (
                    <tr key={l.atributo} className={soDiferencas ? (igual ? "same" : "diff") : undefined} data-testid="compare-row" data-atributo={l.atributo}>
                      <th scope="row">
                        {l.rotulo}
                        {soDiferencas && !igual && <span className="sr-only"> (diferente)</span>}
                      </th>
                      {l.celulas.map((c, i) => (
                        <td key={selecionadas[i].card.id}>
                          <ValorCelula c={c} />
                          {l.divergencias[i]?.map((d) => (
                            <details key={d.campo} className="cmp-diverge">
                              <summary>
                                <IconeAlerta /> Divergência entre fontes
                              </summary>
                              <ul className="list-none p-0">
                                {d.versoes.map((v, j) => (
                                  <li key={j}>
                                    {v.fontes.map((f) => f.titulo).join(", ")}: <strong>{v.valor}</strong>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ))}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          ))}
        </table>
      </div>
      <LegendaNotacao className="text-left" />
      {adicionar}
    </>
  );
}
