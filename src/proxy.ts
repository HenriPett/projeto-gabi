import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, rotaLivre, tokenValido } from "@/auth/sessao";

/**
 * Portão de senha do site inteiro (ARQUITETURA §1, "Acesso"). Roda no servidor
 * antes das páginas SSG: sem cookie válido, nenhum HTML/RSC protegido sai.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  let res: NextResponse;
  if (rotaLivre(pathname) || (await tokenValido(req.cookies.get(COOKIE_SESSAO)?.value))) {
    res = NextResponse.next();
  } else {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    res = NextResponse.redirect(login, 307);
    res.headers.set("Cache-Control", "no-store");
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // _next/static e _next/image são públicos (JS/CSS/imagens otimizadas, sem dado de página).
  matcher: ["/((?!_next/static|_next/image).*)"],
};
