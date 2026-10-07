import Link from "next/link";
import { EstadoVazio } from "@/components/EstadoVazio";

export default function NotFound() {
  return (
    <div className="pagina section">
      <h1 className="sr-only">Página não encontrada</h1>
      <EstadoVazio titulo="Página não encontrada">
        <p className="muted">O endereço pode ter mudado ou não existe.</p>
        <Link className="btn btn--primary" href="/">
          Voltar ao início
        </Link>
      </EstadoVazio>
    </div>
  );
}
