// /comparar?ids=a,b,c (§11). Ler ids no cliente (useSearchParams) para manter a rota estática.
export const metadata = { title: "Comparar sistemas" };

export default function Pagina() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-3xl font-bold">Comparar sistemas</h1>
    </main>
  );
}
