# Deploy, CI e Operação — Sistemas Adesivos

> Dono: Ponte (DevOps). Runtime/build alinhados com Molar (Tech Lead) — fonte técnica: [`ARQUITETURA.md`](./ARQUITETURA.md).
> Produto: [`BRIEFING.md`](./BRIEFING.md).
> Status: PWA, CI e `vercel.json` **implementados** na `main`. Repositório: [`HenriPett/projeto-gabi`](https://github.com/HenriPett/projeto-gabi). Vercel **plano Hobby**, domínio `*.vercel.app`, conectada pelo cliente via painel (seção 7).
> Preços: **curadoria manual** (decisão do cliente, 06/10/2026) — sem coleta automática (seção 4).

---

## 0. Premissas

- **Vercel**, sem servidor próprio. **Next.js 16.4**, App Router, TypeScript strict, `src/`, Tailwind v4, Turbopack.
- **Páginas estáticas (SSG)**: `generateStaticParams` + `dynamicParams = false`; os dados mudam por commit, não por requisição.
- **Runtime mínimo (desde 73cfb1c)**: acesso por senha — `src/proxy.ts` (Node) protege todas as rotas antes das páginas SSG, e os Route Handlers `/api/login` e `/api/logout` emitem/apagam o cookie de sessão (ARQUITETURA §4.1). Na Vercel isso vira Functions; não há banco nem estado no servidor.
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
| Functions | `src/proxy.ts` (todas as rotas, exceto `_next/static`/`_next/image`) + `/api/login`, `/api/logout`, na região padrão da Vercel; se a latência incomodar, mudar para `gru1` (São Paulo) em Settings → Functions |

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
Regra: **nenhum segredo em código ou commit**. `.env*` é ignorado no Git, exceto `.env.example`. Nenhuma variável é obrigatória: o site funciona na Vercel sem configuração. Para proteção real do acesso por senha, **recomenda-se definir `SENHA_ACESSO` e `SEGREDO_SESSAO`** (ARQUITETURA §4.1).

| Variável | Onde definir | Uso |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | opcional (Vercel) | só se houver domínio próprio; ver fallback abaixo |
| `INCLUIR_RASCUNHOS` | opcional | força exibir/esconder rascunhos |
| `DADOS_DIR` | só CI/testes | aponta para `tests/fixtures/dados` |
| `SENHA_ACESSO` | recomendado (Vercel, **Sensitive**) | senha do site; sem ela vale a senha combinada (só o SHA-256 está no código). E2E usa `teste-e2e` |
| `SEGREDO_SESSAO` | recomendado (Vercel, **Sensitive**) | chave HMAC do cookie (`openssl rand -hex 32`); trocar desloga todos |

**URL do site** (`src/lib/site.ts → urlDoSite()`, usada em `metadataBase` do layout e no `robots.txt`), resolvida no build:
`NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` (em produção: `<projeto>.vercel.app`) → `VERCEL_URL` (previews) → `http://localhost:3000`.

Fornecidas pela Vercel no build: `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` (deixar ligado "Automatically expose System Environment Variables", padrão).

Modelo para dev local: [`.env.example`](../.env.example) → copiar para `.env.local`.

### 1.5 Plano e domínio
- **Plano Hobby (gratuito)**, domínio `<projeto>.vercel.app` com HTTPS automático (requisito do PWA).
- Cabe no Hobby: páginas estáticas na CDN + um proxy leve por requisição e duas rotas de login (sem banco, sem cron). As invocações contam na cota mensal do Hobby — folgada para o tráfego esperado; acompanhar em Usage.
- Limites do Hobby a ter em mente: uso **não comercial** pelos termos da Vercel (se o site passar a ter fins comerciais — ex.: links de afiliado —, migrar para Pro); cotas mensais de banda/builds; um membro por time (o cliente é o dono da conta).
- Domínio próprio no futuro: Project → Settings → Domains, e definir `NEXT_PUBLIC_SITE_URL`.

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

## 4. Atualização de preços (manual)

Decisão do cliente (06/10/2026): **sem coleta automática**. Preços são curadoria manual do Bula; o histórico de preços é o histórico do Git.

1. Criar branch `dados/precos-AAAA-MM-DD`.
2. Editar `data/materiais/sistemas-adesivos/ofertas/<produto>.json`: preço `padrao` em centavos (o "por", não o Pix nem o "de" riscado), `status`, `url` da página **específica** do produto e `consultadoEm` = data da consulta. Preço não encontrado → `"status": "nao-encontrado"`. Nunca inventar.
3. `pnpm validar:dados` — o esquema (`src/lib/esquema/oferta.ts` + `validarUrlDeProduto` em `lojas.ts`) recusa URL de outra loja, home/categoria, oferta disponível sem preço `padrao`, ofertas duplicadas etc.
4. Commit `dados(precos): <produto> AAAA-MM-DD`, push, PR → `ci` verde + preview da Vercel conferido → merge → produção.

**Rollback:** `git revert` do merge.

## 5. Observabilidade

- **Versão no ar**: `GET /version.json`, arquivo estático gerado no início do build (`scripts/gerar-versao.mjs`, não versionado) → `{ status, commit, branch, ambiente, geradoEm, ofertas, precosAtualizadosEm }`. Serve como healthcheck (200) e mostra quão velhos estão os preços. Um monitor externo gratuito pode checar o 200 e o campo `precosAtualizadosEm`.
- **Logs**: Vercel Build Logs (erros de `validar:dados` aparecem aqui), **Runtime Logs** (proxy e `/api/login`/`/api/logout`) e logs do GitHub Actions (`ci`).
- **Preços envelhecendo**: `precosAtualizadosEm` em `/version.json` mostra a consulta mais recente; não há alerta automático.
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
  | conexão com a Vercel | Project → Settings → Git → Disconnect (o site atual continua no ar até apagar o projeto) |
  | PWA inteiro | kill switch acima + remover `<RegistrarServiceWorker />` do layout |
  | senha / segredo de sessão | editar ou remover a variável no painel + Redeploy (sem `SENHA_ACESSO` volta a senha combinada; trocar `SEGREDO_SESSAO` desloga todos) |

---

## 7. Importar o projeto na Vercel (passo a passo para o cliente)

Pré-requisito: acesso ao repositório [`HenriPett/projeto-gabi`](https://github.com/HenriPett/projeto-gabi) no GitHub.

1. Acesse [vercel.com/signup](https://vercel.com/signup), escolha **Hobby** e entre com **Continue with GitHub**.
2. No painel, clique em **Add New… → Project**.
3. Em *Import Git Repository*, clique em **Install** / **Adjust GitHub App Permissions** e autorize a Vercel **apenas** no repositório `projeto-gabi`. Volte e clique em **Import** ao lado dele.
4. Na tela *Configure Project*, **não altere** Framework (*Next.js*), Root Directory (`./`) nem os comandos (vêm do `vercel.json`).
   - O nome do projeto define o endereço: `projeto-gabi` → `https://projeto-gabi.vercel.app` (se o nome estiver ocupado, a Vercel acrescenta um sufixo).
5. Ainda nessa tela, abra **Environment Variables** e adicione as duas variáveis do acesso por senha (recomendado; sem elas vale a senha combinada no projeto):
   - `SENHA_ACESSO` = a senha que os usuários vão digitar.
   - `SEGREDO_SESSAO` = 64 caracteres aleatórios. Para gerar: `openssl rand -hex 32` no Terminal do Mac/Linux (ou um gerador de senhas com 64+ caracteres).
   - Em cada uma, marque **Sensitive** e deixe **Production** e **Preview** selecionados.
   - Guarde a senha num gerenciador de senhas: com *Sensitive* a Vercel não mostra o valor de novo.
   - Já importou sem elas? Settings → **Environment Variables** → adicionar → **Deployments → ⋯ → Redeploy** no último deploy de produção (variável nova só vale após novo deploy).
6. Clique em **Deploy** e aguarde (~1–2 min). Ao terminar, **Continue to Dashboard → Visit** abre o site, que pede a senha.
7. Conferências rápidas:
   - Settings → **General → Node.js Version** = 24.x.
   - Settings → **Deployment Protection → Vercel Authentication** ligado (previews só para quem tem acesso).
   - Abrir `https://<projeto>.vercel.app/version.json` → `"ambiente": "production"` e o commit da `main`.
   - Entrar com a senha definida; uma senha errada deve ser recusada.
   - No celular, abrir o site, entrar e usar **Adicionar à tela inicial**.

**Trocar a senha depois:** Settings → Environment Variables → editar `SENHA_ACESSO` → Redeploy. Para deslogar todos os aparelhos, troque também `SEGREDO_SESSAO`.

A partir daí: todo merge na `main` publica produção; todo PR/branch ganha um preview com link comentado no PR.

**Ainda recomendado no GitHub** (dono do repositório): Settings → Branches → regra para `main` exigindo PR e o check `ci`.

## 8. Arquivos sob responsabilidade do DevOps

`.github/workflows/ci.yml` · `vercel.json` · `.env.example` · `public/sw.js` · `src/pwa/` · `src/app/manifest.ts` · `src/app/robots.ts` · `src/app/offline/` · `assets/icon.svg` + ícones gerados · `scripts/{gerar-versao,gerar-icones}.mjs` · `scripts/sw-kill-switch.js` · este documento.
Toques em arquivos de outros donos (para review): `src/app/layout.tsx` (metadata PWA/robots + `<RegistrarServiceWorker />`), `package.json` (scripts `build`, `icons`), `.gitignore`, `src/lib/site.ts` (`urlDoSite`, para review do Tech Lead).
