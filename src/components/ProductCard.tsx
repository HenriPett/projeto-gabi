import Link from "next/link";
import { formatarBRL } from "@/lib/formato";
import { SUBCATEGORIA, type SubcategoriaId } from "@/lib/esquema/taxonomia";
import { ClassBadge, SeloRascunho } from "./ClassBadge";
import { CompareToggle } from "./comparar/CompareToggle";
import { MidiaProduto } from "./MidiaProduto";
import { EstrategiasIndicadas } from "./EstrategiasIndicadas";
import { NAO_VERIFICADA } from "./rotulos";
import type { CardProduto, PrecoCard } from "./tipos";

const MAX_CHIPS = 3;

/** Faixa de preço do card (DESIGN §3.8 item 9). Nunca "a partir de" sem comparação. */
export function PrecoResumo({ preco }: { preco: PrecoCard }) {
  switch (preco.tipo) {
    case "comparavel":
      return (
        <p className="pcard__price">
          a partir de <strong>{formatarBRL(preco.centavos)}</strong>
          {!preco.principal && <span className="block caption">{preco.apresentacao}</span>}
        </p>
      );
    case "uma-loja":
      return (
        <p className="pcard__price">
          <strong>{formatarBRL(preco.centavos)}</strong> <span className="caption">em 1 loja{preco.principal ? "" : ` · ${preco.apresentacao}`}</span>
        </p>
      );
    case "apresentacoes-diferentes":
      return <p className="pcard__price">Preços em apresentações diferentes</p>;
    default:
      return <p className="pcard__price">Preço não encontrado</p>;
  }
}

/**
 * Card de produto — DESIGN §3.8. Não é um link inteiro (tem 3 ações); o nome
 * é o link principal. Mobile horizontal, ≥640 vertical.
 */
export function ProductCard({ card, subcategoriaAtual }: { card: CardProduto; subcategoriaAtual?: SubcategoriaId }) {
  const universal = card.grupo === "universal";
  const sub = universal ? undefined : card.subcategorias[0];
  const href = `/produto/${card.id}`;
  const hrefEstrategia = subcategoriaAtual && universal ? `${href}?estrategia=${SUBCATEGORIA[subcategoriaAtual].slug}` : href;
  const extras = card.componentes.length - MAX_CHIPS;

  return (
    <article className="pcard" data-testid="product-card" data-produto-id={card.id} aria-labelledby={`card-${card.id}`}>
      <div className="pcard__media">
        <MidiaProduto imagem={card.imagem} nome={card.nome} fabricante={card.fabricante} sizes="(min-width: 640px) 300px, 96px" />
        <ClassBadge grupo={card.grupo} subcategoria={sub} curto />
      </div>
      <div className="pcard__cmp">
        <CompareToggle id={card.id} nome={card.nome} />
      </div>
      <div className="pcard__body">
        <ClassBadge grupo={card.grupo} subcategoria={sub} curto />
        {card.rascunho && <SeloRascunho />}
        <p className="pcard__maker">{card.fabricante}</p>
        <h3 className="pcard__name" id={`card-${card.id}`}>
          <Link href={hrefEstrategia}>{card.nome}</Link>
        </h3>
        <p className="pcard__meta">{card.apresentacao}</p>
        {universal ? (
          <EstrategiasIndicadas indicadas={card.subcategorias} atual={subcategoriaAtual} />
        ) : (
          card.estrategia && <p className="pcard__strategy">{card.estrategia}</p>
        )}
        {card.componentes.length ? (
          <ul className="chips" aria-label="Componentes">
            {card.componentes.slice(0, MAX_CHIPS).map((c) => (
              <li key={c} className="chip">
                {c}
              </li>
            ))}
            {extras > 0 && (
              <li className="chip chips__extra" aria-label={`mais ${extras} componentes`}>
                +{extras}
              </li>
            )}
          </ul>
        ) : (
          <p className="caption">Componentes: {NAO_VERIFICADA.toLowerCase()}</p>
        )}
        <PrecoResumo preco={card.preco} />
      </div>
      <div className="pcard__actions">
        <Link className="btn btn--secondary" href={hrefEstrategia} data-testid="btn-ver-produto" aria-label={`Ver produto ${card.nome}`}>
          Ver produto
        </Link>
        <Link className="btn btn--cta" href={`${href}#precos`} data-testid="btn-comparar-precos" aria-label={`Comparar preços de ${card.nome}`}>
          Comparar preços
        </Link>
      </div>
    </article>
  );
}
