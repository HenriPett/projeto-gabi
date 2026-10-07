import { catalogo } from "@/lib/dados/carregar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CartoesGuia } from "@/components/guia/CartoesGuia";
import { ColaCategorias } from "@/components/guia/ColaCategorias";
import { Glossario, type TermoDTO } from "@/components/guia/Glossario";
import { Trilha } from "@/components/guia/Trilha";

// /guia — painel de estudo (DESIGN §4.9): trilha, artigos, cola das categorias e glossário.
export const metadata = {
  title: "Guia rápido",
  description: "Conceitos de adesão dentária com referências científicas: estratégias adesivas, MDP, esmalte x dentina e mais.",
};

export default function Pagina() {
  const { produtos, guia, glossario } = catalogo();
  const artigos = guia["sistemas-adesivos"] ?? [];
  const g = glossario["sistemas-adesivos"];
  const termos: TermoDTO[] = (g?.termos ?? []).map((t) => ({
    id: t.id,
    termo: t.termo,
    sigla: t.sigla,
    nomeCompleto: t.nomeCompleto,
    sinonimos: t.sinonimos,
    definicao: t.definicao,
    fontes: t.fontes.flatMap((id) => {
      const f = g!.fontes.find((x) => x.id === id);
      return f ? [{ id: f.id, tipo: f.tipo, titulo: f.titulo, url: f.url, acessadoEm: f.acessadoEm, versao: f.versao }] : [];
    }),
    artigos: t.artigos.flatMap((s) => {
      const a = artigos.find((x) => x.slug === s);
      return a ? [{ slug: a.slug, titulo: a.titulo }] : [];
    }),
    relacionados: t.relacionados.flatMap((id) => {
      const r = g!.termos.find((x) => x.id === id);
      return r ? [{ id: r.id, termo: r.termo }] : [];
    }),
  }));

  // Ordem do DOM = ordem mobile (h1 → trilha → cartões → cola → glossário); a grade reposiciona no desktop.
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Sistemas Adesivos", href: "/" }, { rotulo: "Guia rápido" }]} />
      <div className="estudo">
        <header className="pagehead estudo__cabecalho">
          <p className="sobretitulo">Para estudar</p>
          <h1>Guia rápido</h1>
          <p className="muted prose">Textos curtos sobre adesão, cada afirmação com a referência que a sustenta.</p>
        </header>
        <div className="estudo__trilha">
          <Trilha artigos={artigos} />
        </div>
        <section className="estudo__cartoes" aria-labelledby="titulo-artigos">
          <h2 id="titulo-artigos" className="sr-only">
            Artigos
          </h2>
          <CartoesGuia artigos={artigos} />
        </section>
        <aside className="estudo__cola" aria-label="Ferramentas de estudo">
          <ColaCategorias produtos={produtos} />
        </aside>
        {termos.length > 0 && (
          <div className="estudo__glossario">
            <Glossario termos={termos} />
          </div>
        )}
      </div>
    </div>
  );
}
