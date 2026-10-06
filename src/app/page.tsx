import Link from "next/link";
import { GRUPO, SUBCATEGORIA } from "@/lib/esquema";

// Esqueleto estrutural da home (§21). Layout/visual: spec da Esmalte → Pulpa.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-3xl font-bold">Sistemas adesivos</h1>
      {Object.values(GRUPO).map((g) => (
        <section key={g.id} className="mt-6">
          <h2 className="text-xl font-semibold">{g.rotulo}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.subcategorias.map((id) => (
              <li key={id}>
                <Link className="underline" href={`/sistemas-adesivos/${g.slug}/${SUBCATEGORIA[id].slug}`}>
                  {SUBCATEGORIA[id].rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {/* TODO(Pulpa): busca, mais consultados, melhores preços (maioresEconomias), guia rápido */}
    </main>
  );
}
