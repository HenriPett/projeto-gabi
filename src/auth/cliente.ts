/**
 * Lado cliente do acesso — SÓ UX. A fonte da verdade é o cookie HttpOnly
 * conferido no proxy; nada aqui libera conteúdo.
 */
export const CHAVE_LOCAL = "sa:sessao";

export function marcarSessaoLocal() {
  try {
    localStorage.setItem(CHAVE_LOCAL, "1");
  } catch {}
}

export function temSessaoLocal(): boolean {
  try {
    return localStorage.getItem(CHAVE_LOCAL) === "1";
  } catch {
    return false;
  }
}

/** Limpa a flag e os caches do service worker (páginas salvas offline). */
export async function sairLocal() {
  try {
    localStorage.removeItem(CHAVE_LOCAL);
  } catch {}
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch {}
}
