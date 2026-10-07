"use client";

import { IconeAlerta } from "@/components/Icones";

/** Erro de carregamento — DESIGN §2. */
export default function Erro({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="pagina section">
      <h1 className="sr-only">Erro</h1>
      <div className="note note--error" role="alert">
        <IconeAlerta />
        <div className="stack">
          <p>Não foi possível carregar esta página.</p>
          <button type="button" className="btn btn--secondary" onClick={() => retry()}>
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
