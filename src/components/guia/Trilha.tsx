import Link from "next/link";
import type { ArtigoGuia } from "@/lib/esquema";

/** 1ª oração do resumo, como frase curta de navegação (DESIGN §4.9 ①). */
export function primeiraOracao(texto: string): string {
  const m = texto.match(/^.+?[.!?:](?=\s|$)/);
  return (m ? m[0] : texto).replace(/[.:]$/, "");
}

/**
 * ① "Por onde começar": a ordem da trilha é o campo `ordem` dos artigos
 * (catalogo().guia já vem ordenado; decisão do Molar — sem trilha.json).
 */
export function Trilha({ artigos }: { artigos: readonly ArtigoGuia[] }) {
  if (!artigos.length) return null;
  return (
    <section className="estudo-bloco" aria-labelledby="titulo-trilha">
      <p className="sobretitulo">Para começar</p>
      <h2 id="titulo-trilha" className="estudo-bloco__titulo">
        Por onde começar
      </h2>
      <ol className="trilha">
        {artigos.map((a, i) => (
          <li key={a.slug} className="trilha__item" data-slug={a.slug}>
            <span className="trilha__n" aria-hidden="true">
              {i + 1}
            </span>
            <span className="trilha__txt">
              <Link href={`/guia/${a.slug}`} className="trilha__link">
                {a.titulo}
              </Link>
              <span className="caption block">{primeiraOracao(a.resumo)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
