import { Suspense } from "react";
import { catalogo } from "@/lib/dados/carregar";
import { ResultadosBusca } from "@/components/busca/ResultadosBusca";
import { cardDe, indiceDeBusca } from "@/components/dados-de-tela";

// /busca?q= — DESIGN §4.8. Índice gerado no build; q lido no cliente (rota estática).
export const metadata = { title: "Pesquisar" };

function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando resultados">
      <h1 className="pt-4 pb-6">Pesquisar</h1>
      <ul className="cards">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="skeleton h-80" />
        ))}
      </ul>
    </div>
  );
}

export default function Pagina() {
  const { produtos, ofertas } = catalogo();
  return (
    <div className="pagina">
      <Suspense fallback={<Carregando />}>
        <ResultadosBusca indice={indiceDeBusca(produtos)} cards={produtos.map((p) => cardDe(p, ofertas.get(p.id)))} />
      </Suspense>
    </div>
  );
}
