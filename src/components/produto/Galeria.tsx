"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Frasco, IconeFechar } from "../Icones";
import type { ImagemDTO } from "../tipos";

/** Hero 1:1 + miniaturas + zoom em tela cheia — DESIGN §4.3 item 2. */
export function Galeria({ imagens, nome, fabricante }: { imagens: ImagemDTO[]; nome: string; fabricante: string }) {
  const [atual, setAtual] = useState(0);
  const zoom = useRef<HTMLDialogElement>(null);
  const img = imagens[atual];

  if (!img) {
    return (
      <div className="prod__media">
        <Frasco rotulo={`Imagem indisponível — ${nome}, ${fabricante}`} />
        <span className="caption pcard__noimg">Imagem indisponível</span>
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="prod__media cursor-zoom-in" aria-label="Ampliar imagem do frasco" onClick={() => zoom.current?.showModal()}>
        <Image src={img.arquivo} alt={img.alt} fill priority sizes="(min-width: 1024px) 40vw, 100vw" />
      </button>
      {imagens.length > 1 && (
        <ul className="prod__thumbs" aria-label="Fotos do produto">
          {imagens.map((m, i) => (
            <li key={m.arquivo}>
              <button type="button" aria-current={i === atual} aria-label={`Foto ${i + 1}: ${m.alt}`} onClick={() => setAtual(i)}>
                <Image src={m.arquivo} alt="" fill sizes="56px" style={{ objectFit: "contain" }} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <dialog ref={zoom} className="zoom" aria-label={img.alt}>
        <button type="button" className="icon-btn zoom__close" aria-label="Fechar imagem ampliada" onClick={() => zoom.current?.close()}>
          <IconeFechar />
        </button>
        <div className="zoom__img">
          <Image src={img.arquivo} alt={img.alt} fill sizes="100vw" />
        </div>
      </dialog>
    </div>
  );
}
