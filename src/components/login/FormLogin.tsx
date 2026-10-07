"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconeAlerta, IconeInfo } from "../Icones";

// TODO(Molar): importar CHAVE_LOCAL de src/auth/cliente.ts quando o núcleo do login estiver no main.
const CHAVE_LOCAL = "sa:sessao";

type Aviso = { tipo: "erro" | "info"; texto: string } | null;

/** Só caminho interno (o servidor revalida; isto evita mandar lixo no campo). */
export function proximoSeguro(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function avisoDoLogin(params: URLSearchParams, sessaoLocal: boolean): Aviso {
  if (params.get("erro") === "1") return { tipo: "erro", texto: "Senha incorreta. Tente novamente." };
  if (params.get("saiu") === "1") return { tipo: "info", texto: "Você saiu." };
  if (sessaoLocal) return { tipo: "info", texto: "Sua sessão expirou. Entre novamente." };
  return null;
}

function lerSessaoLocal() {
  try {
    return localStorage.getItem(CHAVE_LOCAL) !== null;
  } catch {
    return false;
  }
}

/** Formulário (funciona sem JS: POST /api/login). Com JS, preenche `next` e mostra avisos da query. */
export function FormLogin({ params }: { params?: URLSearchParams }) {
  const [sessaoLocal, setSessaoLocal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const p = params ?? new URLSearchParams();
  const aviso = avisoDoLogin(p, sessaoLocal);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no cliente
    setSessaoLocal(lerSessaoLocal());
    campo.current?.focus();
  }, []);

  return (
    <form className="login__form" method="post" action="/api/login" onSubmit={() => setEnviando(true)}>
      <input type="hidden" name="next" value={proximoSeguro(p.get("next"))} />
      <div role="alert" aria-live="assertive" className="login__aviso-area">
        {aviso && (
          <p className={`note ${aviso.tipo === "erro" ? "note--error" : "note--info"}`} data-testid="login-aviso">
            {aviso.tipo === "erro" ? <IconeAlerta /> : <IconeInfo />}
            <span>{aviso.texto}</span>
          </p>
        )}
      </div>
      <label htmlFor="senha" className="login__label">
        Senha
      </label>
      <input
        ref={campo}
        id="senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
        className="login__campo"
        aria-invalid={aviso?.tipo === "erro" || undefined}
      />
      <button type="submit" className="btn btn--primary btn--lg btn--block" aria-busy={enviando || undefined} disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

/** Lê a query no cliente (rota estática): precisa de <Suspense>. */
export function FormLoginComQuery() {
  const params = useSearchParams();
  return <FormLogin params={new URLSearchParams(params.toString())} />;
}
