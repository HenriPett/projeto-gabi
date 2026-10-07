/**
 * Marca Adesivologia — DESIGN.md §0.1. Monograma (versão pequena do ícone: ladrilho laranja + "A"
 * preto) + logotipo. O logotipo aparece em CAIXA ALTA via CSS (.logo__txt), mas o texto é
 * "Adesivologia": leitores de tela leem a palavra, não as letras.
 */
const A = "M226 104h60l92 236h22v28h-104v-28h22l-17-46h-90l-17 46h22v28H112v-28h22zM256 160l-34 104h68z";

export function Monograma({ className = "logo__mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="112" fill="var(--orange-500)" />
      <path fillRule="evenodd" fill="var(--ink-900)" transform="translate(256 256) scale(1.25) translate(-256 -236)" d={A} />
    </svg>
  );
}

export function Marca() {
  return (
    <>
      <Monograma />
      <span className="logo__txt">Adesivologia</span>
    </>
  );
}
