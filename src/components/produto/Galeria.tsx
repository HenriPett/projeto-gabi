"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Frasco, IconeFechar } from "../Icones";
import { IMAGEM_AUSENTE } from "../rotulos";
import type { ImagemDTO } from "../tipos";

/** Hero 1:1 + miniaturas + zoom em tela cheia — DESIGN §4.3 item 2. */
export function Galeria({ imagens, nome, fabricante }: { imagens: ImagemDTO[]; nome: string; fabricante: string }) {
  const [atual, setAtual] = useState(0);
  const zoom = useRef<HTMLDialogElement>(null);
  const [falhas, setFalhas] = useState<string[]>([]);
  const visiveis = imagens.filter((m) => !falhas.includes(m.arquivo));
  const img = visiveis[Math.min(atual, visiveis.length - 1)];
  const falhar = (arquivo: string) => setFalhas((f) => [...f, arquivo]);

  if (!img) {
    return (
      <div className="prod__media">
        <Frasco rotulo={`${IMAGEM_AUSENTE} — ${nome}, ${fabricante}`} />
        <span className="caption pcard__noimg" aria-hidden="true">
          {IMAGEM_AUSENTE}
        </span>
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="prod__media cursor-zoom-in" aria-label="Ampliar imagem do frasco" onClick={() => zoom.current?.showModal()}>
        <Image src={img.arquivo} alt={img.alt} fill priority sizes="(min-width: 1024px) 40vw, 100vw" onError={() => falhar(img.arquivo)} />
      </button>
      {visiveis.length > 1 && (
        <ul className="prod__thumbs" aria-label="Fotos do produto">
          {visiveis.map((m, i) => (
            <li key={m.arquivo}>
              <button type="button" aria-current={i === atual} aria-label={`Foto ${i + 1}: ${m.alt}`} onClick={() => setAtual(i)}>
                <Image src={m.arquivo} alt="" fill sizes="56px" style={{ objectFit: "contain" }} onError={() => falhar(m.arquivo)} />
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
