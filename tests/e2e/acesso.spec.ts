import fs from "node:fs";
import path from "node:path";
import { expect, test } from "./apoio";
import { ARQ_SESSAO, CHAVE_LOCAL, COOKIE_SESSAO, SEM_SESSAO, SENHA_E2E } from "./sessao";

// PLANO §14 — login por senha (contrato do Molar: src/proxy.ts, POST /api/login, POST /api/logout).
// Todos os testes deste arquivo começam SEM sessão.
test.use({ storageState: SEM_SESSAO });

const PROTEGIDAS = [
  "/",
  "/sistemas-adesivos/convencionais/2-passos",
  "/sistemas-adesivos/universais/condicionamento-seletivo",
  "/produto/ficticio-ambar",
  "/produto/ficticio-universal-triplo?estrategia=autocondicionante",
  "/comparar?ids=ficticio-ambar,ficticio-single-bond-2",
  "/busca?q=Prime%26Bond",
  "/guia",
  "/metodologia",
];

const LIVRES = [
  "/login",
  "/offline",
  "/manifest.webmanifest",
  "/sw.js",
  "/version.json",
  "/robots.txt",
  "/favicon.ico",
  "/apple-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/** Conteúdo das fixtures que nunca pode sair sem sessão. */
const CONTEUDO_PROTEGIDO = ["Âmbar Fictício", "Fabricante Alfa", "89,90", "Universal Triplo Fictício"];

// O Next normaliza a query (ex.: "," → "%2C"): compara caminho + parâmetros já decodificados.
const normalizar = (rota: string | null) => {
  if (rota === null) return null;
  const u = new URL(rota, "http://x");
  return u.pathname + "?" + JSON.stringify([...u.searchParams.entries()]);
};
const nextDe = (location: string) => normalizar(new URL(location, "http://x").searchParams.get("next"));

/** Sair como o usuário: header retrátil pode esconder o botão depois de rolar — volta ao topo antes. */
async function sair(page: import("@playwright/test").Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  // o Sair da header__nav fica display:none < 1024 px: só o visível
  await page.getByRole("button", { name: /sair/i }).filter({ visible: true }).click();
}

async function entrar(page: import("@playwright/test").Page, senha = SENHA_E2E) {
  await page.getByLabel(/senha/i).fill(senha);
  await page.getByRole("button", { name: /entrar/i }).click();
}

const cookieSessao = async (page: import("@playwright/test").Page) =>
  (await page.context().cookies()).find((c) => c.name === COOKIE_SESSAO);

test.describe("LOG-01/08: sem cookie, nada protegido é entregue", () => {
  for (const rota of PROTEGIDAS) {
    test(`${rota} → 307 para /login?next=…, sem conteúdo`, async ({ request }) => {
      const r = await request.get(rota, { maxRedirects: 0 });
      expect(r.status()).toBe(307);
      const location = r.headers()["location"];
      expect(new URL(location, "http://x").pathname).toBe("/login");
      expect(nextDe(location)).toBe(normalizar(rota)); // caminho + query exatamente como pedido
      const corpo = await r.text();
      for (const t of CONTEUDO_PROTEGIDO) expect(corpo).not.toContain(t);
    });
  }

  test("navegador: abrir rota protegida termina no /login com next, sem conteúdo", async ({ page }) => {
    await page.goto("/produto/ficticio-ambar#precos");
    await expect(page).toHaveURL(/\/login\?/);
    expect(nextDe(page.url())).toBe(normalizar("/produto/ficticio-ambar"));
    for (const t of CONTEUDO_PROTEGIDO) await expect(page.locator("body")).not.toContainText(t);
  });

  test("payload RSC de página protegida também exige sessão", async ({ request }) => {
    const r = await request.get("/produto/ficticio-ambar", { headers: { RSC: "1" }, maxRedirects: 0 });
    expect(r.status()).not.toBe(200);
    const corpo = await r.text();
    for (const t of CONTEUDO_PROTEGIDO) expect(corpo).not.toContain(t);
  });

  test("X-Robots-Tag: noindex em rota protegida e livre", async ({ request }) => {
    for (const rota of ["/", "/login", "/manifest.webmanifest"]) {
      const r = await request.get(rota, { maxRedirects: 0 });
      expect(r.headers()["x-robots-tag"], rota).toMatch(/noindex/);
    }
  });
});

test.describe("LOG-07: rotas livres respondem 200 sem cookie", () => {
  for (const rota of LIVRES) {
    test(rota, async ({ request }) => {
      const r = await request.get(rota, { maxRedirects: 0 });
      expect(r.status()).toBe(200);
    });
  }

  test("/offline não contém conteúdo do catálogo", async ({ request }) => {
    const corpo = await (await request.get("/offline")).text();
    for (const t of CONTEUDO_PROTEGIDO) expect(corpo).not.toContain(t);
  });
});

test.describe("LOG-03: senha errada", () => {
  test("formulário: mensagem de erro, continua no /login, sem cookie", async ({ page }) => {
    await page.goto("/produto/ficticio-ambar");
    await entrar(page, "senha-errada");
    await expect(page).toHaveURL(/\/login\?.*erro=1/);
    expect(nextDe(page.url())).toBe(normalizar("/produto/ficticio-ambar"));
    await expect(page.getByRole("alert").or(page.locator('[aria-live]')).first()).toContainText(/senha/i);
    expect(await cookieSessao(page)).toBeUndefined();
  });

  for (const [nome, senha] of [
    ["vazia", ""],
    ["só espaços", "   "],
    ["senha certa com espaço no fim", `${SENHA_E2E} `],
    ["senha certa em maiúsculas", SENHA_E2E.toUpperCase()],
    ["10 000 caracteres", "a".repeat(10_000)],
    ["unicode/emoji", "sénha🦷\u0000"],
    ["injeção", "' OR '1'='1"],
  ] as const) {
    test(`API: ${nome} → 303 para /login?erro=1, sem Set-Cookie de sessão`, async ({ request }) => {
      const r = await request.post("/api/login", { form: { senha, next: "/comparar" }, maxRedirects: 0 });
      expect(r.status()).toBe(303);
      expect(r.headers()["location"]).toMatch(/\/login\?.*erro=1/);
      expect(r.headers()["set-cookie"] ?? "").not.toContain(`${COOKIE_SESSAO}=`);
    });
  }

  test("API: sem o campo senha → não loga e não dá 500", async ({ request }) => {
    const r = await request.post("/api/login", { form: { next: "/" }, maxRedirects: 0 });
    expect(r.status()).toBeLessThan(500);
    expect(r.headers()["set-cookie"] ?? "").not.toContain(`${COOKIE_SESSAO}=`);
  });

  test("GET /api/login não loga", async ({ request }) => {
    const r = await request.get(`/api/login?senha=${SENHA_E2E}`, { maxRedirects: 0 });
    expect(r.headers()["set-cookie"] ?? "").not.toContain(`${COOKIE_SESSAO}=`);
  });
});

test.describe("LOG-04: senha certa", () => {
  test("volta ao next com query e cria cookie HttpOnly/Lax de ~1 ano", async ({ page }) => {
    await page.goto("/comparar?ids=ficticio-ambar,ficticio-single-bond-2");
    await expect(page).toHaveURL(/\/login\?/);
    await entrar(page);
    await expect(page).toHaveURL(/\/comparar\?ids=/);
    expect(new URL(page.url()).searchParams.get("ids")).toBe("ficticio-ambar,ficticio-single-bond-2");
    await expect(page.getByTestId("compare-table")).toBeVisible();
    const c = await cookieSessao(page);
    expect(c).toBeDefined();
    expect(c!.httpOnly).toBe(true);
    expect(c!.sameSite).toBe("Lax");
    expect(c!.path).toBe("/");
    const dias = (c!.expires * 1000 - Date.now()) / 86_400_000;
    expect(dias).toBeGreaterThan(300);
    // a flag de UX é marcada na primeira página protegida
    expect(await page.evaluate((k) => localStorage.getItem(k), CHAVE_LOCAL)).not.toBeNull();
  });

  test("next com & na query (busca Prime&Bond) chega intacto", async ({ page }) => {
    await page.goto("/busca?q=Prime%26Bond");
    await entrar(page);
    await expect(page).toHaveURL(/\/busca\?q=Prime%26Bond$/);
  });

  test("Enter no campo de senha também envia (teclado só)", async ({ page }) => {
    await page.goto("/login?next=/guia");
    await page.getByLabel(/senha/i).fill(SENHA_E2E);
    await page.getByLabel(/senha/i).press("Enter");
    await expect(page).toHaveURL("/guia");
  });

  test("funciona sem JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, storageState: SEM_SESSAO });
    const page = await ctx.newPage();
    await page.goto("/produto/ficticio-ambar");
    await entrar(page);
    await expect(page).toHaveURL("/produto/ficticio-ambar");
    await expect(page.locator("h1")).toContainText("Âmbar Fictício");
    await ctx.close();
  });
});

test.describe("LOG-02: next externo é ignorado", () => {
  for (const next of ["https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "javascript:alert(1)", "http:evil.com", "/%2F%2Fevil.com"]) {
    test(`next=${next} → fica no site`, async ({ request }) => {
      const r = await request.post("/api/login", { form: { senha: SENHA_E2E, next }, maxRedirects: 0 });
      expect(r.status()).toBe(303);
      const destino = new URL(r.headers()["location"], "http://localhost");
      expect(destino.hostname).toBe("localhost");
      expect(destino.pathname.startsWith("//")).toBe(false);
      expect(destino.pathname.includes("evil")).toBe(false);
    });
  }
});

test.describe("LOG-05: sessão persiste", () => {
  test("recarregar, nova aba e novo contexto com o mesmo storageState não pedem login", async ({ page, browser }) => {
    await page.goto("/login?next=/guia");
    await entrar(page);
    await expect(page).toHaveURL("/guia");
    await page.reload();
    await expect(page).toHaveURL("/guia");
    const aba = await page.context().newPage();
    await aba.goto("/produto/ficticio-ambar");
    await expect(aba.locator("h1")).toContainText("Âmbar Fictício");
    const estado = await page.context().storageState();
    const ctx2 = await browser.newContext({ storageState: estado }); // "fechar e reabrir"
    const p2 = await ctx2.newPage();
    await p2.goto("/");
    await expect(p2).not.toHaveURL(/\/login/);
    await ctx2.close();
  });
});

test.describe("LOG-06: Sair", () => {
  test("apaga cookie e flag, volta a exigir login; Voltar não mostra conteúdo", async ({ page }) => {
    await page.goto("/login?next=/produto/ficticio-ambar");
    await entrar(page);
    await expect(page.locator("h1")).toContainText("Âmbar Fictício");
    await page.waitForLoadState("networkidle"); // hidratação concluída (caso sem hidratação: BUG-016)
    await sair(page);
    await expect(page).toHaveURL(/\/login\?.*saiu=1/);
    expect(await cookieSessao(page)).toBeUndefined();
    expect(await page.evaluate((k) => localStorage.getItem(k), CHAVE_LOCAL)).toBeNull();
    await page.goto("/");
    await expect(page).toHaveURL(/\/login\?/);
    await page.goBack();
    await page.goBack();
    await expect(page.locator("body")).not.toContainText("89,90");
  });

  test("POST /api/logout responde 303 para /login?saiu=1 e expira o cookie", async ({ request }) => {
    await request.post("/api/login", { form: { senha: SENHA_E2E, next: "/" }, maxRedirects: 0 });
    const r = await request.post("/api/logout", { maxRedirects: 0 });
    expect(r.status()).toBe(303);
    expect(r.headers()["location"]).toMatch(/\/login\?.*saiu=1/);
    expect((await request.get("/", { maxRedirects: 0 })).status()).toBe(307);
  });
});

test.describe("LOG-09: service worker não serve página protegida depois de sair", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "SW verificado no Chromium");

  test("logar, cachear produto, sair, ficar offline → sem conteúdo do produto", async ({ page, context, errosDeConsole }) => {
    await page.goto("/login?next=/produto/ficticio-ambar");
    await entrar(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // passa pelo SW → vai para o cache de páginas
    await expect(page.locator("h1")).toContainText("Âmbar Fictício");
    await page.waitForLoadState("networkidle");
    await sair(page);
    await expect(page).toHaveURL(/\/login\?.*saiu=1/);
    const emCache = await page.evaluate(async () => {
      const nomes = await caches.keys();
      const urls: string[] = [];
      for (const n of nomes) for (const req of await (await caches.open(n)).keys()) urls.push(req.url);
      return urls.filter((u) => !/\/_next\/static\/|\/icons\/|manifest|\/offline|\/login/.test(u));
    });
    expect(emCache, "páginas protegidas no cache do SW após sair").toEqual([]);
    await context.setOffline(true);
    await page.goto("/produto/ficticio-ambar");
    await expect(page.locator("body")).not.toContainText("Âmbar Fictício");
    await page.goto("/"); // a home lista produtos/preços: também não pode vir do cache
    await expect(page.locator("body")).not.toContainText("Âmbar Fictício");
    await expect(page.locator("body")).not.toContainText("89,90");
    await context.setOffline(false);
    errosDeConsole.splice(0, errosDeConsole.length, ...errosDeConsole.filter((e) => !/ERR_INTERNET_DISCONNECTED|net::ERR_FAILED/.test(e)));
  });
});

test.describe("Sair antes da hidratação (envio nativo do form, sem onSubmit/sairLocal)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "SW verificado no Chromium");

  async function logarCachearESairNativo(page: import("@playwright/test").Page) {
    await page.goto("/login?next=/produto/ficticio-ambar");
    await entrar(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // produto vai para o cache de páginas do SW
    await expect(page.locator("h1")).toContainText("Âmbar Fictício");
    // Igual a tocar em Sair antes de o React hidratar
    await page.evaluate(() => HTMLFormElement.prototype.submit.call(document.querySelector('form[action="/api/logout"]')));
    await expect(page).toHaveURL(/\/login\?.*saiu=1/);
  }

  test("LOG-09b: páginas do SW são apagadas mesmo assim (Clear-Site-Data \"cache\")", async ({ page }) => {
    await logarCachearESairNativo(page);
    const paginas = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const n of await caches.keys()) for (const r of await (await caches.open(n)).keys()) urls.push(r.url);
      return urls.filter((u) => u.includes("/produto/") || new URL(u).pathname === "/");
    });
    expect(paginas).toEqual([]);
  });

  test("BUG-016: a flag de sessão local também é limpa", async ({ page }) => {
    await logarCachearESairNativo(page);
    // a limpeza roda quando /login?saiu=1 hidrata — esperar, não ler de imediato
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), CHAVE_LOCAL)).toBeNull();
    // consequência visível do bug: quem saiu não pode ver "sessão expirou" no próximo /login
    await page.goto("/login");
    await expect(page.getByText(/sua sessão expirou/i)).toHaveCount(0);
  });
});

test.describe("LOG-10/11: só o cookie válido libera", () => {
  test("flag forjada no localStorage sem cookie não libera", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate((k) => localStorage.setItem(k, "1"), CHAVE_LOCAL);
    await page.goto("/produto/ficticio-ambar");
    await expect(page).toHaveURL(/\/login\?/);
  });

  test("flag presente no /login sem cookie → aviso de sessão expirada", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate((k) => localStorage.setItem(k, "1"), CHAVE_LOCAL);
    await page.reload();
    await expect(page.getByText(/sua sessão expirou/i)).toBeVisible();
  });

  test("cookie adulterado, vazio ou lixo é rejeitado", async ({ browser }) => {
    const estado = JSON.parse(fs.readFileSync(ARQ_SESSAO, "utf8"));
    const valido = estado.cookies.find((c: { name: string }) => c.name === COOKIE_SESSAO);
    const ultimo = valido.value.at(-1);
    const variantes = [
      valido.value.slice(0, -1) + (ultimo === "A" ? "B" : "A"), // assinatura alterada
      valido.value.split("").reverse().join(""),
      "",
      "1",
      "admin",
      `${valido.value}x`,
    ];
    for (const valor of variantes) {
      const ctx = await browser.newContext({ storageState: { cookies: [{ ...valido, value: valor }], origins: [] } });
      const r = await ctx.request.get("/produto/ficticio-ambar", { maxRedirects: 0 });
      expect(r.status(), `cookie "${valor.slice(0, 20)}…"`).toBe(307);
      await ctx.close();
    }
  });
});

test.describe("LOG-12: a senha não vai para o cliente", () => {
  test("nem no bundle (.next/static) nem no HTML do /login", async ({ request }) => {
    const raiz = path.join(process.cwd(), ".next", "static");
    const achados: string[] = [];
    const varrer = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) varrer(f);
        else if (fs.readFileSync(f).includes(SENHA_E2E)) achados.push(path.relative(raiz, f));
      }
    };
    varrer(raiz);
    expect(achados).toEqual([]);
    expect(await (await request.get("/login")).text()).not.toContain(SENHA_E2E);
  });
});

test("A11Y: /login tem campo rotulado, botão e h1", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByLabel(/senha/i)).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});
