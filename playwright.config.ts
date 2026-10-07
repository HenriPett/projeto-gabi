import { defineConfig, devices } from "@playwright/test";

/**
 * E2E (docs/PLANO-DE-TESTES.md). Sempre contra build de produção com o
 * catálogo fictício: dados determinísticos e service worker ativo.
 */
const PORTA = Number(process.env.PORTA_E2E ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "small", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: false } },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    // nunca reaproveitar: um next start antigo na porta serve build velho (CSS/dados desatualizados)
    reuseExistingServer: false,
    timeout: 240_000,
    env: { DADOS_DIR: "tests/fixtures/dados", INCLUIR_RASCUNHOS: "0", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
