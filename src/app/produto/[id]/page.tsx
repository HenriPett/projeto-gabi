import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogo } from "@/lib/dados/carregar";
import { GRUPO, SUBCATEGORIA } from "@/lib/esquema/taxonomia";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ClassBadge, SeloRascunho } from "@/components/ClassBadge";
import {
  apresentacaoPrincipal,
  cardDe,
  comparacoesDePreco,
  divergenciasDe,
  fontesDe,
  rotuloTipoApresentacao,
  volumeDe,
} from "@/components/dados-de-tela";
import { DivergenceNote } from "@/components/DivergenceNote";
import { EstrategiasIndicadas } from "@/components/EstrategiasIndicadas";
import { ProductCard } from "@/components/ProductCard";
import { AcoesProduto } from "@/components/produto/AcoesProduto";
import { EstrategiaProvider } from "@/components/produto/estrategia";
import { Galeria } from "@/components/produto/Galeria";
import { ModoDeUso } from "@/components/produto/ModoDeUso";
import { SecaoPrecos } from "@/components/produto/SecaoPrecos";
import { StrategySelector } from "@/components/produto/StrategySelector";
import { rotuloClassificacao, urlSubcategoria } from "@/components/rotulos";
import { SourceLink } from "@/components/SourceLink";
import type { ProtocoloDTO } from "@/components/tipos";

// /produto/{id} — ficha, modo de uso e #precos (DESIGN §4.3, §4.5, §4.7)
export const dynamicParams = false;

export function generateStaticParams() {
  return catalogo().produtos.map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: PageProps<"/produto/[id]">) {
  const { id } = await props.params;
  const p = catalogo().produtos.find((x) => x.id === id);
  return { title: p ? `${p.nomeComercial} — ${p.fabricante.nome}` : undefined };
}

export default async function PaginaProduto(props: PageProps<"/produto/[id]">) {
  const { id } = await props.params;
  const { produtos, ofertas } = catalogo();
  const p = produtos.find((x) => x.id === id);
  if (!p) notFound();

  const universal = p.classificacao.grupo === "universal";
  const subs = p.classificacao.subcategorias.map((s) => s.id);
  const g = GRUPO[p.classificacao.grupo];
  const a = apresentacaoPrincipal(p);
  const ofertasDoProduto = ofertas.get(p.id) ?? [];
  const c = p.composicao;

  const protocolos: ProtocoloDTO[] = p.protocolos.map((pr) => ({
    id: pr.id,
    titulo: pr.titulo,
    aplicaA: pr.aplicaA,
    etapas: pr.etapas.map((e) => ({ tipo: e.tipo, titulo: e.titulo, descricao: e.descricao, parametros: e.parametros })),
    observacoes: pr.observacoes.map((o) => o.texto),
    fontes: fontesDe(p, pr.fontes),
    divergencias: divergenciasDe(p, `protocolos.${pr.id}`),
  }));

  const fontesClassificacao = fontesDe(p, [...new Set([...p.classificacao.subcategorias.flatMap((s) => s.fontes), ...(p.estrategiaAdesiva?.fontes ?? []), ...a.fontes])]);
  const fontesComposicao = fontesDe(
    p,
    [...new Set([c.componentes.flatMap((x) => x.fontes), [c.mdp, c.hema, c.silano, c.solventes, c.polimerizacao].flatMap((x) => ("fontes" in x ? x.fontes : []))].flat())],
  );
  const fontesIndicacoes = fontesDe(p, [...new Set([...p.indicacoes, ...p.contraindicacoes].flatMap((x) => x.fontes))]);

  const chaves = [
    c.mdp.valor === "sim" && "MDP",
    c.hema.valor === "sim" && "HEMA",
    c.silano.valor === "sim" && "Silano",
    ...(c.solventes.valor === "nao-informado" ? [] : c.solventes.valor),
  ].filter((x): x is string => !!x);

  const relacionados = produtos
    .filter((x) => x.id !== p.id && x.classificacao.subcategorias.some((s) => subs.includes(s.id)))
    .slice(0, 8)
    .map((x) => cardDe(x, ofertas.get(x.id)));

  const subPrincipal = subs[0];
  const conteudo = (
    <>
      <div className="pagina">
        <Breadcrumb
          itens={[
            { rotulo: "Sistemas Adesivos", href: "/" },
            { rotulo: g.rotulo, href: "/#classificacao" },
            { rotulo: SUBCATEGORIA[subPrincipal].rotulo, href: urlSubcategoria(subPrincipal) },
            { rotulo: p.nomeComercial },
          ]}
          voltar={{ rotulo: universal ? g.rotulo : rotuloClassificacao(subPrincipal).replace(" — ", " · "), href: urlSubcategoria(subPrincipal) }}
        />

        <div className="prod">
          <div className="prod__left">
            <Galeria imagens={p.imagens.map((m) => ({ arquivo: m.arquivo, alt: m.alt }))} nome={p.nomeComercial} fabricante={p.fabricante.nome} />
          </div>
          <div>
            <p className="sobretitulo sobretitulo--muted">{p.fabricante.nome}</p>
            <h1 className="mt-1 break-words">{p.nomeComercial}</h1>
            <p className="mt-3 flex flex-wrap gap-2">
              <ClassBadge grupo={p.classificacao.grupo} subcategoria={universal ? undefined : subPrincipal} />
              {p.revisao.status === "rascunho" && <SeloRascunho />}
            </p>
            <AcoesProduto id={p.id} nome={p.nomeComercial} />

            {universal && <StrategySelector />}

            <section className="mt-6" aria-labelledby="titulo-ficha">
              <h2 id="titulo-ficha" className="sr-only">
                Ficha técnica
              </h2>
              <dl className="dl">
                <div>
                  <dt>Classificação</dt>
                  <dd>
                    {universal ? (
                      <>
                        <Link href={urlSubcategoria(subPrincipal)}>Universal</Link>
                        <EstrategiasIndicadas indicadas={subs} />
                      </>
                    ) : (
                      <Link href={urlSubcategoria(subPrincipal)}>{rotuloClassificacao(subPrincipal)}</Link>
                    )}
                  </dd>
                </div>
                {!universal && (
                  <div>
                    <dt>Estratégia adesiva</dt>
                    <dd>{p.estrategiaAdesiva?.texto ?? <span className="ni">Não informado</span>}</dd>
                  </div>
                )}
                {universal && p.estrategiaAdesiva && (
                  <div>
                    <dt>Estratégia adesiva</dt>
                    <dd>{p.estrategiaAdesiva.texto}</dd>
                  </div>
                )}
                <div>
                  <dt>Apresentação</dt>
                  <dd>{a.tipo === "kit" ? a.descricao : rotuloTipoApresentacao(a)}</dd>
                </div>
                <div>
                  <dt>Volume</dt>
                  <dd className="num">{volumeDe(a)}</dd>
                </div>
                <div>
                  <dt>Fabricante</dt>
                  <dd>{p.fabricante.nome}</dd>
                </div>
              </dl>
              <SourceLink fontes={fontesClassificacao} />
              {divergenciasDe(p, "classificacao").map((d) => (
                <div key={d.campo} className="mt-3">
                  <DivergenceNote divergencia={d} />
                </div>
              ))}
            </section>

            <section className="section" aria-labelledby="titulo-composicao">
              <h2 id="titulo-composicao">Composição</h2>
              {chaves.length > 0 && (
                <ul className="chips chips--lg mt-3" aria-label="Componentes-chave">
                  {chaves.map((k) => (
                    <li key={k}>
                      <Link className="chip" href={`/busca?q=${encodeURIComponent(k)}`}>
                        {k}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {c.componentes.length ? (
                <ul className="bullets mt-3">
                  {c.componentes.map((x) => (
                    <li key={x.nome}>
                      {x.nome}
                      {x.funcao && <span className="muted"> — {x.funcao}</span>}
                      {x.frasco && <span className="muted"> ({x.frasco})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted mt-3">Composição completa não divulgada pelo fabricante.</p>
              )}
              {c.outros.length > 0 && (
                <dl className="dl mt-4">
                  {c.outros.map((o) => (
                    <div key={o.rotulo}>
                      <dt>{o.rotulo}</dt>
                      <dd>{o.valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <SourceLink fontes={fontesComposicao} />
              {divergenciasDe(p, "composicao").map((d) => (
                <div key={d.campo} className="mt-3">
                  <DivergenceNote divergencia={d} />
                </div>
              ))}
            </section>

            <section className="section" aria-labelledby="titulo-indicacoes">
              <h2 id="titulo-indicacoes">Indicações</h2>
              {p.indicacoes.length ? (
                <ul className="bullets mt-3">
                  {p.indicacoes.map((x) => (
                    <li key={x.texto}>{x.texto}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted mt-3">Não informado pelo fabricante.</p>
              )}
              {p.contraindicacoes.length > 0 && (
                <>
                  <h3 className="mt-6">Contraindicações</h3>
                  <ul className="bullets mt-2">
                    {p.contraindicacoes.map((x) => (
                      <li key={x.texto}>{x.texto}</li>
                    ))}
                  </ul>
                </>
              )}
              <SourceLink fontes={fontesIndicacoes} />
              {divergenciasDe(p, "indicacoes").map((d) => (
                <div key={d.campo} className="mt-3">
                  <DivergenceNote divergencia={d} />
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>

      <ModoDeUso fabricante={p.fabricante.nome} protocolos={protocolos} subcategoriaFixa={universal ? undefined : subPrincipal} />

      <div className="pagina">
        <SecaoPrecos comparacoes={comparacoesDePreco(p, ofertasDoProduto)} />

        {relacionados.length > 0 && (
          <section className="section" aria-labelledby="titulo-relacionados">
            <div className="sechead">
              <h2 id="titulo-relacionados">Produtos da mesma categoria</h2>
            </div>
            <ul className="rail" aria-roledescription="carrossel" aria-labelledby="titulo-relacionados">
              {relacionados.map((r) => (
                <li key={r.id}>
                  <ProductCard card={r} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );

  return universal ? <EstrategiaProvider indicadas={subs}>{conteudo}</EstrategiaProvider> : conteudo;
}
