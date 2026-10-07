import { formatarData } from "@/lib/formato";
import { IconeAlerta } from "./Icones";
import type { DivergenciaDTO } from "./tipos";

/** DESIGN §3.6. Mostra todas as versões lado a lado — nunca escolhe uma. */
export function DivergenceNote({ divergencia }: { divergencia: DivergenciaDTO }) {
  return (
    <div className="note note--warn" role="note" data-testid="divergence-note" data-campo={divergencia.campo}>
      <IconeAlerta />
      <div>
        <p className="note__title">Divergência entre fontes</p>
        <p>{divergencia.descricao}</p>
        <ul className="divergence__list">
          {divergencia.versoes.map((v, i) => (
            <li key={i}>
              {v.fontes.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener">
                  {f.titulo} ({formatarData(f.acessadoEm)})<span className="sr-only"> (abre em nova aba)</span>
                </a>
              ))}
              : <strong>{v.valor}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
