import { formatarData } from "@/lib/formato";
import type { FonteDTO } from "./tipos";

/** "Fonte: {documento} · acesso em DD/MM/AAAA ↗" — DESIGN §3.5. */
export function SourceLink({ fontes }: { fontes: FonteDTO[] }) {
  if (!fontes.length) return null;
  return (
    <ul className="source">
      {fontes.map((f) => (
        <li key={f.id}>
          Fonte:{" "}
          <a href={f.url} target="_blank" rel="noopener" data-testid="source-link" data-fonte-tipo={f.tipo}>
            {f.titulo}
            {f.versao ? ` (${f.versao})` : ""}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>{" "}
          · acesso em {formatarData(f.acessadoEm)} <span aria-hidden>↗</span>
          {f.observacao && (
            <span className="block" data-testid="source-note">
              {f.observacao}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
