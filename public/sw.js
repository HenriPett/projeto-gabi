/*
 * Service worker do PWA (manual, sem Serwist — ver docs/DEPLOY.md §2.3). Dono: Ponte.
 * Fica em public/: não passa pelo bundler, funciona igual com Turbopack e na Vercel.
 *
 *  - precache do shell: "/offline", manifest e ícones ("/" não: exige login)
 *  - páginas (navegação): network-first → cache → /offline
 *  - /_next/static/* (nome com hash, imutável): cache-first
 *  - imagens: stale-while-revalidate, até LIMITE_IMAGENS entradas
 *  - payloads RSC e o resto: rede direto (sem SW). Se a navegação suave falhar
 *    offline, o Next faz navegação completa e cai na regra de páginas.
 *
 * Login (src/proxy.ts): páginas só entram no cache se vieram 200 SEM redirect.
 * Se a rede redireciona para /login, a sessão acabou: o cache de páginas é
 * apagado e nada protegido é servido offline. O logout também limpa os caches.
 *
 * Versão: registrado como /sw.js?v=<commit>. Mudou o commit, muda a URL, o SW
 * novo assume (skipWaiting + clients.claim) e apaga os caches das versões antigas.
 *
 * Emergência (SW quebrado em produção): trocar o conteúdo deste arquivo pelo de
 * scripts/sw-kill-switch.js e fazer deploy.
 */
const VERSAO = new URL(self.location.href).searchParams.get("v") || "local";
const CACHE_SHELL = `shell-${VERSAO}`;
const CACHE_PAGINAS = `paginas-${VERSAO}`;
const CACHE_ESTATICOS = "estaticos"; // nomes com hash: seguro entre versões
const CACHE_IMAGENS = "imagens";
const CACHES_ATUAIS = [CACHE_SHELL, CACHE_PAGINAS, CACHE_ESTATICOS, CACHE_IMAGENS];
const LIMITE_IMAGENS = 80;

const SHELL = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      // um item que falhe não impede a instalação
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => !CACHES_ATUAIS.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js" || url.pathname === "/version.json") return;

  if (req.mode === "navigate") {
    event.respondWith(paginaNetworkFirst(req));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, CACHE_ESTATICOS));
  } else if (req.destination === "image") {
    event.respondWith(staleWhileRevalidate(event, req, CACHE_IMAGENS));
  }
});

async function paginaNetworkFirst(req) {
  const cache = await caches.open(CACHE_PAGINAS);
  let resp;
  try {
    resp = await fetch(req);
  } catch {
    return (
      (await cache.match(req, { ignoreSearch: true })) ||
      (await caches.match(req, { ignoreSearch: true })) ||
      (await caches.match("/offline")) ||
      Response.error()
    );
  }
  const destino = new URL(resp.url || req.url);
  // navegação usa redirect "manual": o 307 do proxy chega como opaqueredirect
  if (resp.type === "opaqueredirect" || resp.redirected || destino.pathname === "/login") {
    // sem sessão: nada protegido pode continuar disponível offline
    await caches.delete(CACHE_PAGINAS);
    return resp;
  }
  if (resp.ok) cache.put(req, resp.clone());
  return resp;
}

async function cacheFirst(req, nome) {
  const emCache = await caches.match(req);
  if (emCache) return emCache;
  const resp = await fetch(req);
  if (resp.ok) (await caches.open(nome)).put(req, resp.clone());
  return resp;
}

async function staleWhileRevalidate(event, req, nome) {
  const cache = await caches.open(nome);
  const emCache = await cache.match(req);
  const rede = fetch(req)
    .then(async (resp) => {
      if (resp.ok) {
        await cache.put(req, resp.clone());
        await limitarEntradas(cache, LIMITE_IMAGENS);
      }
      return resp;
    })
    .catch(() => undefined);
  if (emCache) {
    event.waitUntil(rede);
    return emCache;
  }
  return (await rede) || Response.error();
}

async function limitarEntradas(cache, max) {
  const chaves = await cache.keys();
  await Promise.all(chaves.slice(0, Math.max(0, chaves.length - max)).map((k) => cache.delete(k)));
}
