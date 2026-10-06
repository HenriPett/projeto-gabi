"use client";

import { useEffect } from "react";

/**
 * Registra public/sw.js só em produção (em `next dev` o SW atrapalharia o HMR).
 * A versão vai na query: cada deploy muda a URL do script, o navegador instala
 * o SW novo e ele apaga os caches da versão anterior.
 * NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA é exposta pela Vercel no build.
 */
const VERSAO = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local";

export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(`/sw.js?v=${VERSAO}`, { scope: "/", updateViaCache: "none" })
      .catch((erro) => console.warn("Service worker não registrado:", erro));
  }, []);
  return null;
}
