# Arquitetura — Plataforma de Sistemas Adesivos

> Dono: Molar (Tech Lead). Fonte de verdade técnica. Produto: [`BRIEFING.md`](./BRIEFING.md) · Visual: [`DESIGN.md`](./DESIGN.md) · Deploy: [`DEPLOY.md`](./DEPLOY.md) · Testes: [`PLANO-DE-TESTES.md`](./PLANO-DE-TESTES.md).
> Mudanças em **contratos** (esquema de dados, rotas, funções de `src/lib`) passam por mim antes de implementar.

## 1. Decisões (e por quê)

| Tema | Decisão | Motivo |
|---|---|---|
| Framework | **Next.js 16.4 (App Router) + TypeScript strict**, Turbopack | Pedido do briefing; deploy nativo na Vercel. |
| Renderização | **100% estático (SSG)**: `generateStaticParams` + `dynamicParams = false` em toda rota dinâmica. Sem Server Actions, sem API routes, sem runtime. | Dados mudam por commit, não por requisição. Mais rápido, mais barato, funciona offline no PWA. |
| Cache Components | **Desligado** | Não há dado de runtime; ele exige `generateStaticParams` não vazio (quebraria build com catálogo vazio). |
| Dados | **JSON versionado em `data/`**, validado com **zod** no build, no CI e por `pnpm validar:dados`. Sem banco na v1. | Rastreabilidade (cada dado tem fonte + data; git dá histórico e revisão por PR), zero infra. Catálogo é de dezenas de produtos. |
| Preços | Arquivo separado por produto (`ofertas/`), em **centavos inteiros**. | Atualização de preço (manual ou Action agendada que abre PR) só toca esses arquivos. Nada de float. |
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
      produtos/<id>.json             # 1 arquivo por produto  ← Bula
      ofertas/<id>.json              # preços por loja/apresentação ← Bula / automação
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
4. **Protocolo é do produto.** `protocolos[]` com `aplicaA` (subcategorias), `etapas[]` (`tipo`, `titulo`, `descricao`, `parametros[]`) e fonte **oficial obrigatória** (tipo `ifu`/`ficha-tecnica`/`site-fabricante`/`embalagem`). Produto `publicado` precisa de protocolo para cada subcategoria em que aparece.
5. **Rascunho não vai para produção.** `revisao.status`: `rascunho` aparece em dev/preview (com selo), nunca quando `VERCEL_ENV=production`. Forçar: `INCLUIR_RASCUNHOS=0|1`.

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

### 3.3 Ofertas (`OfertasDoProduto`)
```
produtoId
ofertas[{
  lojaId: dental-cremer | dental-speed | dental-med-sul
  apresentacaoId           # EXATA; é a chave de comparação
  status: disponivel | indisponivel | nao-encontrado
  url?                     # obrigatória salvo nao-encontrado; domínio da loja e ≠ home (validado)
  tituloNaLoja?, skuLoja?
  precos[{ tipo: padrao | pix | boleto, centavos, condicao? }]   # disponivel exige "padrao"
  consultadoEm             # → "Última atualização: DD/MM/AAAA"
  observacao?
}]
```
- **Comparação só com o mesmo `apresentacaoId`**. A equivalência (fabricante + nome + volume + quantidade + SKU) é decidida na curadoria; anúncio que não bate com nenhuma apresentação → cadastrar nova apresentação no produto, nunca forçar.
- Comparação usa **`padrao`** (preço vigente sem condição de pagamento). Pix/boleto são informativos.
- Uma oferta por (loja, apresentação). Histórico de preço = histórico do git.

## 4. Rotas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `/` | `app/page.tsx` | Home (DESIGN §4.1) |
| `/sistemas-adesivos/{grupo}/{subcategoria}` | `app/sistemas-adesivos/[grupo]/[subcategoria]/page.tsx` | Categoria / estratégia universal (§4.2, §4.4) |
| `/produto/{id}` (+ `#precos`, `?estrategia={slug}`) | `app/produto/[id]/page.tsx` | Produto, modo de uso, preços (§4.3, §4.7) |
| `/comparar?ids=a,b,c` | `app/comparar/page.tsx` | Comparador (§4.6) — ler `ids` no cliente para manter rota estática |
| `/busca?q=` | `app/busca/page.tsx` | Resultados (§4.8) — idem, no cliente |
| `/guia`, `/guia/{tema}` | `app/guia/…` | Guia rápido (conteúdo a definir, com fonte) |
| `/metodologia` | `app/metodologia/page.tsx` | Fontes e metodologia (rodapé) |

Slugs: grupos `convencionais | autocondicionantes | universais`; subcategorias `2-passos | 3-passos | 1-passo | condicionamento-seletivo | condicionamento-total | autocondicionante`. O prefixo `/sistemas-adesivos/` é intencional (próximos materiais ganham o próprio prefixo); diverge do `/[grupo]/[sub]` e `/produto/[slug]` sugeridos no DESIGN/Plano de testes — **vale esta tabela**.

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

- `main` sempre verde e implantável (produção na Vercel). Trabalho em branches curtas: `feat/…`, `fix/…`, `dados/…`, `chore/…`, `docs/…`; merge após `pnpm check` + review do Tech Lead.
- **Conventional Commits** em português: `feat(produto): seção de preços`, `dados(ambar): ofertas 2026-10-06`.
- Agentes trabalhando em paralelo no mesmo clone: cada um em **`git worktree`** próprio, para não trocar a branch do outro.

## 8. Escalar para outros materiais

1. `src/lib/esquema/<material>.ts` com `material: z.literal("<material>")`, reaproveitando `comum.ts` (Fonte, atributo, Divergencia, Imagem, Revisao) e `oferta.ts` (inalterado).
2. Registrar em `ESQUEMA_POR_MATERIAL` (`src/lib/esquema/index.ts`); `Produto` vira união discriminada por `material`.
3. `data/materiais/<material>/{produtos,ofertas}/` e rotas `app/<material>/…`. `/produto/{id}` continua global (ids únicos entre materiais).

## 9. Em aberto

- **"Produtos mais consultados"**: não há dado de acesso num site estático. Proposta v1: curadoria manual (`data/materiais/sistemas-adesivos/destaques.json`) com o rótulo honesto "Em destaque"; medir com Vercel Web Analytics e só então trocar para "mais consultados". Decisão do produto.
- Domínios oficiais das lojas em `lojas.ts` — confirmar (Bula).
- Formato do Guia rápido (Markdown com frontmatter de fontes, provavelmente).
- Direitos de uso das fotos dos frascos.
