import type { ReactNode } from "react";
import { FrascoLinha } from "./Icones";

/** Estado vazio — DESIGN §2. */
export function EstadoVazio({ titulo, nivel = 3, children }: { titulo: string; nivel?: 2 | 3; children?: ReactNode }) {
  const H = nivel === 2 ? "h2" : "h3";
  return (
    <div className="empty">
      <FrascoLinha />
      <H className="h3-sans">{titulo}</H>
      {children}
    </div>
  );
}
