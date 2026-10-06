import type { Metadata } from "next";
import Link from "next/link";

// Servida pelo service worker quando não há rede nem cópia da página em cache.
export const metadata: Metadata = { title: "Sem conexão", robots: { index: false } };

export default function Offline() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Você está sem conexão</h1>
      <p>
        Esta página ainda não foi salva no aparelho. As páginas que você já abriu continuam disponíveis
        offline. Preços exibidos offline mostram a data da última atualização.
      </p>
      <Link href="/" className="underline">
        Voltar ao início
      </Link>
    </main>
  );
}
