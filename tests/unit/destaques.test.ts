import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Destaques } from "@/lib/esquema";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DADOS_DIR", "tests/fixtures/dados");
});
afterEach(() => vi.unstubAllEnvs());

it("destaques seguem a ordem da curadoria e escondem rascunho em produção", async () => {
  vi.stubEnv("INCLUIR_RASCUNHOS", "0");
  const { catalogo } = await import("@/lib/dados/carregar");
  expect(catalogo().destaques["sistemas-adesivos"]).toEqual(["ficticio-universal-triplo", "ficticio-ambar"]);
});

it("com rascunhos, mantém todos", async () => {
  vi.stubEnv("INCLUIR_RASCUNHOS", "1");
  const { catalogo } = await import("@/lib/dados/carregar");
  expect(catalogo().destaques["sistemas-adesivos"]).toHaveLength(3);
});

it("rejeita id repetido", () => {
  expect(Destaques.safeParse({ produtos: ["a", "a"] }).success).toBe(false);
});
