import { expect, ROTAS_ESTATICAS, SUBCATEGORIAS, test } from "./apoio";

// PLANO §8 (MOB-01): sem scroll horizontal da página em nenhuma largura dos projetos (320 → 1280).
const ROTAS = [...ROTAS_ESTATICAS, ...SUBCATEGORIAS.map((s) => s.url), "/produto/ficticio-multiuso-3p", "/produto/ficticio-ambar"];

for (const rota of ROTAS) {
  test(`MOB-01: ${rota} sem scroll horizontal`, async ({ page }) => {
    await page.goto(rota);
    // Comparar com a largura do aparelho, não com innerWidth: no Chrome mobile, conteúdo
    // largo demais expande o layout viewport e innerWidth cresce junto.
    const largura = page.viewportSize()!.width;
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
    const culpados = await page.evaluate((w) =>
      [...document.querySelectorAll("body *")]
        .filter((e) => e.getBoundingClientRect().right > w + 1)
        .slice(0, 5)
        .map((e) => `${e.tagName.toLowerCase()}.${String((e as HTMLElement).className).split(" ")[0]} → ${Math.round(e.getBoundingClientRect().right)}px`),
    largura);
    expect(scroll, `elementos além de ${largura}px: ${culpados.join("; ")}`).toBeLessThanOrEqual(largura);
  });
}
