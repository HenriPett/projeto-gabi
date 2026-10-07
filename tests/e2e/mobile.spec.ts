import { expect, ROTAS_ESTATICAS, SUBCATEGORIAS, test } from "./apoio";

// PLANO §8 (MOB-01): sem scroll horizontal da página em nenhuma largura dos projetos (320 → 1280).
const ROTAS = [...ROTAS_ESTATICAS, ...SUBCATEGORIAS.map((s) => s.url), "/produto/ficticio-multiuso-3p", "/produto/ficticio-ambar"];

for (const rota of ROTAS) {
  test(`MOB-01: ${rota} sem scroll horizontal`, async ({ page }) => {
    await page.goto(rota);
    const { scroll, largura } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      largura: window.innerWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(largura);
  });
}
