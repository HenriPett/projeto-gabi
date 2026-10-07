import type { SVGProps } from "react";

/** Ícones lineares do DESIGN (sprite do protótipo). Decorativos por padrão. */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

type P = SVGProps<SVGSVGElement>;

export const IconeBusca = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
);
export const IconeSetaBaixo = (p: P) => (
  <svg {...base} viewBox="0 0 24 28" {...p}><path d="M12 2v22M5 17l7 7 7-7" /></svg>
);
export const IconeExterno = (p: P) => (
  <svg {...base} {...p}><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
export const IconeTrofeu = (p: P) => (
  <svg {...base} strokeWidth={2.2} {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8" /></svg>
);
export const IconeAlerta = (p: P) => (
  <svg {...base} {...p}><path d="M12 3 2 20h20L12 3zM12 10v4M12 17.5v.01" /></svg>
);
export const IconeInfo = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></svg>
);
export const IconeEstrela = (p: P) => (
  <svg {...base} {...p}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" /></svg>
);
export const IconeMoeda = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2" /></svg>
);
export const IconeLivro = (p: P) => (
  <svg {...base} {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" /></svg>
);
export const IconeRelogio = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconeCamadas = (p: P) => (
  <svg {...base} {...p}><path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5" /></svg>
);
export const IconeAr = (p: P) => (
  <svg {...base} {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" /></svg>
);
export const IconeLuz = (p: P) => (
  <svg {...base} {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>
);
export const IconeMao = (p: P) => (
  <svg {...base} {...p}><path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.7L7 14" /></svg>
);
export const IconeDente = (p: P) => (
  <svg {...base} {...p}><path d="M12 5c-2-2-7-2-7 3 0 3 1.5 4 2 7s1 6 2.5 6S11 15 12 15s1 6 2.5 6S16.5 18 17 15s2-4 2-7c0-5-5-5-7-3z" /></svg>
);
export const IconeFechar = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconeComparar = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4" width="7" height="16" rx="1.5" /><rect x="14" y="4" width="7" height="16" rx="1.5" /><path d="M5.5 9h2M16.5 9h2M5.5 13h2M16.5 13h2" /></svg>
);
export const IconeFiltro = (p: P) => (
  <svg {...base} {...p}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);

/** Silhueta neutra de frasco (placeholder de foto, DESIGN §3.8 item 1: --lilac-200). */
export function Frasco({ className = "bottle", rotulo }: { className?: string; rotulo?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 140"
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <rect x="30" y="4" width="20" height="22" rx="3" fill="var(--lilac-200)" />
      <rect x="26" y="24" width="28" height="10" rx="2" fill="var(--lilac-200)" />
      <path d="M20 40c0-4 4-6 8-6h24c4 0 8 2 8 6v88c0 5-4 8-8 8H28c-4 0-8-3-8-8z" fill="#fff" stroke="var(--lilac-200)" strokeWidth="3" />
      <rect x="20" y="62" width="40" height="44" fill="var(--lilac-50)" />
    </svg>
  );
}

/** Ilustração linear para estados vazios (§2). */
export function FrascoLinha() {
  return (
    <svg className="bottle-line" viewBox="0 0 80 140" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <rect x="30" y="4" width="20" height="22" rx="3" />
      <rect x="26" y="24" width="28" height="10" rx="2" />
      <path d="M20 40c0-4 4-6 8-6h24c4 0 8 2 8 6v88c0 5-4 8-8 8H28c-4 0-8-3-8-8z" />
      <path d="M20 62h40M20 106h40" />
    </svg>
  );
}
