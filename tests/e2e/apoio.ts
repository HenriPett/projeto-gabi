import { test as base, expect } from "@playwright/test";

/**
 * Expectativas do catálogo fictício (tests/fixtures/dados — PLANO §3.1).
 * Rodar com DADOS_DIR=tests/fixtures/dados INCLUIR_RASCUNHOS=0 (playwright.config).
 */
export const SUBCATEGORIAS = [
  { url: "/sistemas-adesivos/convencionais/2-passos", grupo: "Convencionais", rotulo: "2 passos",
    produtos: ["ficticio-ambar", "ficticio-prime-bond-2-1", "ficticio-single-bond-2"] },
  { url: "/sistemas-adesivos/convencionais/3-passos", grupo: "Convencionais", rotulo: "3 passos",
    produtos: ["ficticio-multiuso-3p"] },
  { url: "/sistemas-adesivos/autocondicionantes/1-passo", grupo: "Autocondicionantes", rotulo: "1 passo",
    produtos: ["ficticio-tudo-em-um"] },
  { url: "/sistemas-adesivos/autocondicionantes/2-passos", grupo: "Autocondicionantes", rotulo: "2 passos",
    produtos: ["ficticio-dois-frascos"] },
  { url: "/sistemas-adesivos/universais/condicionamento-seletivo", grupo: "Universais", rotulo: "Condicionamento seletivo",
    produtos: ["ficticio-universal-triplo"] },
  { url: "/sistemas-adesivos/universais/condicionamento-total", grupo: "Universais", rotulo: "Condicionamento total",
    produtos: ["exemplo-universal", "ficticio-universal-triplo"] },
  { url: "/sistemas-adesivos/universais/autocondicionante", grupo: "Universais", rotulo: "Autocondicionante",
    produtos: ["exemplo-universal", "ficticio-universal-triplo"] },
] as const;

export const PRODUTOS_PUBLICADOS = [
  "exemplo-universal", "ficticio-ambar", "ficticio-dois-frascos", "ficticio-multiuso-3p",
  "ficticio-prime-bond-2-1", "ficticio-single-bond-2", "ficticio-tudo-em-um", "ficticio-universal-triplo",
] as const;

export const ROTAS_ESTATICAS = ["/", "/busca", "/comparar", "/guia", "/metodologia", "/offline"] as const;

/** ids de produto linkados na página (href="/produto/{id}"), sem repetição, ordenados. */
export async function produtosLinkados(page: import("@playwright/test").Page, escopo = "main") {
  const hrefs = await page.locator(`${escopo} a[href^="/produto/"]`).evaluateAll((as) =>
    as.map((a) => new URL((a as HTMLAnchorElement).href).pathname.split("/")[2]),
  );
  return [...new Set(hrefs)].sort();
}

/** G-08: erro de console ou exceção não tratada = falha em qualquer teste E2E. */
export const test = base.extend<{ errosDeConsole: string[] }>({
  errosDeConsole: [
    async ({ page }, use) => {
      const erros: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") erros.push(`console: ${m.text()}`);
      });
      page.on("pageerror", (e) => {
        // WebKit reporta como pageerror o prefetch RSC abortado por uma navegação rápida (page.goto em sequência)
        if (/_rsc=.*due to access control checks/.test(e.message)) return;
        erros.push(`pageerror: ${e.message}`);
      });
      await use(erros);
      expect(erros, "erros no console do navegador").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
