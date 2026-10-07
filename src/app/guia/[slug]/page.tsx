import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogo } from "@/lib/dados/carregar";
import { formatarData } from "@/lib/formato";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SeloRascunho } from "@/components/ClassBadge";
import { referenciasNumeradas } from "@/components/guia/referencias";
import { IconeLivro } from "@/components/Icones";

// /guia/{slug} — artigo do Guia rápido com referências numeradas ao final.
export const dynamicParams = false;

const artigos = () => catalogo().guia["sistemas-adesivos"] ?? [];

export function generateStaticParams() {
  return artigos().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/guia/[slug]">) {
  const { slug } = await props.params;
  const a = artigos().find((x) => x.slug === slug);
  return a ? { title: a.titulo, description: a.resumo } : {};
}

export default async function PaginaArtigo(props: PageProps<"/guia/[slug]">) {
  const { slug } = await props.params;
  const todos = artigos();
  const artigo = todos.find((a) => a.slug === slug);
  if (!artigo) notFound();

  const { numero, referencias } = referenciasNumeradas(artigo);
  const relacionados = artigo.relacionados.flatMap((s) => todos.find((a) => a.slug === s) ?? []);

  return (
    <div className="pagina">
      <Breadcrumb
        itens={[
          { rotulo: "Sistemas Adesivos", href: "/" },
          { rotulo: "Guia rápido", href: "/guia" },
          { rotulo: artigo.titulo },
        ]}
      />
      <article className="artigo" aria-labelledby="titulo-artigo">
        <header className="pagehead">
          <p className="sobretitulo">Guia rápido</p>
          <h1 id="titulo-artigo">{artigo.titulo}</h1>
          <p className="artigo__resumo">{artigo.resumo}</p>
          <p className="caption">
            Atualizado em {formatarData(artigo.revisao.atualizadoEm)} {artigo.revisao.status === "rascunho" && <SeloRascunho />}
          </p>
        </header>

        {artigo.secoes.map((s, i) => (
          <section key={i} className="artigo__secao" aria-labelledby={s.titulo ? `secao-${i}` : undefined}>
            {s.titulo && <h2 id={`secao-${i}`}>{s.titulo}</h2>}
            {s.paragrafos.map((p, j) => (
              <p key={j}>
                {p.texto}
                <span className="artigo__refs">
                  {p.fontes.map((id) => (
                    <a key={id} href={`#ref-${id}`} className="artigo__ref" aria-label={`Referência ${numero(id)}`}>
                      [{numero(id)}]
                    </a>
                  ))}
                </span>
              </p>
            ))}
          </section>
        ))}

        <section className="artigo__secao" aria-labelledby="titulo-referencias">
          <h2 id="titulo-referencias">Referências</h2>
          <ol className="referencias">
            {referencias.map((f) => (
              <li key={f.id} id={`ref-${f.id}`} data-testid="source-link-item">
                <a href={f.url} target="_blank" rel="noopener" data-testid="source-link" data-fonte-tipo={f.tipo}>
                  {f.titulo}
                  {f.versao ? ` (${f.versao})` : ""}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>{" "}
                <span className="caption">· acesso em {formatarData(f.acessadoEm)}</span>
                {f.observacao && <span className="caption block">{f.observacao}</span>}
              </li>
            ))}
          </ol>
        </section>
      </article>

      {relacionados.length > 0 && (
        <section className="section" aria-labelledby="titulo-relacionados">
          <h2 id="titulo-relacionados" className="mb-4">
            Leia também
          </h2>
          <ul className="guide">
            {relacionados.map((r) => (
              <li key={r.slug}>
                <Link className="gcard gcard--link" href={`/guia/${r.slug}`}>
                  <IconeLivro />
                  <span>
                    <h3 className="gcard__titulo">{r.titulo}</h3>
                    <p>{r.resumo}</p>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
