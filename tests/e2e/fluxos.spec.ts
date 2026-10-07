import { expect, test } from "./apoio";

// PLANO §2 — fluxos do BRIEFING §22 sobre o catálogo fictício.

test("E2E-01 (parcial): home → Convencionais → 2 passos → produto", async ({ page }) => {
  await page.goto("/");
  await page.locator('main a[href="/sistemas-adesivos/convencionais/2-passos"]').first().click();
  await expect(page).toHaveURL("/sistemas-adesivos/convencionais/2-passos");
  await expect(page.locator("h1")).toContainText(/2 passos/i);
  await page.locator('main a[href="/produto/ficticio-ambar"]').first().click();
  await expect(page).toHaveURL("/produto/ficticio-ambar");
  await expect(page.locator("h1")).toContainText("Âmbar Fictício");
  await expect(page.getByText("Fabricante Alfa").first()).toBeVisible();
});

test("E2E-01: … → modo de uso → comparar preços → comprar na Dental Cremer", async ({ page, context }) => {
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
  await expect(page.locator('main a[href^="/produto/ficticio-universal-triplo"]').first()).toBeVisible();
  await expect(page.locator('main a[href^="/produto/exemplo-universal"]')).toHaveCount(0);
});

test("E2E-02: … → selos de estratégia → comparar produtos → comparar preços", async ({ page }) => {
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
  // 13 atributos do §11 (+ linha extra de preço, testada à parte — BUG-012)
  const atributos = await page.getByTestId("compare-row").evaluateAll((rs) => rs.map((r) => r.getAttribute("data-atributo")));
  expect(atributos.filter((a) => a !== "menor-preco")).toEqual([
    "classificacao", "estrategia", "passos", "condicionamento", "primer", "adesivo",
    "mdp", "hema", "silano", "solvente", "polimerizacao", "volume", "fabricante",
  ]);
  // CS-02: ausência de dado ≠ "Não"
  await expect(page.locator('[data-testid="compare-row"][data-atributo="hema"]')).toContainText(/sim/i);
  await expect(page.locator('[data-testid="compare-row"][data-atributo="silano"]')).toContainText(/não informado/i);
  await page.reload();
  await expect(page.getByTestId("compare-table")).toBeVisible();
  // preços: 3 mL × 5 mL nunca se comparam (PR-02)
  await page.goto("/produto/ficticio-universal-triplo#precos");
  await expect(page.locator('[data-testid="price-row"][data-menor-preco="true"]')).toHaveCount(0);
  await expect(page.getByTestId("savings-text")).toHaveCount(0);
});

test("BUG-012: comparador não chama de 'menor preço' produto sem preços comparáveis", async ({ page }) => {
  await page.goto("/comparar?ids=ficticio-universal-triplo,ficticio-ambar");
  const linha = page.locator('[data-testid="compare-row"][data-atributo="menor-preco"]');
  await expect(page.getByTestId("compare-table")).toBeVisible();
  // ficticio-universal-triplo: 3 mL só na Cremer, 5 mL só na Speed → nenhuma comparação possível (PR-02)
  await expect(linha).not.toContainText("R$ 159,90");
  await expect(linha).not.toContainText("R$ 99,90");
});

test("PR-10/PR-11: empate marca as duas lojas; preços iguais não têm selo e mostram aviso", async ({ page }) => {
  await page.goto("/produto/ficticio-single-bond-2");
  await expect(page.locator('[data-testid="price-row"][data-menor-preco="true"]')).toHaveCount(2);
  await expect(page.getByTestId("savings-text")).toContainText("R$ 20,00");
  await page.goto("/produto/ficticio-tudo-em-um");
  await expect(page.getByTestId("best-price-badge")).toHaveCount(0);
  await expect(page.getByTestId("savings-text")).toHaveCount(0);
  await expect(page.locator("#precos")).toContainText("Mesmo preço nas lojas comparadas");
});

test("PR-07/08/09/25: lojas sem preço aparecem, sem R$ 0,00 e sem botão Comprar", async ({ page }) => {
  await page.goto("/produto/ficticio-multiuso-3p");
  await expect(page.getByTestId("price-row")).toHaveCount(3);
  await expect(page.getByTestId("btn-comprar")).toHaveCount(0);
  await expect(page.locator("#precos")).not.toContainText("R$ 0,00");
  await expect(page.locator("#precos")).toContainText("Não encontrado / indisponível");
  await page.goto("/produto/ficticio-prime-bond-2-1");
  await expect(page.getByTestId("price-row")).toHaveCount(3);
  await expect(page.getByTestId("best-price-badge")).toHaveCount(0);
  await expect(page.getByTestId("savings-text")).toHaveCount(0);
});

test("PR-06: refil fora da comparação do kit", async ({ page }) => {
  await page.goto("/produto/ficticio-dois-frascos");
  await expect(page.getByTestId("savings-text")).toContainText("R$ 30,00");
  await expect(page.locator('[data-testid="price-row"][data-menor-preco="true"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="price-row"][data-menor-preco="true"]')).toHaveAttribute("data-loja", "dental-cremer");
});

test("PR-21: todo botão Comprar aponta para página de produto da loja certa, em nova aba", async ({ page }) => {
  for (const id of ["ficticio-ambar", "ficticio-single-bond-2", "ficticio-dois-frascos", "ficticio-tudo-em-um"]) {
    await page.goto(`/produto/${id}`);
    for (const linha of await page.locator('[data-testid="price-row"]:has([data-testid="btn-comprar"])').all()) {
      const loja = await linha.getAttribute("data-loja");
      const a = linha.getByTestId("btn-comprar");
      const href = new URL((await a.getAttribute("href"))!);
      const dominio = { "dental-cremer": "dentalcremer.com.br", "dental-speed": "dentalspeed.com", "dental-med-sul": "dentalmedsul.com.br" }[loja!]!;
      expect(href.hostname.endsWith(dominio), `${id}/${loja}`).toBe(true);
      expect(href.protocol).toBe("https:");
      expect(href.pathname).not.toBe("/");
      await expect(a).toHaveAttribute("target", "_blank");
      await expect(a).toHaveAttribute("rel", /noopener/);
    }
  }
});
