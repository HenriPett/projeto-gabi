"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { marcarSessaoLocal } from "./cliente";

/** Se esta página (protegida) renderizou, há sessão: marca a flag local de UX. */
export function MarcadorSessao() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/offline") marcarSessaoLocal();
  }, [pathname]);
  return null;
}
