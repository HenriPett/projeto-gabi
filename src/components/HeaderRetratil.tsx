"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mobile: ao rolar para baixo > 120px a linha do logo colapsa; volta ao subir. */
export function HeaderRetratil({ children }: { children: ReactNode }) {
  const [colapsado, setColapsado] = useState(false);
  const ultimo = useRef(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const descendo = y > ultimo.current;
      ultimo.current = y;
      // Com a busca em uso não colapsa: o transform viraria o containing block da listbox fixa.
      const emUso = ref.current?.contains(document.activeElement) ?? false;
      setColapsado(descendo && y > 120 && !emUso);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <header ref={ref} className={`header${colapsado ? " is-collapsed" : ""}`}>{children}</header>;
}
