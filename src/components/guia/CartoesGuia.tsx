import Link from "next/link";
import type { ArtigoGuia } from "@/lib/esquema";
import { IconeLivro } from "../Icones";

/** Os 7 temas do DESIGN §4.1 item 6, na ordem da spec. Slug = arquivo em data/…/guia/. */
export const TOPICOS_GUIA = [
  { slug: "como-escolher-estrategia", titulo: "Como escolher a estratégia adesiva?" },
  { slug: "convencional-x-autocondicionante", titulo: "Convencional x autocondicionante" },
  { slug: "adesivo-universal", titulo: "O que é adesivo universal?" },
  { slug: "mdp", titulo: "O que é MDP?" },
  { slug: "esmalte-x-dentina", titulo: "Esmalte x dentina" },
  { slug: "condicionamento-seletivo", titulo: "Condicionamento seletivo" },
  { slug: "camada-hibrida", titulo: "Camada híbrida" },
] as const;

type Cartao = { slug: string; titulo: string; resumo?: string; artigo: boolean };

/**
 * Artigos publicados (ordem da curadoria) + temas da spec ainda sem artigo,
 * que aparecem como "Em preparação" (não interativos).
 */
export function cartoesDoGuia(artigos: readonly ArtigoGuia[]): Cartao[] {
  const publicados: Cartao[] = artigos.map((a) => ({ slug: a.slug, titulo: a.titulo, resumo: a.resumo, artigo: true }));
  const pendentes: Cartao[] = TOPICOS_GUIA.filter((t) => !artigos.some((a) => a.slug === t.slug)).map((t) => ({ ...t, artigo: false }));
  return [...publicados, ...pendentes];
}

/** Grade de cartões-tópico — DESIGN §4.1 item 6. */
export function CartoesGuia({ artigos, nivel = 3 }: { artigos: readonly ArtigoGuia[]; nivel?: 2 | 3 }) {
  const H = nivel === 2 ? "h2" : "h3";
  return (
    <ul className="guide">
      {cartoesDoGuia(artigos).map((c) => (
        <li key={c.slug}>
          {c.artigo ? (
            <Link className="gcard gcard--link" href={`/guia/${c.slug}`} data-testid="guia-card" data-slug={c.slug}>
              <IconeLivro />
              <span>
                <H className="gcard__titulo">{c.titulo}</H>
                <p>{c.resumo}</p>
              </span>
            </Link>
          ) : (
            <div className="gcard gcard--pendente" data-testid="guia-card" data-slug={c.slug} data-pendente="true">
              <IconeLivro />
              <div>
                <H className="gcard__titulo">{c.titulo}</H>
                <p className="caption">Em preparação</p>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
