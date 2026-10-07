import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogo } from "@/lib/dados/carregar";
import { GRUPO, SUBCATEGORIA, subcategoriaPorSlug } from "@/lib/esquema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ClassBadge } from "@/components/ClassBadge";
import { ListaProdutos } from "@/components/categoria/ListaProdutos";
import { cardDe } from "@/components/dados-de-tela";
import { IconeInfo } from "@/components/Icones";
import { ESTRATEGIA_CURTA, rotuloClassificacao, urlSubcategoria } from "@/components/rotulos";
import { SourceLink } from "@/components/SourceLink";
import { StepDiagram } from "@/components/StepDiagram";

// /sistemas-adesivos/{convencionais|autocondicionantes|universais}/{subcategoria} — DESIGN §4.2, §4.4
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(SUBCATEGORIA).map((s) => ({ grupo: GRUPO[s.grupo].slug, subcategoria: s.slug }));
}

export async function generateMetadata(props: PageProps<"/sistemas-adesivos/[grupo]/[subcategoria]">) {
  const { grupo, subcategoria } = await props.params;
  const sub = subcategoriaPorSlug(grupo, subcategoria);
  return { title: sub ? rotuloClassificacao(sub.id) : undefined };
}

export default async function PaginaSubcategoria(props: PageProps<"/sistemas-adesivos/[grupo]/[subcategoria]">) {
  const { grupo, subcategoria } = await props.params;
  const sub = subcategoriaPorSlug(grupo, subcategoria);
  if (!sub) notFound();
  const g = GRUPO[sub.grupo];
  const universal = sub.grupo === "universal";
  const { produtos, ofertas, categorias, destaques } = catalogo();
  const cards = produtos
    .filter((p) => p.classificacao.subcategorias.some((s) => s.id === sub.id))
    .map((p) => cardDe(p, ofertas.get(p.id)));
  const conteudo = categorias["sistemas-adesivos"];
  const explicacao = conteudo?.subcategorias[sub.id]?.explicacao;
  const irmas = g.subcategorias.filter((id) => id !== sub.id);
  const n = cards.length;

  return (
    <div className="pagina">
      <Breadcrumb
        itens={[
          { rotulo: "Sistemas Adesivos", href: "/" },
          { rotulo: g.rotulo, href: "/#classificacao" },
          { rotulo: sub.rotulo },
        ]}
      />
      <header className="pagehead">
        <ClassBadge grupo={sub.grupo} solid />
        <h1>{rotuloClassificacao(sub.id)}</h1>
        <nav className="w-full sm:w-auto" aria-label={universal ? "Estratégias dos universais" : `Subcategorias de ${g.rotulo.toLowerCase()}`}>
          <div className={`seg${universal ? " seg--3" : ""}`}>
            {g.subcategorias.map((id) => (
              <Link key={id} href={urlSubcategoria(id)} aria-current={id === sub.id ? "page" : undefined} aria-label={universal ? SUBCATEGORIA[id].rotulo : undefined}>
                <span className="seg__longo">{SUBCATEGORIA[id].rotulo}</span>
                {universal && <span className="seg__curto" aria-hidden="true">{ESTRATEGIA_CURTA[id]}</span>}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="split">
        <StepDiagram subcategoria={sub.id} />
        <section aria-labelledby="titulo-caracteriza" className="prose">
          <h2 id="titulo-caracteriza">O que caracteriza</h2>
          {explicacao ? (
            <>
              <p className="mt-3">{explicacao.texto}</p>
              <SourceLink fontes={conteudo ? fontesDeConteudo(conteudo.fontes, explicacao.fontes) : []} />
            </>
          ) : (
            <p className="mt-3 muted">Explicação em revisão pelo time de conteúdo.</p>
          )}
          {irmas.length > 0 && (
            <p className="mt-4 flex flex-wrap gap-x-4">
              {irmas.map((id) => (
                <Link key={id} href={urlSubcategoria(id)} className="inline-flex min-h-11 items-center">
                  Comparar com {SUBCATEGORIA[id].rotulo.toLowerCase()} →
                </Link>
              ))}
            </p>
          )}
        </section>
      </div>

      <section className="section" aria-labelledby="titulo-produtos">
        <p className="sobretitulo">Produtos disponíveis</p>
        <h2 id="titulo-produtos" className="mb-4">
          {n} {n === 1 ? "produto" : "produtos"}
        </h2>
        {universal && n > 0 && (
          <p className="note note--info mb-4">
            <IconeInfo />
            <span>
              Um adesivo universal pode ser usado em mais de uma estratégia. É o <strong>mesmo produto</strong> — muda só a
              técnica de aplicação.
            </span>
          </p>
        )}
        <ListaProdutos cards={cards} subcategoria={sub.id} destaques={destaques["sistemas-adesivos"] ?? []} />
        {universal && n > 0 && (
          <p className="caption mt-4">Exibindo produtos com indicação oficial do fabricante para esta estratégia.</p>
        )}
      </section>
    </div>
  );
}

function fontesDeConteudo(
  fontes: { id: string; tipo: string; titulo: string; url: string; acessadoEm: string; versao?: string }[],
  ids: string[],
) {
  return fontes.filter((f) => ids.includes(f.id));
}
