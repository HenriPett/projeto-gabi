import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogo } from "@/lib/dados/carregar";
import { GRUPO, SUBCATEGORIA, subcategoriaPorSlug } from "@/lib/esquema";

// /sistemas-adesivos/{convencionais|autocondicionantes|universais}/{subcategoria} (§2, §3, §7–§10)
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(SUBCATEGORIA).map((s) => ({ grupo: GRUPO[s.grupo].slug, subcategoria: s.slug }));
}

export async function generateMetadata(props: PageProps<"/sistemas-adesivos/[grupo]/[subcategoria]">) {
  const { grupo, subcategoria } = await props.params;
  const sub = subcategoriaPorSlug(grupo, subcategoria);
  return { title: sub ? `${GRUPO[sub.grupo].rotulo} — ${sub.rotulo}` : undefined };
}

export default async function PaginaSubcategoria(props: PageProps<"/sistemas-adesivos/[grupo]/[subcategoria]">) {
  const { grupo, subcategoria } = await props.params;
  const sub = subcategoriaPorSlug(grupo, subcategoria);
  if (!sub) notFound();
  const { produtos, categorias } = catalogo();
  const daSubcategoria = produtos.filter((p) => p.classificacao.subcategorias.some((s) => s.id === sub.id));
  const explicacao = categorias["sistemas-adesivos"]?.subcategorias[sub.id]?.explicacao;

  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <p>{GRUPO[sub.grupo].rotulo}</p>
      <h1 className="text-3xl font-bold">{sub.rotulo}</h1>
      <p>{sub.sequencia.join(" → ")}</p>
      {explicacao && <p>{explicacao.texto}</p>}
      <h2 className="mt-6 text-xl font-semibold">Produtos disponíveis</h2>
      {/* TODO(Pulpa): diagrama "Como identificar?", cards de produto (§4) */}
      <ul>
        {daSubcategoria.map((p) => (
          <li key={p.id}>
            <Link className="underline" href={`/produto/${p.id}`}>
              {p.nomeComercial} — {p.fabricante.nome}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
