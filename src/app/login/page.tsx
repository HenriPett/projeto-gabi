import type { Metadata } from "next";
import { Suspense } from "react";
import { FormLogin, FormLoginComQuery } from "@/components/login/FormLogin";
import { Marca } from "@/components/Marca";

// /login — fora do layout do site (sem header/busca). Livre no proxy; resto do site exige sessão.
export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function PaginaLogin() {
  return (
    <main id="conteudo" className="login">
      <div className="login__cartao">
        <p className="login__marca">
          <Marca />
        </p>
        <h1 className="login__titulo">Entrar</h1>
        <p className="muted small">Acesso restrito. Digite a senha de acesso ao site.</p>
        {/* Fallback = o mesmo formulário sem avisos: funciona sem JS (HTML estático). */}
        <Suspense fallback={<FormLogin />}>
          <FormLoginComQuery />
        </Suspense>
      </div>
    </main>
  );
}
