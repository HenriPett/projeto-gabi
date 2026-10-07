import { expect, irPara, produtosLinkados, PRODUTOS_PUBLICADOS, SUBCATEGORIAS, test } from "./apoio";

// PLANO §1.1 (H-01..H-04), §1.2 (C-04, C-06), §1.4 (D-05, D-06), §1.6 (U-02, U-04), §8 (G-02, G-10)

test("H-01/H-03: home tem h1 e as 7 subcategorias linkando para as rotas certas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toContainText(/sistemas adesivos/i);
  for (const s of SUBCATEGORIAS) await expect(page.locator(`main a[href="${s.url}"]`).first()).toBeVisible();
  const hrefs = await page.locator('main a[href^="/sistemas-adesivos/"]').evaluateAll((as) =>
    [...new Set(as.map((a) => new URL((a as HTMLAnchorElement).href).pathname))],
  );
  expect(hrefs.sort()).toEqual(SUBCATEGORIAS.map((s) => s.url).sort());
});

test("H-02: grupos na ordem Convencionais, Autocondicionantes, Universais", async ({ page }) => {
  await page.goto("/");
  const texto = (await page.locator("main").innerText()).toLowerCase();
  const pos = ["convencionais", "autocondicionantes", "universais"].map((g) => texto.indexOf(g));
  expect(pos.every((p) => p >= 0)).toBe(true);
  expect([...pos].sort((a, b) => a - b)).toEqual(pos);
});

for (const s of SUBCATEGORIAS) {
  test(`H-04/C-04: ${s.url} lista só os produtos da subcategoria`, async ({ page }) => {
    await page.goto("/");
    await page.locator(`main a[href="${s.url}"]`).first().click();
    await expect(page).toHaveURL(s.url);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText(s.rotulo, { ignoreCase: true });
    expect(await produtosLinkados(page)).toEqual([...s.produtos].sort());
  });
}

test("U-02: universal das 3 estratégias aponta para a MESMA página de produto", async ({ page }) => {
  for (const s of SUBCATEGORIAS.filter((x) => x.grupo === "Universais")) {
    await irPara(page, s.url);
    await expect(page.locator('main a[href^="/produto/ficticio-universal-triplo"]').first()).toBeVisible();
  }
});

test("U-04: universal sem indicação para seletivo não aparece em seletivo", async ({ page }) => {
  await page.goto("/sistemas-adesivos/universais/condicionamento-seletivo");
  await expect(page.locator('main a[href^="/produto/exemplo-universal"]')).toHaveCount(0);
});

test("rascunho nunca aparece com INCLUIR_RASCUNHOS=0 (BUG-005)", async ({ page, ignorarErrosDe }) => {
  ignorarErrosDe(/\/produto\/ficticio-rascunho$/); // o 404 do documento é o esperado
  for (const url of ["/", "/sistemas-adesivos/convencionais/2-passos"]) {
    await irPara(page, url);
    await expect(page.locator('a[href="/produto/ficticio-rascunho"]')).toHaveCount(0);
    await expect(page.getByText("Rascunho Fictício")).toHaveCount(0);
  }
  const r = await page.goto("/produto/ficticio-rascunho");
  expect(r?.status()).toBe(404);
});

for (const id of PRODUTOS_PUBLICADOS) {
  test(`D-06/G-02: deep link /produto/${id} renderiza com 200`, async ({ page }) => {
    const r = await page.goto(`/produto/${id}`);
    expect(r?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).not.toBeEmpty();
  });
}

const INEXISTENTES = [
  "/sistemas-adesivos/convencionais/7-passos",
  "/sistemas-adesivos/convencionais/1-passo",
  "/sistemas-adesivos/universais/2-passos",
  "/sistemas-adesivos/resinas/2-passos",
  "/produto/nao-existe",
  "/produto/Ficticio-Ambar",
  "/produto/ficticio-ambar%20",
  "/produto/%E0",
  "/%E0",
];
for (const url of INEXISTENTES) {
  test(`C-06/D-05/G-10: ${url} → 404 amigável, nunca 500`, async ({ page, ignorarErrosDe }) => {
    ignorarErrosDe(new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)); // o 404/500 do documento é o esperado
    // BUG-007: URI malformada em segmento dinâmico responde 500 (PLANO §12)
    test.fail(url === "/produto/%E0", "BUG-007");
    const r = await page.goto(url);
    expect(r?.status()).toBe(404);
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });
}

test("G-01: Voltar/Avançar entre home → categoria → produto", async ({ page }) => {
  await page.goto("/");
  await page.locator('main a[href="/sistemas-adesivos/convencionais/2-passos"]').first().click();
  // a home também linka ficticio-ambar (Melhores preços): esperar a categoria antes do 2º clique
  await expect(page).toHaveURL("/sistemas-adesivos/convencionais/2-passos");
  await page.locator('main a[href="/produto/ficticio-ambar"]').first().click();
  await expect(page).toHaveURL("/produto/ficticio-ambar");
  await page.goBack();
  await expect(page).toHaveURL("/sistemas-adesivos/convencionais/2-passos");
  await page.goBack();
  await expect(page).toHaveURL("/");
  await page.goForward();
  await expect(page).toHaveURL("/sistemas-adesivos/convencionais/2-passos");
  await expect(page.locator('main a[href="/produto/ficticio-ambar"]').first()).toBeVisible();
});

test("P-02: foto que falha ao carregar vira placeholder, sem ícone de imagem quebrada", async ({ page }) => {
  // ficticio-multiuso-3p aponta para um arquivo inexistente (fixture)
  await page.goto("/produto/ficticio-multiuso-3p");
  await expect(page.getByText("Imagem ainda não disponível").first()).toBeVisible();
  const quebradas = await page.locator("main img").evaluateAll((imgs) =>
    imgs.filter((i) => {
      const img = i as HTMLImageElement;
      return img.complete && img.naturalWidth === 0 && img.getBoundingClientRect().width > 0 && getComputedStyle(img).visibility !== "hidden";
    }).length,
  );
  expect(quebradas).toBe(0);
});
