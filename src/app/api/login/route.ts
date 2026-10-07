import { NextResponse } from "next/server";
import { COOKIE_SESSAO, MAX_AGE_SESSAO, destinoSeguro, emitirToken, senhaCorreta } from "@/auth/sessao";

const ATRASO_ERRO_MS = 700;

/** POST de formulário (funciona sem JS): campos `senha` e `next`. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => new FormData());
  const senha = String(form.get("senha") ?? "");
  const next = destinoSeguro(String(form.get("next") ?? "/"));

  if (!senha || !(await senhaCorreta(senha))) {
    await new Promise((r) => setTimeout(r, ATRASO_ERRO_MS));
    const login = new URL("/login", url);
    login.searchParams.set("erro", "1");
    if (next !== "/") login.searchParams.set("next", next);
    const res = NextResponse.redirect(login, 303);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const res = NextResponse.redirect(new URL(next, url), 303);
  res.cookies.set(COOKIE_SESSAO, await emitirToken(senha), {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: MAX_AGE_SESSAO,
    path: "/",
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
