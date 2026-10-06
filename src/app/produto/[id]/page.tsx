import { notFound } from "next/navigation";
import { catalogo } from "@/lib/dados/carregar";

// /produto/{id} — ficha, modo de uso (§5, §6) e #precos (§12–§16)
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
  const produto = produtos.find((p) => p.id === id);
  if (!produto) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-3xl font-bold">{produto.nomeComercial}</h1>
      <p>{produto.fabricante.nome}</p>
      {/* TODO(Pulpa): imagem, classificação, composição, indicações, protocolos, divergências, fontes */}
      <section id="precos">
        {/* TODO(Pulpa): compararPrecos(ofertas.get(produto.id) ?? [], apresentacaoId) */}
        <p>{(ofertas.get(produto.id) ?? []).length} oferta(s) registrada(s)</p>
      </section>
    </main>
  );
}
