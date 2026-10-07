import Link from "next/link";
import { catalogo } from "@/lib/dados/carregar";
import { CompareTray } from "@/components/comparar/CompareTray";
import { indiceDeBusca } from "@/components/dados-de-tela";
import { Header } from "@/components/Header";
import { MarcadorSessao } from "@/auth/MarcadorSessao";

/** Páginas do site (protegidas por senha no proxy): header com busca, rodapé e barra de comparação. */
export default function LayoutSite({ children }: LayoutProps<"/">) {
  const indice = indiceDeBusca(catalogo().produtos);
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header indice={indice} />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="footer">
        <div className="pagina">
          <p>
            Conteúdo de consulta e estudo. Sempre siga as instruções de uso (IFU) do fabricante. Preços sujeitos a
            alteração nas lojas.
          </p>
          <nav aria-label="Rodapé">
            <Link href="/metodologia">Sobre</Link>
            <Link href="/metodologia">Fontes e metodologia</Link>
          </nav>
        </div>
      </footer>
      <CompareTray indice={indice} />
      <MarcadorSessao />
    </>
  );
}
