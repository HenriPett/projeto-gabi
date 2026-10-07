/**
 * URL pública do site, resolvida no build (todas as rotas são SSG).
 * Ordem: NEXT_PUBLIC_SITE_URL (domínio próprio, se um dia houver)
 *      → VERCEL_PROJECT_PRODUCTION_URL em produção (<projeto>.vercel.app)
 *      → VERCEL_URL (URL do deploy, ex. previews)
 *      → http://localhost:3000.
 * As VERCEL_* vêm sem protocolo; o retorno nunca termina em "/".
 */
export function urlDoSite(env: Record<string, string | undefined> = process.env): string {
  const host =
    env.NEXT_PUBLIC_SITE_URL ||
    (env.VERCEL_ENV === "production" ? env.VERCEL_PROJECT_PRODUCTION_URL : undefined) ||
    env.VERCEL_URL;
  if (!host) return "http://localhost:3000";
  const comProtocolo = /^https?:\/\//.test(host) ? host : `https://${host}`;
  return comProtocolo.replace(/\/+$/, "");
}
