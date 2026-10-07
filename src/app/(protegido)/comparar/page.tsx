import { Suspense } from "react";
import { catalogo } from "@/lib/dados/carregar";
import { Comparador } from "@/components/comparar/Comparador";
import { colunaComparador, indiceDeBusca } from "@/components/dados-de-tela";

// /comparar?ids=a,b,c — DESIGN §4.6. ids lidos no cliente (rota estática).
export const metadata = { title: "Comparar sistemas" };

function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando comparação">
      <h1 className="pt-4 pb-6">Comparar sistemas</h1>
      <div className="skeleton h-96 w-full" />
    </div>
  );
}

export default function Pagina() {
  const { produtos, ofertas } = catalogo();
  const colunas = produtos.map((p) => colunaComparador(p, ofertas.get(p.id)));
  return (
    <div className="pagina pt-4">
      <Suspense fallback={<Carregando />}>
        <Comparador colunas={colunas} indice={indiceDeBusca(produtos)} />
      </Suspense>
    </div>
  );
}
