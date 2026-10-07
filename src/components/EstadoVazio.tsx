import type { ReactNode } from "react";
import { FrascoLinha } from "./Icones";

/** Estado vazio — DESIGN §2. */
export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <FrascoLinha />
      <h3>{titulo}</h3>
      {children}
    </div>
  );
}
