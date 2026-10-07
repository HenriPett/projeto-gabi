import path from "node:path";

/** Senha SÓ de teste, injetada no webServer como SENHA_ACESSO. Nunca a senha real. */
export const SENHA_E2E = process.env.SENHA_ACESSO_E2E ?? "teste-e2e";
export const COOKIE_SESSAO = "sa_sessao";
export const CHAVE_LOCAL = "sa:sessao";
/** storageState logado, gerado pelo projeto "setup" (gitignored). */
export const ARQ_SESSAO = path.join(__dirname, ".auth", "sessao.json");
export const SEM_SESSAO = { cookies: [], origins: [] };
