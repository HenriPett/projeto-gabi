import Link from "next/link";
import type { Produto } from "@/lib/esquema";
import { GRUPO, SUBCATEGORIA } from "@/lib/esquema/taxonomia";
import { LegendaNotacao, Notacao } from "../Notacao";
import { ESTRATEGIA_CURTA, numeroDePassos, urlSubcategoria } from "../rotulos";

/** ② Cola das 7 categorias (DESIGN §4.9): tudo da taxonomia + contagem de publicados. */
export function ColaCategorias({ produtos }: { produtos: readonly Produto[] }) {
  const contagem = (id: string) => produtos.filter((p) => p.classificacao.subcategorias.some((s) => s.id === id)).length;
  return (
    <section className="estudo-bloco" aria-labelledby="titulo-cola">
      <p className="sobretitulo">Consulta rápida</p>
      <table className="cola">
        <caption id="titulo-cola" className="estudo-bloco__titulo">
          Cola das 7 categorias
        </caption>
        <thead>
          <tr>
            <th scope="col">Subcategoria</th>
            <th scope="col">Notação</th>
            <th scope="col" className="cola__num">
              Passos
            </th>
            <th scope="col" className="cola__num">
              Produtos
            </th>
          </tr>
        </thead>
        {Object.values(GRUPO).map((g) => (
          <tbody key={g.id}>
            <tr className={`cola__grupo cola__grupo--${g.id}`}>
              <th scope="rowgroup" colSpan={4}>
                <span className={`marker marker--${g.id}`} aria-hidden="true" />
                {g.rotulo}
              </th>
            </tr>
            {g.subcategorias.map((id) => {
              const n = contagem(id);
              return (
                <tr key={id} className="cola__linha">
                  <th scope="row">
                    <Link href={urlSubcategoria(id)}>{ESTRATEGIA_CURTA[id] ?? SUBCATEGORIA[id].rotulo}</Link>
                  </th>
                  <td>
                    <Notacao subcategoria={id} />
                  </td>
                  <td className="cola__num">{numeroDePassos(id)}</td>
                  <td className="cola__num">
                    {n > 0 ? (
                      n
                    ) : (
                      <span className="muted" aria-label="nenhum produto">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
      <LegendaNotacao className="text-left" />
    </section>
  );
}
