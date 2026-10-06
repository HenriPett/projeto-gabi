import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <Link className="underline" href="/">Voltar ao início</Link>
    </main>
  );
}
