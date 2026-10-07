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

/**
 * Para `goto` em sequência no mesmo teste: espera a rede acalmar antes de seguir.
 * Sem isso, o próximo goto aborta os prefetches RSC da página anterior e o WebKit
 * os reporta como pageerror (flaky do U-02 no mobile-safari, CI 37559347656).
 */
export async function irPara(page: import("@playwright/test").Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

/** G-08: erro de console ou exceção não tratada = falha em qualquer teste E2E. */
export const test = base.extend<{
  errosDeConsole: string[];
  /**
   * Erro esperado pelo próprio teste (fonte abortada, 404 proposital, offline).
   * Registrar ANTES de provocar o erro: o listener descarta na chegada — eventos de
   * console são assíncronos e podem chegar depois do fim do corpo do teste.
   * O padrão é testado contra a URL do recurso e contra o texto da mensagem.
   */
  ignorarErrosDe: (padrao: RegExp) => void;
}>({
  errosDeConsole: [
    async ({ page }, usar) => {
      const erros: string[] = [];
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        if (ignorados(page).some((re) => re.test(m.location().url) || re.test(m.text()))) return;
        erros.push(`console: ${m.text()}`);
      });
      page.on("pageerror", (e) => {
        if (ignorados(page).some((re) => re.test(e.message))) return;
        erros.push(`pageerror: ${e.message}`);
      });
      await usar(erros);
      expect(erros, "erros no console do navegador").toEqual([]);
    },
    { auto: true },
  ],
  ignorarErrosDe: async ({ page }, usar) => {
    await usar((padrao) => ignorados(page).push(padrao));
  },
});

const PADROES = new WeakMap<import("@playwright/test").Page, RegExp[]>();
/** Padrões ignorados por página; já começam com os ruídos conhecidos de toda a suíte. */
function ignorados(page: import("@playwright/test").Page): RegExp[] {
  let lista = PADROES.get(page);
  if (!lista) {
    lista = [
      // P-02: a fixture ficticio-multiuso-3p aponta de propósito para uma foto inexistente
      /frasco-inexistente/,
      // WebKit reporta como pageerror o prefetch RSC abortado por uma navegação rápida
      /_rsc=.*due to access control checks/,
    ];
    PADROES.set(page, lista);
  }
  return lista;
}

/** Fontes abortadas de propósito (MOB-01b). */
export const FONTES = /\.(woff2?|ttf|otf)(\?.*)?$/;
/** Recursos que falham porque o teste pôs o navegador offline. */
export const OFFLINE = /ERR_INTERNET_DISCONNECTED|net::ERR_FAILED/;

export { expect };
