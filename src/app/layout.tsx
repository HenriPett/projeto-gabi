import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Source_Serif_4 } from "next/font/google";
import { catalogo } from "@/lib/dados/carregar";
import { CompareTray } from "@/components/comparar/CompareTray";
import { indiceDeBusca } from "@/components/dados-de-tela";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], weight: ["600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Sistemas Adesivos", template: "%s · Sistemas Adesivos" },
  description: "Classificação, protocolos e comparação de preços de sistemas adesivos odontológicos.",
};

export const viewport: Viewport = {
  themeColor: "#5E2280",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const indice = indiceDeBusca(catalogo().produtos);
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
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
      </body>
    </html>
  );
}
