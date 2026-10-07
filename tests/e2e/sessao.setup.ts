import { expect, test as setup } from "@playwright/test";
import { ARQ_SESSAO, COOKIE_SESSAO, SENHA_E2E } from "./sessao";

// Login uma vez por execução; os projetos de dispositivo reutilizam o cookie (playwright.config).
setup("login com a senha de teste", async ({ request }) => {
  const r = await request.post("/api/login", { form: { senha: SENHA_E2E, next: "/" }, maxRedirects: 0 });
  expect(r.status(), "POST /api/login com a senha de teste").toBe(303);
  const estado = await request.storageState({ path: ARQ_SESSAO });
  expect(estado.cookies.map((c) => c.name)).toContain(COOKIE_SESSAO);
});
