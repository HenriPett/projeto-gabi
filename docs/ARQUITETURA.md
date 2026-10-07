# Arquitetura — Plataforma de Sistemas Adesivos

> Dono: Molar (Tech Lead). Fonte de verdade técnica. Produto: [`BRIEFING.md`](./BRIEFING.md) · Visual: [`DESIGN.md`](./DESIGN.md) · Deploy: [`DEPLOY.md`](./DEPLOY.md) · Testes: [`PLANO-DE-TESTES.md`](./PLANO-DE-TESTES.md).
> Mudanças em **contratos** (esquema de dados, rotas, funções de `src/lib`) passam por mim antes de implementar.

## 1. Decisões (e por quê)

| Tema | Decisão | Motivo |
|---|---|---|
| Framework | **Next.js 16.4 (App Router) + TypeScript strict**, Turbopack | Pedido do briefing; deploy nativo na Vercel. |
| Renderização | **Páginas 100% SSG**: `generateStaticParams` + `dynamicParams = false` em toda rota dinâmica. Runtime só no portão de acesso: `src/proxy.ts` e `/api/login`, `/api/logout` (§4.1). Sem Server Actions. | Dados mudam por commit, não por requisição. Mais rápido, mais barato, funciona offline no PWA. |
| Cache Components | **Desligado** | Não há dado de runtime; ele exige `generateStaticParams` não vazio (quebraria build com catálogo vazio). |
| Dados | **JSON versionado em `data/`**, validado com **zod** no build, no CI e por `pnpm validar:dados`. Sem banco na v1. | Rastreabilidade (cada dado tem fonte + data; git dá histórico e revisão por PR), zero infra. Catálogo é de dezenas de produtos. |
| Preços | Arquivo separado por produto (`ofertas/`), em **centavos inteiros**. | Preços são curados manualmente (Bula) — decisão do cliente: sem coleta automática. Revisão por diff só nesses arquivos. Nada de float. |
| Acesso | **Senha única** (pedido do cliente) conferida no **servidor** por `src/proxy.ts` (Next 16 Proxy, runtime Node). Cookie `sa_sessao` HttpOnly, SameSite=Lax, Secure em https, 1 ano, valor HMAC-SHA256 (nunca a senha). Login/logout por Route Handlers `POST /api/login` e `/api/logout` (funcionam sem JS). | Páginas são SSG: um portão só em JS deixaria o HTML acessível. O proxy roda antes do arquivo estático, então nada protegido sai sem cookie. |
| Estilo | **Tailwind v4** + tokens CSS do DESIGN.md §1 em `globals.css`. | Padrão do create-next-app; tokens são a ponte com o design. |
| Busca | Índice gerado no build (`itemDeBusca`) + filtro no cliente (`buscar`). Sem biblioteca. | Dezenas de itens; substring normalizada (sem acento, `&`, espaços) basta. |
| PWA | `app/manifest.ts` nativo + **service worker manual** `public/sw.js` (Ponte). Sem Serwist. | Menos acoplamento com o bundler; o site é estático, o SW é simples. |
| Testes | **Vitest** (lógica pura + esquema). **Playwright** + axe (Sonda) para E2E. | Regras de preço/dados são o maior risco → unitário exaustivo. |
| Pacotes / Node | **pnpm 10**, **Node 24** (`.nvmrc`, `engines`). | — |

**Não usamos** (e por quê): banco/ORM (sem necessidade de escrita em runtime), CMS (dados exigem fonte por campo e revisão — PR resolve), estado global (Zustand/Redux; só o comparador tem estado e cabe na URL), biblioteca de busca, i18n (só pt-BR).

## 2. Estrutura de pastas

```
data/
  schemas/*.schema.json              # GERADO (pnpm gerar:json-schema) — autocomplete no editor
  materiais/
    sistemas-adesivos/
      categorias.json                # textos explicativos por grupo/subcategoria (com fonte)
      destaques.json                 # { produtos: [ids] } curadoria "Em destaque", na ordem exibida
      guia/<slug>.json               # artigos do Guia rápido (parágrafos com fonte) ← Dentina
      glossario.json                 # glossário de adesão (termos com fonte) ← Dentina
      produtos/<id>.json             # 1 arquivo por produto  ← Bula
      ofertas/<id>.json              # preços por loja/apresentação ← Bula (curadoria manual)
public/
  img/produtos/<id>/*.webp           # fotos dos frascos (com fonte no JSON do produto)
scripts/
  validar-dados.ts                   # pnpm validar:dados
  gerar-json-schema.ts               # pnpm gerar:json-schema
src/
  app/                               # rotas (ver §4) ← Pulpa
  components/                        # componentes de UI (DESIGN.md §3) ← Pulpa
  lib/
    esquema/                         # CONTRATO de dados (zod + tipos) ← Molar
      comum.ts                       #   Fonte, atributo(), Divergencia, Imagem, Revisao
      taxonomia.ts                   #   grupos, subcategorias, slugs, sequência visual
      sistema-adesivo.ts             #   ProdutoSistemaAdesivo
      oferta.ts                      #   OfertasDoProduto, Oferta, TipoPreco
      lojas.ts                       #   LOJAS, validarUrlDeProduto
      conteudo.ts                    #   ConteudoCategorias
      index.ts                       #   registro de materiais (ESQUEMA_POR_MATERIAL)
    dados/carregar.ts                # leitura + validação de data/ (só build)
    precos.ts                        # compararPrecos, apresentacaoParaComparar, maioresEconomias
    busca.ts                         # normalizar, itemDeBusca, buscar
    formato.ts                       # formatarBRL, formatarData
tests/
  fixtures/dados/                    # catálogo FICTÍCIO p/ testes (DADOS_DIR=tests/fixtures/dados)
  unit/                              # testes de esquema
  e2e/                               # Playwright ← Sonda
```

Donos por pasta (evita conflito entre agentes): `data/` + `public/img/produtos/` → Bula · `src/app`, `src/components`, `globals.css` → Pulpa · `src/lib`, `docs/ARQUITETURA.md` → Molar · `.github/`, `vercel.json`, `public/sw.js`, `app/manifest.ts`, ícones → Ponte · `tests/e2e` → Sonda.

## 3. Modelo de dados

Fonte de verdade: os arquivos em `src/lib/esquema/` (comentados). Exemplo completo e válido: `tests/fixtures/dados/materiais/sistemas-adesivos/`. Resumo:

### 3.1 Princípios
1. **Toda afirmação tem fonte.** Cada produto declara `fontes: [{ id, tipo, titulo, url, acessadoEm, versao? }]`; cada campo factual referencia ids em `fontes: ["ifu"]`. O validador rejeita referência a fonte inexistente e afirmação sem fonte.
2. **Ausência explícita.** Atributos da tabela COMPARAR (`mdp`, `hema`, `silano`, `solventes`, `polimerizacao`) são `{ valor, fontes }` ou `{ "valor": "nao-informado" }`. Nunca omitir nem chutar.
3. **Divergência registrada, não resolvida.** `divergencias: [{ campo, descricao, versoes: [≥2 × { valor, fontes }] }]`. `campo` é o caminho do dado (`"composicao.hema"`); a UI mostra `<DivergenceNote>` junto ao campo.
4. **Protocolo é do produto.** `protocolos[]` com `aplicaA` (subcategorias), `etapas[]` (`tipo`, `titulo`, `descricao`, `parametros[]`) e fonte **oficial obrigatória** (tipo `ifu`/`ficha-tecnica`/`site-fabricante`/`embalagem`). Ausência de protocolo **não** impede publicação: a UI mostra "Protocolo oficial não localizado".
5. **Rascunho não vai para produção.** `revisao.status`: `rascunho` aparece em dev/preview (com selo), nunca quando `VERCEL_ENV=production`. Forçar: `INCLUIR_RASCUNHOS=0|1`.
6. **Critério objetivo de publicação** (decisão do Tech Lead em 2026-10-06; o cliente não aprova item a item). Um produto pode ser `publicado` quando:
   - cada subcategoria em `classificacao.subcategorias` cita ao menos uma fonte **técnica** (`ifu`, `ficha-tecnica`, `site-fabricante`, `embalagem`, `literatura`, `fds` — não `loja`/`outro`); e
   - há ao menos uma apresentação com fonte (qualquer tipo, inclusive `loja`).

   O validador recusa `publicado` fora do critério. **Não bloqueiam**: protocolo, imagem, composição, indicações. A UI exibe a ausência como "Informação ainda não verificada" (protocolo: "Protocolo oficial não localizado"; imagem: silhueta neutra de frasco) e nunca preenche com dado de outro produto. Quem grava um produto que passa no critério já o grava como `publicado`.
   Artigo do Guia: `publicado` exige ao menos uma fonte técnica/científica; todo parágrafo cita fonte.

### 3.2 Produto (`ProdutoSistemaAdesivo`)
```
id, material: "sistemas-adesivos", nomeComercial, fabricante {id, nome}, aliases[]
classificacao { grupo, subcategorias[{ id, fontes }] }   # universal: 1..3 estratégias com indicação oficial
estrategiaAdesiva? { texto, fontes }
composicao { componentes[{nome, funcao?, frasco?, fontes}], mdp, hema, silano, solventes, polimerizacao, outros[] }
indicacoes[], contraindicacoes[]                        # { texto, fontes }
protocolos[{ id, titulo, aplicaA[], etapas[], observacoes[], fontes }]
apresentacoes[{ id, tipo, descricao, quantidade, volumeMl?, massaG?, itens[], codigoFabricante?, ean?, fontes }]
apresentacaoPrincipal                                    # id mostrado no card
imagens[{ arquivo, alt, fontes, credito? }]
fontes[], divergencias[], revisao { status, atualizadoEm, responsavel?, notas? }
```
Universais (§7–§8 do briefing): **um único produto** com várias entradas em `classificacao.subcategorias`; ele aparece nas listas de cada estratégia, e a página do produto troca só o protocolo (DESIGN §4.5).

Derivados da taxonomia (não ficam no JSON): rótulos, slugs, sequência do diagrama "Como identificar?", colunas Condicionamento/Primer/Adesivo/Número de passos do comparador.

### 3.3 Guia rápido (`ArtigoGuia`)
```
data/materiais/<material>/guia/<slug>.json
{ slug (= nome do arquivo), titulo, resumo, ordem,
  secoes[{ titulo?, paragrafos[{ texto, fontes[ids] }] }],   # todo parágrafo cita fonte
  fontes[Fonte],                                            # DOI na url (https://doi.org/…)
  relacionados[slugs], revisao }
```
Leitura: `catalogo().guia[material]` — artigos visíveis, ordenados por `ordem`; relacionados ocultos (rascunho) são removidos para não virar link 404. O slug `glossario` é reservado. **Trilha de leitura (DESIGN §4.9) = ordem crescente de `ordem`**; não há arquivo de trilha separado.

Glossário (`Glossario`, `data/materiais/<material>/glossario.json`): `{ fontes[Fonte], termos[{ id, termo, sigla?, nomeCompleto?, sinonimos[], definicao, fontes[ids], artigos[slugs do guia], relacionados[ids de termos] }], revisao }`. Leitura: `catalogo().glossario[material]` (oculto em produção se rascunho; links para artigos ocultos removidos). Ordem alfabética é da UI. **Sem rota própria:** o glossário é renderizado em `/guia`, abaixo dos cartões (DESIGN §4.9), com âncora `#termo-{id}`; links de artigos e da busca apontam para `/guia#termo-{id}`.

### 3.4 Ofertas (`OfertasDoProduto`)
```
produtoId
ofertas[{
  lojaId: dental-cremer | dental-speed | dental-med-sul
  apresentacaoId           # EXATA; é a chave de comparação
  status: disponivel | indisponivel | nao-encontrado
  url?                     # obrigatória salvo nao-encontrado; https, domínio da loja, forma de página de produto (validado)
  tituloNaLoja?, skuLoja?
  precos[{ tipo: padrao | pix | boleto, centavos, condicao? }]   # disponivel exige "padrao"
  consultadoEm             # → "Última atualização: DD/MM/AAAA"
  observacao?
}]
```
- **Comparação só com o mesmo `apresentacaoId`**. A equivalência (fabricante + nome + volume + quantidade + SKU) é decidida na curadoria; anúncio que não bate com nenhuma apresentação → cadastrar nova apresentação no produto, nunca forçar.
- Comparação usa **`padrao`** (preço vigente sem condição de pagamento). Pix/boleto são informativos.
- Uma oferta por (loja, apresentação). Histórico de preço = histórico do git.
- Link de compra (`validarUrlDeProduto`, padrões confirmados pelo Bula em 2026-10-06): Cremer e Speed `/<slug>.html` (um nível); Med Sul `/<slug>` (um nível, sem `.html`). Sempre bloqueados: home (`/`, `//`, `/index.*`), `catalogsearch`/busca, `especialidades`, `media`, params `q`/`s`/…. **Limite:** na Med Sul uma categoria de um nível tem a mesma forma de um produto — ali a revisão humana do link é a garantia.

## 4. Rotas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `/login` | `app/login/page.tsx` | Senha de acesso (livre; §4.1) |
| `/` | `app/(protegido)/page.tsx` | Home (DESIGN §4.1) |
| `/sistemas-adesivos/{grupo}/{subcategoria}` | `app/sistemas-adesivos/[grupo]/[subcategoria]/page.tsx` | Categoria / estratégia universal (§4.2, §4.4) |
| `/produto/{id}` (+ `#precos`, `?estrategia={slug}`) | `app/produto/[id]/page.tsx` | Produto, modo de uso, preços (§4.3, §4.7) |
| `/comparar?ids=a,b,c` | `app/comparar/page.tsx` | Comparador (§4.6) — ler `ids` no cliente para manter rota estática |
| `/busca?q=` | `app/busca/page.tsx` | Resultados (§4.8) — idem, no cliente |
| `/guia` (+ glossário, `#termo-{id}`), `/guia/{slug}` | `app/guia/…` | Guia rápido e glossário (§3.3) |
| `/metodologia` | `app/metodologia/page.tsx` | Fontes e metodologia (rodapé) |

Slugs: grupos `convencionais | autocondicionantes | universais`; subcategorias `2-passos | 3-passos | 1-passo | condicionamento-seletivo | condicionamento-total | autocondicionante`. O prefixo `/sistemas-adesivos/` é intencional (próximos materiais ganham o próprio prefixo); diverge do `/[grupo]/[sub]` e `/produto/[slug]` sugeridos no DESIGN/Plano de testes — **vale esta tabela**.

## 4.1 Acesso (login)

- **Livres sem sessão** (`rotaLivre`): `/login`, `/api/login`, `/api/logout`, `/offline`, `/sw.js`, `/version.json`, `/health.json` e arquivos públicos por extensão (imagens, ícones, `manifest.webmanifest`, `robots.txt`, fontes). `_next/static` e `_next/image` ficam fora do matcher. Todo o resto → `307 /login?next=<rota>`.
- **Senha:** env `SENHA_ACESSO`; sem ela, compara com o SHA-256 embutido em `src/auth/sessao.ts` (texto puro nunca no repo nem no bundle). Comparação em tempo constante, sobre hashes. Senha errada: atraso de ~700 ms.
- **Cookie:** `v1.<HMAC(chave, msg)>`, com chave = `SEGREDO_SESSAO` → `SENHA_ACESSO` → senha validada. Sem env, o proxy confere pelo hash do token embutido. Trocar a chave ou a senha desloga todos.
- **Layouts:** o layout raiz **não** carrega dados do catálogo (renderiza `/login`, `/offline`, 404). Header, busca (índice), CompareTray e rodapé moram em `app/(protegido)/layout.tsx`. Nunca leve `catalogo()` para o layout raiz nem para `/login`.
- **localStorage `sa:sessao`:** só UX ("sessão expirou" no login). Não é fonte de verdade.
- **Service worker:** páginas só entram no cache se vierem 200 sem redirect; um redirect para `/login` apaga o cache de páginas. O logout limpa a flag local e os caches do SW (JS, `sairLocal`) e manda `Clear-Site-Data: "cache"` (sem "storage", para o SW e `/offline` continuarem instalados).
- **noindex** em tudo: metadata do layout raiz, `robots.txt` com disallow total e `X-Robots-Tag` no proxy.
- **Limite conhecido:** sem `SEGREDO_SESSAO`, o valor do cookie é fixo para a senha (logout apaga o cookie do aparelho, mas um cookie copiado continua válido até trocar a senha ou o segredo). A senha é curta e o SHA-256 dela está num repo público, o que permite ataque offline por força bruta. Para proteção real, defina `SENHA_ACESSO` (forte) e `SEGREDO_SESSAO` na Vercel.

## 5. Regras para quem escreve código

- **Preço só por `src/lib/precos.ts`.** Componente não calcula menor preço, economia nem comparabilidade. `compararPrecos()` já devolve as linhas na ordem do DESIGN §4.7 e trata "não encontrado".
- **Formatação só por `src/lib/formato.ts`** (`R$ 89,90`, `DD/MM/AAAA` sem `Date`, evitando erro de fuso).
- Server Components leem `catalogo()`; Client Components recebem **props serializáveis** (nunca importam `lib/dados`).
- `"use client"` só onde há interação (busca, comparador, seletor de estratégia, bottom sheet).
- Nomes de domínio em **português** (produto, oferta, apresentação), código idiomático em inglês só quando é API do framework.
- Erro de dado = **build quebra** (é intencional). Rodar `pnpm validar:dados` antes de commitar dados.
- Testes de E2E rodam com `DADOS_DIR=tests/fixtures/dados` para serem determinísticos.

## 6. Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` / `build` / `start` | Next |
| `pnpm lint` | ESLint (config Next) |
| `pnpm typecheck` | `next typegen && tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm validar:dados` | valida `data/` (ou `DADOS_DIR`) — sai 1 se houver erro |
| `pnpm gerar:json-schema` | regenera `data/schemas/` após mudar o esquema |
| `pnpm check` | lint + typecheck + test + validar:dados (o que o CI roda antes do build) |

## 7. Git

Regra do cliente (2026-10-06): **sem Pull Requests e sem esperar aprovação.**

- `main` sempre verde e implantável (produção na Vercel, plano Hobby, *.vercel.app). Remote: `origin` (GitHub).
- Cada agente trabalha no **seu `git worktree`**, numa branch local (`feat/…`, `fix/…`, `dados/…`, `chore/…`, `docs/…`). **Branches de trabalho não vão para o GitHub.**
- Entrega pronta → no worktree: `pnpm check && pnpm build` (precisam passar) → no diretório principal:
  ```bash
  git pull --ff-only origin main && git merge --no-edit <sua-branch>
  pnpm check && git push origin main
  ```
- Conflito: resolva você mesmo ou chame o Molar.
- **Commits pequenos e frequentes**; nada de trabalho grande sem commit (os worktrees irmãos serão apagados no fim do projeto).
- **Conventional Commits** em português: `feat(produto): seção de preços`, `dados(ambar): ofertas 2026-10-06`.
- Code review do Tech Lead acontece **depois** da integração, com correção direto no `main` — não bloqueia.

## 8. Escalar para outros materiais

1. `src/lib/esquema/<material>.ts` com `material: z.literal("<material>")`, reaproveitando `comum.ts` (Fonte, atributo, Divergencia, Imagem, Revisao) e `oferta.ts` (inalterado).
2. Registrar em `ESQUEMA_POR_MATERIAL` (`src/lib/esquema/index.ts`); `Produto` vira união discriminada por `material`.
3. `data/materiais/<material>/{produtos,ofertas}/` e rotas `app/<material>/…`. `/produto/{id}` continua global (ids únicos entre materiais).

## 9. Em aberto

- **"Produtos mais consultados"** — DECIDIDO v1: curadoria manual (`data/materiais/sistemas-adesivos/destaques.json`) com o rótulo honesto "Em destaque"; medir com Vercel Web Analytics e só então trocar para "mais consultados". Contrato: `Destaques` em `conteudo.ts`; `catalogo().destaques[material]` (ids visíveis, na ordem).
- Direitos de uso das fotos dos frascos (repo público): baixadas para `public/img/produtos/<id>/`, foto de produto para identificação, com fonte e crédito "Imagem: <fabricante>"; prefere fonte do fabricante. **Pendente validação do cliente.**
