import { describe, expect, it } from "vitest";
import { destinoSeguro, emitirToken, iguaisTempoConstante, rotaLivre, senhaCorreta, sha256, tokenValido } from "./sessao";

const env = { SENHA_ACESSO: "senha-de-teste", SEGREDO_SESSAO: "segredo-de-teste" };

describe("senha e sessão", () => {
  it("compara senha pela env", async () => {
    expect(await senhaCorreta("senha-de-teste", env)).toBe(true);
    expect(await senhaCorreta("senha-de-test", env)).toBe(false);
    expect(await senhaCorreta("", env)).toBe(false);
  });
  it("sem env, usa o hash embutido (senha errada é recusada)", async () => {
    expect(await senhaCorreta("qualquer", {})).toBe(false);
  });
  it("token emitido é aceito; adulterado, de outra chave ou sem formato é recusado", async () => {
    const t = await emitirToken("senha-de-teste", env);
    expect(t).toMatch(/^v1\.[0-9a-f]{64}$/);
    expect(await tokenValido(t, env)).toBe(true);
    expect(await tokenValido(t.slice(0, -1) + (t.endsWith("0") ? "1" : "0"), env)).toBe(false);
    expect(await tokenValido(t, { ...env, SEGREDO_SESSAO: "outro" })).toBe(false);
    expect(await tokenValido("v1.abc", env)).toBe(false);
    expect(await tokenValido(undefined, env)).toBe(false);
  });
  it("cookie não contém a senha", async () => {
    const t = await emitirToken("senha-de-teste", env);
    expect(t).not.toContain("senha-de-teste");
    expect(t).not.toContain(await sha256("senha-de-teste"));
  });
  it("sem SEGREDO_SESSAO, a chave é SENHA_ACESSO", async () => {
    const e = { SENHA_ACESSO: "s" };
    expect(await tokenValido(await emitirToken("s", e), e)).toBe(true);
  });
  it("tempo constante: só compara iguais de mesmo tamanho", () => {
    expect(iguaisTempoConstante("abc", "abc")).toBe(true);
    expect(iguaisTempoConstante("abc", "abd")).toBe(false);
    expect(iguaisTempoConstante("abc", "ab")).toBe(false);
  });
});

describe("rotas e destino", () => {
  it.each(["/login", "/offline", "/sw.js", "/manifest.webmanifest", "/robots.txt", "/icons/icon-192.png", "/img/produtos/x/frasco.webp", "/version.json", "/favicon.ico"])(
    "livre: %s",
    (p) => expect(rotaLivre(p)).toBe(true),
  );
  it.each(["/", "/produto/ambar", "/guia", "/busca", "/produto/ambar.rsc", "/dados.json", "/api/qualquer"])("protegida: %s", (p) =>
    expect(rotaLivre(p)).toBe(false),
  );
  it.each([
    ["/produto/ambar?x=1", "/produto/ambar?x=1"],
    ["//evil.com", "/"],
    ["https://evil.com", "/"],
    ["/\\evil.com", "/"],
    ["/%2F%2Fevil.com", "/"],
    ["/%5Cevil.com", "/"],
    ["/%E0", "/"],
    ["/login", "/"],
    [null, "/"],
  ])("destinoSeguro(%s) = %s", (de, para) => expect(destinoSeguro(de)).toBe(para));
});
