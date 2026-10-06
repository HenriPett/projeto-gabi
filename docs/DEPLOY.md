# Deploy, CI e Operação — Sistemas Adesivos

> Dono: Ponte (DevOps). Runtime/build alinhados com Molar (Tech Lead) — fonte técnica: [`ARQUITETURA.md`](./ARQUITETURA.md).
> Produto: [`BRIEFING.md`](./BRIEFING.md).
> Status: PWA, CI, `vercel.json` e Action de preços **implementados** (branch `chore/pwa-ci`). Conexão com a Vercel e com o GitHub **ainda não feita** (seção 7).

---

## 0. Premissas

- **Vercel**, sem servidor próprio. **Next.js 16.4**, App Router, TypeScript strict, `src/`, Tailwind v4, Turbopack.
- **Site 100% estático (SSG)**: `generateStaticParams` + `dynamicParams = false`; sem API routes, sem Server Actions, sem Functions. A Vercel serve tudo da CDN — não há região de Function a escolher nem runtime para monitorar.
- **Node 24** (`.nvmrc` + `engines.node`), **pnpm 10** (`packageManager`, via Corepack).
- Dados versionados em `data/**/*.json`, validados com zod (`pnpm validar:dados`) e no build — dado inválido quebra o build de propósito. Preços em `data/materiais/<material>/ofertas/<produto>.json`, em centavos.
- **Rascunhos**: `catalogo()` exclui `revisao.status = "rascunho"` quando `VERCEL_ENV=production`; em preview/dev aparecem com selo. Forçar com `INCLUIR_RASCUNHOS=0|1`.
- A CLI `vercel` não é usada no fluxo normal (deploy por Git). Nenhum deploy/login sem pedido explícito do responsável.

---

## 1. Vercel

### 1.1 Projeto
| Item | Valor |
|---|---|
| Framework preset | Next.js (`vercel.json → framework`) |
| Root directory | raiz do repositório |
| Install | `pnpm install --frozen-lockfile` (`vercel.json`) |
| Build | `pnpm build` = `node scripts/gerar-versao.mjs && next build` |
| Node.js | 24.x (lido de `engines`) |
| Functions | nenhuma |

### 1.2 Ambientes e previews por branch
| Evento Git | Ambiente | `VERCEL_ENV` | Rascunhos | Indexável |
|---|---|---|---|---|
| merge em `main` | Production | `production` | não | sim |
| push em outra branch / PR | Preview (URL por commit + alias por branch) | `preview` | sim, com selo | não |
| `pnpm dev` / build local | — | indefinido | sim | não |

- Fluxo: branch (`feat/…`, `dados/…`, `chore/…`) → PR → `ci` verde + preview revisado → review do Tech Lead → merge → produção.
- Previews não são indexados: `src/app/robots.ts` gera `Disallow: /` e o layout emite `<meta name="robots" content="noindex, nofollow">` sempre que `VERCEL_ENV !== "production"`.
- Recomendado: Vercel Authentication ligado para previews.

### 1.3 `vercel.json`
Só cabeçalhos (nada de rewrites/crons):
- `/sw.js`: `Cache-Control: no-cache, no-store, must-revalidate`, `Content-Type: application/javascript`, `Service-Worker-Allowed: /` — garante que um SW novo é pego a cada deploy.
- `/version.json`, `/manifest.webmanifest`: sem cache longo.
- Todas as rotas: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.

### 1.4 Variáveis de ambiente
Regra: **nenhum segredo em código ou commit**. `.env*` é ignorado no Git, exceto `.env.example`.

| Variável | Onde definir | Uso |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel (Production; Preview opcional) | URL canônica no `robots.txt` |
| `INCLUIR_RASCUNHOS` | opcional | força exibir/esconder rascunhos |
| `DADOS_DIR` | só CI/testes | aponta para `tests/fixtures/dados` |
| `PRECOS_PR_TOKEN` | GitHub → Secrets | token da Action de preços (seção 4) |

Fornecidas pela Vercel no build: `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` (deixar ligado "Automatically expose System Environment Variables", padrão).

Modelo para dev local: [`.env.example`](../.env.example) → copiar para `.env.local`.

### 1.5 Domínio
A definir pelo cliente; até lá, `*.vercel.app`. HTTPS automático (requisito do PWA).

---

## 2. PWA

### 2.1 Manifest — `src/app/manifest.ts`
Servido em `/manifest.webmanifest` (o Next injeta o `<link rel="manifest">`). `name` "Sistemas Adesivos", `short_name` "Adesivos", `lang` pt-BR, `display` standalone, `start_url`/`scope` `/`, `theme_color` `#5E2280` (`--purple-700`), `background_color` `#FFFFFF`. iOS: `appleWebApp` + `viewport.themeColor` no layout.

### 2.2 Ícones
- Fonte única: `assets/icon.svg` (placeholder: três camadas ácido/primer/adesivo na paleta; Pulpa pode substituir).
- `pnpm icons` gera e a saída é **commitada**: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (conteúdo dentro da zona segura de 80%) e `src/app/apple-icon.png` (180 px, convenção do Next). Usa o `sharp` que já vem com o Next.
- `src/app/favicon.ico` do scaffold continua.

### 2.3 Service worker — `public/sw.js` (manual, sem Serwist)
Fica em `public/`, então não passa pelo bundler e funciona igual com Turbopack e na Vercel.

| Requisição | Estratégia |
|---|---|
| instalação | precache do shell: `/`, `/offline`, manifest, ícones |
| navegação (HTML) | network-first → cópia em cache → `/offline` |
| `/_next/static/*` (nome com hash) | cache-first |
| imagens | stale-while-revalidate, até 80 entradas |
| RSC, `/version.json`, `/sw.js`, outras origens | não interceptadas |

- Registro: `src/pwa/RegistrarServiceWorker.tsx`, montado no layout, **só em produção** (`next start`/Vercel; nunca em `next dev`).
- Versionamento: registrado como `/sw.js?v=<commit>`. Cada deploy muda a URL → o navegador instala o SW novo (`skipWaiting` + `clients.claim`) → ele apaga os caches de páginas/shell da versão anterior.
- Preço visto offline continua honesto: a UI sempre mostra "Última atualização: DD/MM/AAAA".
- Página `/offline` (`src/app/offline/page.tsx`, não indexada).
- Verificação manual por release: DevTools → Application (Manifest sem erros, SW ativo); modo avião → páginas visitadas abrem, não visitadas mostram `/offline`; instalar no Android (Chrome) e no iOS (Safari → Compartilhar → Adicionar à Tela de Início).

---

## 3. CI — `.github/workflows/ci.yml`

Roda em todo `pull_request` e em `push` na `main`. A Vercel faz o build de deploy; o CI é o gate.

1. `pnpm install --frozen-lockfile` (Node de `.nvmrc`, pnpm de `packageManager`, cache do pnpm).
2. `pnpm check` = lint + typecheck + test + validar:dados.
3. `pnpm build` com `VERCEL_ENV=production` — mesmo comportamento da produção (sem rascunhos).
4. `DADOS_DIR=tests/fixtures/dados pnpm build` — garante que as páginas geram com catálogo preenchido, mesmo enquanto `data/` está vazio.
5. `DADOS_DIR=tests/fixtures/dados INCLUIR_RASCUNHOS=0 pnpm build` — mesmo catálogo com rascunhos excluídos (como em produção): nenhuma rota pode depender de produto em rascunho.

Configurar no GitHub (seção 7): proteção da `main` exigindo o check `ci` + status da Vercel.
Fase 2: E2E Playwright + axe (Sonda) contra a URL de preview (`deployment_status`).

---

## 4. Atualização de preços — `.github/workflows/precos.yml`

Princípio: **nunca inventar preço**; toda mudança passa por PR revisado.

**Como funciona:**
1. Toda segunda às 06h (Brasília) ou manualmente (`workflow_dispatch`, com filtro opcional de produtos).
2. `pnpm precos:atualizar` (`scripts/atualizar-precos.ts`) visita a `url` de cada oferta cadastrada (ignora `nao-encontrado`), respeitando o `robots.txt` da loja e 3 s entre requisições por loja, com user-agent identificado (`SistemasAdesivosBot`).
3. Lê o preço do **JSON-LD schema.org** (`Product` → `Offer`) da página (`scripts/precos/extrair.ts`, com testes unitários).
   - Em estoque → `disponivel` + preço `padrao`; fora de estoque → `indisponivel`; ambos com `consultadoEm` = hoje.
   - A `url` cadastrada e a URL final após redirects passam por `validarUrlDeProduto`: redirect para home/categoria (comum quando o produto sai de linha) é **falha**, nunca `indisponivel`.
   - Página com variações de preço e sem `skuLoja` na oferta, SKU divergente, moeda ≠ BRL, HTTP ≠ 200, sem JSON-LD → **oferta fica como estava** (com a data antiga) e entra no relatório.
   - Pix/boleto não vêm no JSON-LD: são removidos quando o preço é reconsultado (não exibir valor velho com data nova) e o relatório avisa.
   - Variação > 30% é destacada para conferência.
   - Arquivo só é gravado se continuar válido no esquema zod.
4. Guarda: o job falha se algo fora de `data/materiais/*/ofertas/*.json` mudou. Depois roda `validar:dados` e `test`.
5. O corpo do PR traz um checklist de curadoria (Bula): confirmar por loja que o `price` do JSON-LD é o preço padrão ("por"), não Pix/boleto nem o "de" riscado; conferir variações; decidir ofertas redirecionadas.
6. Abre/atualiza o PR `dados(precos): atualização automática AAAA-MM-DD` na branch `dados/precos-automatico`, com o relatório no corpo. A Vercel gera preview do PR; revisão humana → merge → produção.

**Rollback:** `git revert` do merge do PR de preços.

**⚠️ Risco conhecido (testado em 06/10/2026):** Dental Cremer e Dental Speed respondem **403** a clientes que não se identificam como navegador (inclusive no `robots.txt`); Dental Med Sul responde normalmente. Não vamos disfarçar o bot de navegador. Enquanto não houver alternativa, as ofertas dessas lojas aparecerão como "Não atualizadas" no relatório e seguem por curadoria manual (Bula). Caminhos a avaliar: feed/API de afiliados das lojas, ou permissão das lojas para o user-agent.

**Alternativa futura (não adotada):** Vercel Cron + rota gravando em Blob/Edge Config. Exigiria a primeira Function do projeto (quebra o "100% SSG"), um store mutável e perderia a revisão humana. Só reavaliar se precisarmos de atualização diária sem PR.

---

## 5. Observabilidade

- **Versão no ar**: `GET /version.json`, arquivo estático gerado no início do build (`scripts/gerar-versao.mjs`, não versionado) → `{ status, commit, branch, ambiente, geradoEm, ofertas, precosAtualizadosEm }`. Serve como healthcheck (200) e mostra quão velhos estão os preços. Um monitor externo gratuito pode checar o 200 e o campo `precosAtualizadosEm`.
- **Logs**: Vercel Build Logs (erros de `validar:dados` aparecem aqui) e logs das Actions. Não há Runtime Logs (sem Functions).
- **Falhas da Action de preços**: notificação padrão do GitHub para os mantenedores.
- **Métricas (proposta, aguarda ok do Tech Lead/produto)**: Vercel Web Analytics + Speed Insights — sem cookies; daria o dado real para "Produtos mais consultados" (ARQUITETURA §9).

---

## 6. Versionamento e rollback

- Conventional Commits em português; tags `vX.Y.Z` na `main` nos releases.
- **App**: Vercel → Deployments → deploy anterior → *Instant Rollback* (sem rebuild). Em seguida `git revert` na `main` para alinhar código e produção.
- **Dados/preços**: `git revert` do PR.
- **Service worker quebrado**: copiar `scripts/sw-kill-switch.js` por cima de `public/sw.js` e fazer deploy — na próxima visita ele apaga os caches, se desregistra e recarrega as abas. Corrigido o problema, restaurar o `sw.js` normal.
- **Mudanças de infra** (cada uma com o caminho de volta):

  | Mudança | Como desfazer |
  |---|---|
  | `vercel.json` (headers) | reverter o commit; sem o arquivo a Vercel usa os padrões do Next |
  | variável de ambiente | apagar/restaurar no painel da Vercel e redeploy |
  | `ci.yml` / proteção da `main` | reverter o commit / desmarcar o check em Settings → Branches |
  | `precos.yml` | desabilitar o workflow em Actions (sem commit) ou reverter |
  | PWA inteiro | kill switch acima + remover `<RegistrarServiceWorker />` do layout |

---

## 7. Passos manuais pendentes (responsável humano)

- [ ] Criar o repositório no GitHub e fazer push (`main` + `chore/pwa-ci`).
- [ ] Settings → Actions → General → permitir que Actions criem pull requests.
- [ ] Criar o secret `PRECOS_PR_TOKEN` (fine-grained PAT ou GitHub App com `contents` e `pull-requests: write`) — sem ele o PR de preços não dispara o `ci`.
- [ ] Proteção da `main`: exigir PR, check `ci` e status da Vercel.
- [ ] Importar o repositório na Vercel (dashboard), conferir Node 24, definir `NEXT_PUBLIC_SITE_URL` e ligar Vercel Authentication nos previews.
- [ ] Domínio de produção; plano Vercel (Hobby proíbe uso comercial — avaliar Pro).
- [ ] Decidir a coleta de preços em Dental Cremer/Dental Speed (seção 4).

## 8. Arquivos sob responsabilidade do DevOps

`.github/workflows/{ci,precos}.yml` · `vercel.json` · `.env.example` · `public/sw.js` · `src/pwa/` · `src/app/manifest.ts` · `src/app/robots.ts` · `src/app/offline/` · `assets/icon.svg` + ícones gerados · `scripts/{gerar-versao,gerar-icones}.mjs` · `scripts/atualizar-precos.ts` · `scripts/precos/` · `scripts/sw-kill-switch.js` · este documento.
Toques em arquivos de outros donos (para review): `src/app/layout.tsx` (metadata PWA/robots + `<RegistrarServiceWorker />`), `package.json` (scripts `build`, `icons`, `precos:atualizar`), `.gitignore`.
