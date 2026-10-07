import { Breadcrumb } from "@/components/Breadcrumb";
import { EstadoVazio } from "@/components/EstadoVazio";

// /guia — Guia rápido. Conteúdo (com fonte) ainda em definição de formato (ARQUITETURA §9).
export const metadata = { title: "Guia rápido" };

export default function Pagina() {
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Sistemas Adesivos", href: "/" }, { rotulo: "Guia rápido" }]} />
      <h1 className="pb-6">Guia rápido</h1>
      <EstadoVazio nivel={2} titulo="Conteúdo em preparação.">
        <p className="muted">Os temas do guia serão publicados com as respectivas fontes.</p>
      </EstadoVazio>
    </div>
  );
}
