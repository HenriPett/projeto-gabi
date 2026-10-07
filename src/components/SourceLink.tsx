import { citacaoCurta, formatarData } from "@/lib/formato";
import type { FonteDTO } from "./tipos";

/** "Fonte: {documento} · acesso em DD/MM/AAAA ↗" — DESIGN §3.5. */
export function SourceLink({ fontes, compacto = false }: { fontes: FonteDTO[]; compacto?: boolean }) {
  if (!fontes.length) return null;
  // Compacto (glossário): "Fonte: Perdigão 2020 ↗ · Silva e Souza Jr. 2010 ↗"; citação completa no title/aria-label.
  if (compacto)
    return (
      <p className="source source--compacta">
        Fonte:{" "}
        {fontes.map((f, i) => (
          <span key={f.id} className="whitespace-nowrap">
            {i > 0 && <span aria-hidden="true"> · </span>}
            <a
              href={f.url}
              target="_blank"
              rel="noopener"
              title={f.titulo}
              aria-label={`Fonte: ${f.titulo} (abre em nova aba)`}
              data-testid="source-link"
              data-fonte-tipo={f.tipo}
            >
              {citacaoCurta(f.titulo)}
            </a>{" "}
            <span aria-hidden="true">↗</span>
          </span>
        ))}
      </p>
    );
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
