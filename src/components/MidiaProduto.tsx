"use client";

import Image from "next/image";
import { useState } from "react";
import { Frasco } from "./Icones";
import { IMAGEM_AUSENTE } from "./rotulos";
import type { ImagemDTO } from "./tipos";

/**
 * Foto do frasco (contain, fundo cinza) ou silhueta neutra quando não há foto
 * ou ela falha ao carregar — nunca ícone quebrado (PLANO P-02).
 */
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
  const [falhou, setFalhou] = useState(false);
  if (imagem && !falhou)
    return <Image src={imagem.arquivo} alt={imagem.alt || `Frasco de ${nome} — ${fabricante}`} fill sizes={sizes} onError={() => setFalhou(true)} />;
  return (
    <>
      <Frasco />
      {!semLegenda && <span className="caption pcard__noimg">{IMAGEM_AUSENTE}</span>}
    </>
  );
}

/** Miniatura decorativa (busca, barra de comparação, comparador, melhores preços). */
export function Miniatura({ imagem, sizes }: { imagem?: ImagemDTO; sizes: string }) {
  const [falhou, setFalhou] = useState(false);
  if (imagem && !falhou)
    return <Image src={imagem.arquivo} alt="" fill sizes={sizes} style={{ objectFit: "contain" }} onError={() => setFalhou(true)} />;
  return <Frasco />;
}
