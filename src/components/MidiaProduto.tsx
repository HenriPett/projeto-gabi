import Image from "next/image";
import { Frasco } from "./Icones";
import type { ImagemDTO } from "./tipos";

/** Foto do frasco (contain, fundo cinza) ou silhueta quando não há foto. */
export function MidiaProduto({
  imagem,
  nome,
  fabricante,
  sizes,
  semLegenda = false,
}: {
  imagem?: ImagemDTO;
  nome: string;
  fabricante: string;
  sizes: string;
  semLegenda?: boolean;
}) {
  if (imagem) return <Image src={imagem.arquivo} alt={imagem.alt || `Frasco de ${nome} — ${fabricante}`} fill sizes={sizes} />;
  return (
    <>
      <Frasco />
      {!semLegenda && <span className="caption pcard__noimg">Imagem indisponível</span>}
    </>
  );
}
