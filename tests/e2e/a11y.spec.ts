import AxeBuilder from "@axe-core/playwright";
import { expect, ROTAS_ESTATICAS, SUBCATEGORIAS, test } from "./apoio";

// PLANO §7 (A11Y-01, A11Y-02). Meta WCAG 2.1 AA; gate = zero violações serious/critical.
const ROTAS = [
  ...ROTAS_ESTATICAS,
  ...SUBCATEGORIAS.map((s) => s.url),
  "/produto/ficticio-ambar",
  "/produto/ficticio-universal-triplo",
  "/produto/exemplo-universal",
];

for (const rota of ROTAS) {
  test(`A11Y-01/02: ${rota}`, async ({ page }) => {
    await page.goto(rota);
    await expect(page.locator("h1")).toHaveCount(1);
    const niveis = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    niveis.forEach((n, i) => {
      if (i > 0) expect(n - niveis[i - 1], `salto de heading h${niveis[i - 1]} → h${n}`).toBeLessThanOrEqual(1);
    });
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const graves = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
    expect(graves).toEqual([]);
  });
}
