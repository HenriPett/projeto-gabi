import { catalogo } from "@/lib/dados/carregar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CartoesGuia } from "@/components/guia/CartoesGuia";

// /guia — índice do Guia rápido (artigos em data/materiais/sistemas-adesivos/guia/, ARQUITETURA §3.3).
export const metadata = {
  title: "Guia rápido",
  description: "Conceitos de adesão dentária com referências científicas: estratégias adesivas, MDP, esmalte x dentina e mais.",
};

export default function Pagina() {
  const artigos = catalogo().guia["sistemas-adesivos"] ?? [];
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Sistemas Adesivos", href: "/" }, { rotulo: "Guia rápido" }]} />
      <header className="pagehead">
        <p className="sobretitulo">Para estudar</p>
        <h1>Guia rápido</h1>
        <p className="muted prose">Textos curtos sobre adesão, cada afirmação com a referência que a sustenta.</p>
      </header>
      <CartoesGuia artigos={artigos} nivel={2} />
    </div>
  );
}
