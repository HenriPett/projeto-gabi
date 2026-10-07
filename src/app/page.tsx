import Image from "next/image";
import Link from "next/link";
import { catalogo } from "@/lib/dados/carregar";
import { GRUPO, SUBCATEGORIA, type GrupoId } from "@/lib/esquema/taxonomia";
import { formatarBRL, formatarData } from "@/lib/formato";
import { maioresEconomias } from "@/lib/precos";
import { Frasco, IconeLivro, IconeMoeda } from "@/components/Icones";
import { LegendaNotacao, Notacao } from "@/components/Notacao";
import { MiniDiagram } from "@/components/StepDiagram";
import { urlSubcategoria } from "@/components/rotulos";

const GUIA = [
  "Como escolher a estratégia adesiva?",
  "Convencional x autocondicionante",
  "O que é adesivo universal?",
  "O que é MDP?",
  "Esmalte x dentina",
  "Condicionamento seletivo",
  "Camada híbrida",
];

const plural = (n: number) => `${n} ${n === 1 ? "produto" : "produtos"}`;

export default function Home() {
  const { produtos, ofertas, categorias } = catalogo();
  const conteudo = categorias["sistemas-adesivos"];
  const porSub = (id: string) => produtos.filter((p) => p.classificacao.subcategorias.some((s) => s.id === id)).length;
  const porGrupo = (g: GrupoId) => produtos.filter((p) => p.classificacao.grupo === g).length;

  const economias = maioresEconomias(ofertas, 5).flatMap(({ produtoId, comparacao }) => {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p) return [];
    const a = p.apresentacoes.find((x) => x.id === comparacao.apresentacaoId);
    return [{ p, apresentacao: a?.descricao, comparacao }];
  });
  const datas = economias.flatMap((e) => e.comparacao.linhas.flatMap((l) => (l.centavos !== undefined && l.consultadoEm ? [l.consultadoEm] : []))).sort();

  return (
    <div className="pagina">
      <section className="hero" aria-labelledby="titulo-home">
        <p className="sobretitulo">Classificação</p>
        <h1 id="titulo-home">SISTEMAS ADESIVOS</h1>
        <p>Consulte a classificação, estude o modo de uso e compare preços nas principais dentais.</p>
        <div className="hero__rule" aria-hidden="true" />
      </section>

      <section id="classificacao" aria-label="Classificação dos sistemas adesivos" className="classgrid">
        {Object.values(GRUPO).map((g) => {
          const def = conteudo?.grupos[g.id]?.explicacao.texto;
          return (
            <div key={g.id} className={`grp grp--${g.id}`} data-testid={`group-${g.slug}`}>
              <div className="grp__head">
                <h2>
                  <span className={`marker marker--${g.id}`} aria-hidden="true" />
                  {g.rotulo}
                </h2>
                <span className="grp__count">{plural(porGrupo(g.id))}</span>
                {def && (
                  <>
                    <button type="button" className="icon-btn" popoverTarget={`def-${g.id}`} aria-label={`O que são sistemas ${g.rotulo.toLowerCase()}?`}>
                      ?
                    </button>
                    <div id={`def-${g.id}`} popover="auto" className="popover" role="dialog" aria-label={g.rotulo}>
                      <p className="h3-sans">{g.rotulo}</p>
                      <p className="mt-1">{def}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="grp__body">
                {g.subcategorias.map((id) => {
                  const n = porSub(id);
                  return (
                    <Link
                      key={id}
                      className="subcard"
                      href={urlSubcategoria(id)}
                      aria-label={`${g.rotulo}, ${SUBCATEGORIA[id].rotulo} — ${plural(n)}`}
                      data-testid="subcategory-link"
                      data-subcategoria={id}
                    >
                      <span className="subcard__label">{SUBCATEGORIA[id].rotulo}</span>
                      <Notacao subcategoria={id} />
                      <MiniDiagram subcategoria={id} />
                      <span className="caption">{plural(n)}</span>
                      <span className="subcard__arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
      <LegendaNotacao />

      {/* TODO: "Em destaque" (DESIGN §4.1 item 4) entra quando destaques.json tiver contrato no carregador. */}

      <section className="section" aria-labelledby="titulo-precos" data-testid="best-prices">
        <div className="sechead">
          <div>
            <h2 id="titulo-precos">
              <IconeMoeda />
              Melhores preços
            </h2>
            <p className="caption mt-1">Produtos com maior diferença de preço entre as três dentais (mesma apresentação).</p>
          </div>
        </div>
        {economias.length ? (
          <>
            <ul className="deals">
              {economias.map(({ p, apresentacao, comparacao }) => (
                <li key={p.id} data-testid="best-prices-item" data-produto-id={p.id} data-economia-centavos={comparacao.economiaCentavos}>
                  <Link href={`/produto/${p.id}#precos`}>
                    <span className="deals__img" aria-hidden="true">
                      {p.imagens[0] ? <Image src={p.imagens[0].arquivo} alt="" fill sizes="48px" style={{ objectFit: "contain" }} /> : <Frasco />}
                    </span>
                    <span className="min-w-0">
                      <strong className="block font-semibold">{p.nomeComercial}</strong>
                      <span className="small muted">
                        {p.fabricante.nome}
                        {apresentacao ? ` · ${apresentacao}` : ""}
                      </span>
                    </span>
                    <span className="deals__save num">
                      economia de <strong>{formatarBRL(comparacao.economiaCentavos!)}</strong>
                      <span aria-hidden="true"> ›</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {datas.length > 0 && (
              <p className="caption mt-2">
                Preços consultados{" "}
                {datas[0] === datas.at(-1)
                  ? `em ${formatarData(datas[0])}`
                  : `entre ${formatarData(datas[0])} e ${formatarData(datas.at(-1)!)}`}
                .
              </p>
            )}
          </>
        ) : (
          <p className="note note--neutral">Ainda não há produtos com preço em mais de uma loja para a mesma apresentação.</p>
        )}
      </section>

      <section className="section" id="guia" aria-labelledby="titulo-guia">
        <div className="sechead">
          <h2 id="titulo-guia">
            <IconeLivro />
            Guia rápido
          </h2>
        </div>
        <ul className="guide">
          {GUIA.map((t) => (
            <li key={t}>
              <div className="gcard">
                <IconeLivro />
                <div>
                  <h3>{t}</h3>
                  <p>Em preparação — conteúdo com fonte em breve.</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
