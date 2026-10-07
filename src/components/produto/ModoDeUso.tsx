"use client";

import type { ComponentType, SVGProps } from "react";
import { SUBCATEGORIA, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { DivergenceNote } from "../DivergenceNote";
import { IconeAr, IconeCamadas, IconeDente, IconeExterno, IconeInfo, IconeLuz, IconeMao, IconeRelogio, IconeSetaBaixo } from "../Icones";
import { SourceLink } from "../SourceLink";
import { UniversalPaths } from "../StepDiagram";
import type { ProtocoloDTO } from "../tipos";
import { useEstrategia } from "./estrategia";

/** Hífen inseparável entre números ("1‑2 gotas", "10‑20 s"): o intervalo não pode quebrar de linha. */
const semQuebraEntreNumeros = (t: string) => t.replace(/(\d)-(\d)/g, "$1\u2011$2");

const ICONE_PARAMETRO: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  tempo: IconeRelogio,
  camadas: IconeCamadas,
  friccao: IconeMao,
  "jato-de-ar": IconeAr,
  luz: IconeLuz,
  substrato: IconeDente,
  outro: IconeInfo,
};

const dois = (n: number) => String(n).padStart(2, "0");

function Etapas({ protocolo }: { protocolo: ProtocoloDTO }) {
  return (
    <ol className="usteps usteps--fade" key={protocolo.id} data-testid="protocol" data-protocolo-id={protocolo.id}>
      {protocolo.etapas.flatMap((e, i) => [
        i > 0 && (
          <li key={`c-${i}`} className="uconn" aria-hidden="true">
            <IconeSetaBaixo />
          </li>
        ),
        <li key={i} className="ustep" data-testid="protocol-step" data-step={dois(i + 1)}>
          <span className="ustep__n" aria-hidden="true">
            {dois(i + 1)}
          </span>
          <div>
            <h3>
              <span className="sr-only">Etapa {i + 1}: </span>
              {e.titulo}
            </h3>
            <p>{semQuebraEntreNumeros(e.descricao)}</p>
            {e.parametros.length > 0 && (
              <ul className="params" aria-label="Parâmetros">
                {e.parametros.map((p, j) => {
                  const Icone = ICONE_PARAMETRO[p.tipo] ?? IconeInfo;
                  return (
                    <li key={j}>
                      <Icone />
                      {semQuebraEntreNumeros(p.texto)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </li>,
      ])}
    </ol>
  );
}

/**
 * Modo de Uso — DESIGN §4.3 item 8. Universais: troca só diagrama e etapas
 * conforme a estratégia (§4.5). Sem protocolo oficial → aviso, nunca genérico.
 */
export function ModoDeUso({
  fabricante,
  protocolos,
  subcategoriaFixa,
}: {
  fabricante: string;
  protocolos: ProtocoloDTO[];
  /** Não universais: a única subcategoria do produto. */
  subcategoriaFixa?: SubcategoriaId;
}) {
  const ctx = useEstrategia();
  const sub = ctx?.atual ?? subcategoriaFixa!;
  const protocolo = protocolos.find((p) => p.aplicaA.includes(sub));
  const ifu = protocolo?.fontes.find((f) => f.tipo === "ifu") ?? protocolo?.fontes[0];
  const nomeEstrategia = SUBCATEGORIA[sub].rotulo.toLowerCase();

  return (
    <section className="usage" aria-labelledby="titulo-uso">
      <div className="usage__inner">
        <div className="usage__head">
          <p className="sobretitulo">Protocolo do fabricante</p>
          <h2 id="titulo-uso">Modo de Uso</h2>
          {protocolo && ifu && (
            <p className="small muted">
              Segundo a {ifu.tipo === "ifu" ? "IFU oficial" : "documentação oficial"} de {fabricante}
              {ifu.versao ? ` (${ifu.versao})` : ""}. Este protocolo é específico deste produto
              {ctx ? ` — estratégia: ${nomeEstrategia}` : ""}.{" "}
              <a href={ifu.url} target="_blank" rel="noopener">
                Ver {ifu.tipo === "ifu" ? "IFU" : "documento"} original
                <IconeExterno className="inline h-3.5 w-3.5 align-[-2px] ml-1" />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </p>
          )}
          {/* Obrigatório aqui: o texto das etapas pode não ser literal da IFU. */}
          {protocolo && ifu?.observacao && (
            <p className="caption mt-1" data-testid="source-note">
              {ifu.observacao}
            </p>
          )}
          {ctx && (
            <p className="sr-only" aria-live="polite">
              {protocolo ? `Protocolo: ${nomeEstrategia}, ${protocolo.etapas.length} etapas` : `Protocolo: ${nomeEstrategia}, não localizado`}
            </p>
          )}
        </div>

        {ctx && <UniversalPaths atual={sub} indicadas={ctx.indicadas} compacto />}

        {protocolo ? (
          <>
            {protocolo.divergencias.map((d) => (
              <div key={d.campo} className="mb-4">
                <DivergenceNote divergencia={d} />
              </div>
            ))}
            <Etapas protocolo={protocolo} />
            {protocolo.observacoes.length > 0 && (
              <ul className="bullets mt-6 small">
                {protocolo.observacoes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            )}
            <p className="caption mt-6">Sempre confirme na embalagem do lote em uso.</p>
            <SourceLink fontes={protocolo.fontes} />
          </>
        ) : (
          <div className="note note--warn" role="note">
            <IconeInfo />
            <p>
              <strong className="note__title">Protocolo oficial não localizado</strong>
              <br />
              Ainda não temos a IFU do fabricante para {ctx ? `a estratégia ${nomeEstrategia}` : "este produto"}. Não
              exibimos protocolo genérico da categoria — consulte a embalagem.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
