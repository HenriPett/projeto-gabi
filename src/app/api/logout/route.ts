import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/auth/sessao";

/** Apaga a sessão e, onde o navegador suporta, o cache e o storage do site (inclui o SW). */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login?saiu=1", req.url), 303);
  res.cookies.set(COOKIE_SESSAO, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
  res.headers.set("Clear-Site-Data", '"cache", "storage"');
  res.headers.set("Cache-Control", "no-store");
  return res;
}
