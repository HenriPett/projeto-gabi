import Link from "next/link";
import { SearchBox } from "./busca/SearchBox";
import { LinkComparar } from "./comparar/CompareTray";
import { HeaderRetratil } from "./HeaderRetratil";
import type { ItemIndice } from "./tipos";

/** Header + busca fixa — DESIGN §3.1. */
export function Header({ indice }: { indice: ItemIndice[] }) {
  return (
    <HeaderRetratil>
      <div className="pagina header__inner">
        <div className="header__row">
          <Link className="logo" href="/">
            <span className="logo__mark" aria-hidden="true">
              SA
            </span>
            <span className="logo__txt">Sistemas Adesivos</span>
          </Link>
          <LinkComparar className="btn btn--secondary compare-link" />
        </div>
        <SearchBox indice={indice} />
        <nav className="header__nav" aria-label="Principal">
          <Link href="/#classificacao">Classificação</Link>
          <LinkComparar />
          <Link href="/guia">Guia</Link>
        </nav>
      </div>
    </HeaderRetratil>
  );
}
