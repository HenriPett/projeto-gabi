import { expect, OFFLINE, test } from "./apoio";

// PLANO §6. O SW só registra em build de produção (playwright.config usa next start).

test("PWA-01: manifest válido e ícones com o tamanho declarado", async ({ request }) => {
  const r = await request.get("/manifest.webmanifest");
  expect(r.ok()).toBe(true);
  const m = await r.json();
  expect(m).toMatchObject({ lang: "pt-BR", start_url: "/", scope: "/", display: "standalone" });
  expect(m.name).toBeTruthy();
  expect(m.short_name).toBeTruthy();
  // marca do site (pedido do cliente, 07/10/2026)
  expect(m.name).toBe("Adesivologia");
  expect(m.short_name).toBe("Adesivologia");
  expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  expect(m.background_color).toBeTruthy();
  const tamanhos = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(tamanhos).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose?.includes("maskable"))).toBe(true);
  for (const icone of m.icons as { src: string; sizes: string; type: string }[]) {
    const ri = await request.get(icone.src);
    expect(ri.ok(), icone.src).toBe(true);
    expect(ri.headers()["content-type"]).toContain(icone.type);
    const png = await ri.body();
    const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)]; // cabeçalho IHDR
    expect(`${w}x${h}`, icone.src).toBe(icone.sizes);
  }
});

test("PWA-02: head tem manifest, theme-color igual ao manifest, apple-touch-icon e lang pt-BR", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]').first()).toHaveAttribute("href", /.+/);
  // nome do ícone na tela inicial do iOS (não usa o manifest)
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "Adesivologia");
  const m = await (await request.get("/manifest.webmanifest")).json();
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", new RegExp(m.theme_color, "i"));
});

test.describe("service worker", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "SW + modo offline verificados no Chromium");

  test("PWA-03: SW registrado e ativo com escopo /", async ({ page }) => {
    await page.goto("/");
    const sw = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sw = reg.active!;
      if (sw.state !== "activated")
        await new Promise<void>((ok) => sw.addEventListener("statechange", () => sw.state === "activated" && ok()));
      return { escopo: new URL(reg.scope).pathname, estado: reg.active?.state, script: reg.active?.scriptURL };
    });
    expect(sw.escopo).toBe("/");
    expect(sw.estado).toBe("activated");
    expect(sw.script).toContain("/sw.js");
  });

  test("PWA-05/06: offline abre página já visitada; não visitada cai em /offline", async ({ page, context, ignorarErrosDe }) => {
    ignorarErrosDe(OFFLINE);
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // garante que a página passou pelo SW controlador
    await page.goto("/produto/ficticio-ambar");
    await expect(page.locator("h1")).toContainText("Âmbar Fictício");

    await context.setOffline(true);
    await page.goto("/produto/ficticio-ambar");
    await expect(page.locator("h1")).toContainText("Âmbar Fictício");
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/sistemas adesivos/i);

    await page.goto("/produto/ficticio-tudo-em-um"); // nunca visitada
    await expect(page.locator("h1")).toContainText(/sem conexão/i);
    await context.setOffline(false);
  });

  test("PWA-10: volta online → conteúdo da rede", async ({ page, context, ignorarErrosDe }) => {
    ignorarErrosDe(OFFLINE);
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.goto("/sistemas-adesivos/convencionais/3-passos");
    await expect(page.locator("h1")).toContainText(/sem conexão/i);
    await context.setOffline(false);
    await page.goto("/sistemas-adesivos/convencionais/3-passos");
    await expect(page.locator("h1")).toContainText(/3 passos/i);
  });
});
