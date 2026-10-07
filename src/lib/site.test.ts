import { describe, expect, it } from "vitest";
import { urlDoSite } from "./site";

describe("urlDoSite", () => {
  it("prefere NEXT_PUBLIC_SITE_URL e remove barra final", () =>
    expect(urlDoSite({ NEXT_PUBLIC_SITE_URL: "https://exemplo.com.br/", VERCEL_URL: "x.vercel.app" })).toBe(
      "https://exemplo.com.br",
    ));
  it("em produção usa o domínio de produção do projeto", () =>
    expect(
      urlDoSite({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "projeto-gabi.vercel.app", VERCEL_URL: "projeto-gabi-abc123.vercel.app" }),
    ).toBe("https://projeto-gabi.vercel.app"));
  it("em preview usa a URL do deploy", () =>
    expect(
      urlDoSite({ VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "projeto-gabi.vercel.app", VERCEL_URL: "projeto-gabi-git-x.vercel.app" }),
    ).toBe("https://projeto-gabi-git-x.vercel.app"));
  it("sem nada, localhost", () => expect(urlDoSite({})).toBe("http://localhost:3000"));
});
