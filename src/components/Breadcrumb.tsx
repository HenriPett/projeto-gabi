import Link from "next/link";

export interface Migalha {
  rotulo: string;
  href?: string;
}

/** DESIGN §3.3. Mobile mostra só "‹ {pai}". */
export function Breadcrumb({ itens, voltar }: { itens: Migalha[]; voltar?: Migalha }) {
  const pai = voltar ?? [...itens].reverse().find((i) => i.href);
  return (
    <nav className="crumbs" aria-label="Navegação estrutural">
      <ol>
        {itens.map((i) => (
          <li key={i.rotulo}>
            {i.href ? <Link href={i.href}>{i.rotulo}</Link> : <span aria-current="page">{i.rotulo}</span>}
          </li>
        ))}
      </ol>
      {pai?.href && (
        <Link className="crumbs__back" href={pai.href}>
          ‹ {pai.rotulo}
        </Link>
      )}
    </nav>
  );
}
