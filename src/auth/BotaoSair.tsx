"use client";

import { sairLocal } from "./cliente";

/** Form POST /api/logout (funciona sem JS); com JS, limpa flag e caches antes. */
export function BotaoSair({ className = "" }: { className?: string }) {
  return (
    <form
      action="/api/logout"
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        await sairLocal();
        form.submit();
      }}
    >
      <button type="submit" className={className} data-testid="btn-sair">
        Sair
      </button>
    </form>
  );
}
