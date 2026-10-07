/**
 * Acesso por senha única (pedido do cliente). Só servidor: proxy.ts e /api/login.
 * Web Crypto (crypto.subtle) — sem dependência de node:crypto.
 *
 * Senha: env SENHA_ACESSO; sem ela, compara com SENHA_SHA256 (a senha em texto
 * puro nunca fica no repositório nem no bundle do cliente).
 * Cookie: "v1.<HMAC-SHA256(chave, MENSAGEM)>". Chave = SEGREDO_SESSAO, senão
 * SENHA_ACESSO, senão a própria senha (validada no login). Sem env, o proxy
 * confere o cookie pelo hash TOKEN_SHA256 — forjar exige conhecer a senha.
 * Trocar SEGREDO_SESSAO (ou a senha) desloga todos os aparelhos.
 */

export const COOKIE_SESSAO = "sa_sessao";
/** ~1 ano: o usuário não precisa relogar. */
export const MAX_AGE_SESSAO = 60 * 60 * 24 * 365;

const MENSAGEM = "sistemas-adesivos/sessao-v1";
/** sha256(senha padrão). */
const SENHA_SHA256 = "4afc168829275292a84f61e9d5cc53607c9ea22560c8af7f761de53f9b2e5474";
/** sha256(hex(HMAC-SHA256(senha padrão, MENSAGEM))). */
const TOKEN_SHA256 = "c37396109783fc3becfee8ceb6ba904bfb5bd276304905d7563735d10cd5f407";

type Env = Record<string, string | undefined>;
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

export async function sha256(texto: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(texto)));
}

async function hmac(chave: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}

/** Comparação em tempo constante para strings de mesmo tamanho (hex). */
export function iguaisTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function senhaCorreta(senha: string, env: Env = process.env): Promise<boolean> {
  // compara hashes: mesmo tamanho sempre, sem vazar o tamanho da senha
  const esperado = env.SENHA_ACESSO ? await sha256(env.SENHA_ACESSO) : SENHA_SHA256;
  return iguaisTempoConstante(await sha256(senha), esperado);
}

/** Valor do cookie para uma senha já validada por senhaCorreta. */
export async function emitirToken(senhaValidada: string, env: Env = process.env): Promise<string> {
  return `v1.${await hmac(env.SEGREDO_SESSAO || env.SENHA_ACESSO || senhaValidada, MENSAGEM)}`;
}

export async function tokenValido(token: string | undefined, env: Env = process.env): Promise<boolean> {
  if (!token || !/^v1\.[0-9a-f]{64}$/.test(token)) return false;
  const mac = token.slice(3);
  const chave = env.SEGREDO_SESSAO || env.SENHA_ACESSO;
  if (chave) return iguaisTempoConstante(mac, await hmac(chave, MENSAGEM));
  return iguaisTempoConstante(await sha256(mac), TOKEN_SHA256);
}

/** Destino pós-login: só caminho interno; qualquer outra coisa vira "/". */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  let decodificado: string;
  try {
    decodificado = decodeURIComponent(next);
  } catch {
    return "/";
  }
  // "/%2F%2Fevil.com", "/%5Cevil.com": barra/contrabarra codificada no início
  if (/^\/[\\/]/.test(decodificado)) return "/";
  if (next.startsWith("/login") || next.startsWith("/api/")) return "/";
  return next;
}

const LIVRES = new Set(["/login", "/api/login", "/api/logout", "/offline", "/sw.js", "/version.json", "/health.json"]);
const EXT_PUBLICA = /\.(png|jpe?g|webp|avif|gif|svg|ico|webmanifest|txt|xml|woff2?)$/i;

/** Rotas acessíveis sem sessão: login, offline e arquivos públicos (ícones, manifest, imagens...). */
export function rotaLivre(pathname: string): boolean {
  return LIVRES.has(pathname) || EXT_PUBLICA.test(pathname);
}
