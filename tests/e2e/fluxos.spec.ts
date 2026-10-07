import { expect, test } from "./apoio";

// PLANO §2 — fluxos do BRIEFING §22. Partes que dependem de UI ainda não
// implementada (cards, modo de uso, preços, comparador) estão em test.fixme
// com o passo a passo; viram test quando a Pulpa entregar as telas.

test("E2E-01 (parcial): home → Convencionais → 2 passos → produto", async ({ page }) => {
  await page.goto("/");
  await page.locator('main a[href="/sistemas-adesivos/convencionais/2-passos"]').first().click();
  await expect(page.locator("h1")).toContainText(/2 passos/i);
  await page.locator('main a[href="/produto/ficticio-ambar"]').first().click();
  await expect(page).toHaveURL("/produto/ficticio-ambar");
  await expect(page.locator("h1")).toContainText("Âmbar Fictício");
  await expect(page.getByText("Fabricante Alfa").first()).toBeVisible();
});

test.fixme("E2E-01: … → modo de uso → comparar preços → comprar na Dental Cremer", async ({ page, context }) => {
  await page.goto("/produto/ficticio-ambar");
  // modo de uso: 6 etapas numeradas, fonte IFU
  const etapas = page.getByTestId("protocol-step");
  await expect(etapas).toHaveCount(6);
  await expect(etapas.first()).toHaveAttribute("data-step", "01");
  await expect(page.getByTestId("source-link").and(page.locator('[data-fonte-tipo="ifu"]')).first()).toBeVisible();
  // preços (PR-01/14/16/18)
  const linhas = page.getByTestId("price-row");
  await expect(linhas).toHaveCount(3);
  await expect(linhas.first()).toHaveAttribute("data-loja", "dental-cremer");
  await expect(page.locator('[data-testid="price-row"][data-menor-preco="true"]')).toHaveCount(1);
  await expect(page.getByTestId("savings-text")).toContainText("R$ 30,45");
  await expect(page.locator('[data-loja="dental-cremer"] [data-testid="price-updated-at"]')).toContainText("06/10/2026");
  await expect(page.locator('[data-loja="dental-speed"] [data-testid="price-updated-at"]')).toContainText("05/10/2026");
  // comprar: abre a página do produto na loja em nova aba (sem sair para a internet)
  await context.route("https://www.dentalcremer.com.br/**", (r) => r.fulfill({ status: 200, body: "loja" }));
  const comprar = page.getByRole("link", { name: /comprar.*dental cremer/i });
  await expect(comprar).toHaveAttribute("rel", /noopener/);
  const [aba] = await Promise.all([context.waitForEvent("page"), comprar.click()]);
  expect(aba.url()).toBe("https://www.dentalcremer.com.br/produto-ficticio-frasco-4ml.html");
});

test("E2E-02 (parcial): home → Universais → Condicionamento seletivo → só produtos indicados", async ({ page }) => {
  await page.goto("/");
  await page.locator('main a[href="/sistemas-adesivos/universais/condicionamento-seletivo"]').first().click();
  await expect(page.locator("h1")).toContainText(/condicionamento seletivo/i);
  await expect(page.locator('main a[href="/produto/ficticio-universal-triplo"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/produto/exemplo-universal"]')).toHaveCount(0);
});

test.fixme("E2E-02: … → selos de estratégia → comparar produtos → comparar preços", async ({ page }) => {
  await page.goto("/sistemas-adesivos/universais/condicionamento-seletivo");
  const card = page.locator('[data-testid="product-card"][data-produto-id="ficticio-universal-triplo"]');
  await expect(card.getByTestId("strategy-badges")).toHaveAttribute(
    "data-estrategias",
    "universal-condicionamento-seletivo,universal-condicionamento-total,universal-autocondicionante",
  );
  await card.getByTestId("compare-toggle").click();
  await page.goto("/sistemas-adesivos/convencionais/2-passos");
  await page.locator('[data-testid="product-card"][data-produto-id="ficticio-ambar"]').getByTestId("compare-toggle").click();
  await expect(page.getByTestId("compare-count")).toContainText("2");
  await page.getByTestId("btn-comparar").click();
  await expect(page).toHaveURL(/\/comparar\?ids=/);
  await expect(page.getByTestId("compare-table")).toBeVisible();
  // 13 atributos do §11; HEMA "Não informado" ≠ "Não"
  await expect(page.locator('[data-testid="compare-row"]')).toHaveCount(13);
  await page.reload();
  await expect(page.getByTestId("compare-table")).toBeVisible();
  // preços: 3 mL × 5 mL nunca se comparam (PR-02)
  await page.goto("/produto/ficticio-universal-triplo#precos");
  await expect(page.locator('[data-testid="price-row"][data-menor-preco="true"]')).toHaveCount(0);
  await expect(page.getByTestId("savings-text")).toHaveCount(0);
});
