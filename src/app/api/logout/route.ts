import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/auth/sessao";

/**
 * Apaga a sessão e o cache HTTP. Caches do SW e a flag local são limpos no
 * cliente (sairLocal); sem JS não há SW nem Cache Storage. Não usamos
 * Clear-Site-Data "storage" para manter o SW (e a página /offline) instalado.
 */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login?saiu=1", req.url), 303);
  res.cookies.set(COOKIE_SESSAO, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
  res.headers.set("Clear-Site-Data", '"cache"');
  res.headers.set("Cache-Control", "no-store");
  return res;
}
