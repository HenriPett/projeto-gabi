# Plano de Testes — Plataforma de Sistemas Adesivos (v1)

> Autor: Sonda (QA). Fontes: `docs/BRIEFING.md` (produto, **§n** = item do prompt do cliente) e `docs/ARQUITETURA.md` (contratos e rotas — **vale sobre este plano em caso de conflito**).
> Status (06/10/2026): scaffold `c0f3ca9`. Fixtures de borda e cenários unitários em `tests/unit/cenarios-fixtures.test.ts` prontos; E2E Playwright aguardando as telas (Pulpa) e os `data-testid` (seção 9). Bugs encontrados: seção 12.

---

## 0. Estratégia

| Camada | Ferramenta | O que cobre |
|---|---|---|
| **Validação de dados** (unit) | Vitest + schema (zod ou equivalente) | Regras inegociáveis do briefing aplicadas a **todo** registro de produto/preço/fonte. Roda no CI e bloqueia merge. |
| **Lógica pura** (unit) | Vitest | `compararPrecos()`, `calcularEconomia()`, `saoComparaveis()`, `normalizarBusca()`, formatação BRL e data. |
| **E2E** | Playwright | Fluxos do §22, regras de preço na UI, busca, comparação, universais, navegação, PWA/offline. |
| **Acessibilidade** | `@axe-core/playwright` | Todas as rotas principais, desktop e mobile. |
| **PWA** | Playwright + Lighthouse CI | Manifest, service worker, instalabilidade, offline. |

**Projetos Playwright:** `desktop-chromium` (1280×800), `mobile-chrome` (Pixel 7), `mobile-safari` (iPhone 13, WebKit), `small` (320×568). Os fluxos críticos rodam nos quatro.

**Ambiente:** `next build && next start` (nunca só `next dev` — o service worker e o cache só se comportam como em produção no build). Opcionalmente, rodar também contra o Preview Deploy da Vercel.

### 0.1 Pré-requisitos

| # | Pré-requisito | Status |
|---|---|---|
| 1 | Dados injetáveis: `DADOS_DIR=tests/fixtures/dados` (+ `INCLUIR_RASCUNHOS=0` para simular produção) | ✅ Molar |
| 2 | Lógica de preço pura: `src/lib/precos.ts` (`compararPrecos`, `apresentacaoParaComparar`, `maioresEconomias`) | ✅ Molar |
| 3 | Preços em centavos inteiros (`z.number().int().positive()`) | ✅ Molar |
| 4 | Formatação sem `Date` (`formatarData`, `formatarBRL` em `src/lib/formato.ts`) | ✅ Molar |
| 5 | `data-testid` estáveis (seção 9) | ⏳ combinar com Pulpa |
| 6 | Playwright + `@axe-core/playwright` nas devDependencies | ⏳ Sonda (PR próprio) |

### 0.2 Rotas reais (ARQUITETURA §4)

| Rota | Observação para teste |
|---|---|
| `/` | Home |
| `/sistemas-adesivos/{grupo}/{subcategoria}` | grupos `convencionais \| autocondicionantes \| universais`; subs `2-passos \| 3-passos \| 1-passo \| condicionamento-seletivo \| condicionamento-total \| autocondicionante`. **7 combinações válidas**; `/sistemas-adesivos/convencionais/1-passo` e `/sistemas-adesivos/universais/2-passos` são **404** (`dynamicParams = false`). |
| `/produto/{id}` (+ `#precos`, `?estrategia={slug}`) | `id` = slug kebab-case ASCII. Id inexistente → 404. `?estrategia=` inválida → cai no protocolo padrão sem erro. |
| `/comparar?ids=a,b,c` | `ids` lido no cliente (rota estática): testar ids inválidos, repetidos, vazios. |
| `/busca?q=` | `q` lido no cliente: testar `%26` (`&`), `%E0` malformado, vazio. |
| `/guia`, `/guia/{tema}` | Conteúdo a definir. |
| `/metodologia` | Fontes e metodologia (rodapé). |

Todas as rotas são **SSG**: testes rodam contra `next build && next start` com `DADOS_DIR=tests/fixtures/dados INCLUIR_RASCUNHOS=0`.

### 0.3 Severidade

| Nível | Definição | Exemplos |
|---|---|---|
| **S1 – Crítico** | Viola regra inegociável, informação científica/financeira errada, ou bloqueia fluxo do §22 | Preço inventado, comparação entre 3 mL × 5 mL, link para home da loja, protocolo de outro produto |
| **S2 – Alto** | Funcionalidade principal quebrada com contorno | Busca não acha "Prime&Bond", universal aparece como 3 produtos |
| **S3 – Médio** | Problema visível sem perda de informação | Layout quebrado em 320px, foco invisível |
| **S4 – Baixo** | Cosmético | Espaçamento, ícone desalinhado |

Formato de bug (obrigatório): **passos exatos · esperado · obtido · severidade · ambiente/projeto Playwright · evidência (trace/screenshot)**. UI → Pulpa (Frontend); API/dados → Backend/Molar; dado científico/fonte → Bula.

---

## 1. Critérios de aceite por funcionalidade

### 1.1 Home (§1, §21)
- **H-01** Título "SISTEMAS ADESIVOS" visível como `h1`.
- **H-02** Três grupos na ordem: Convencionais, Autocondicionantes, Universais.
- **H-03** Subcategorias exatas: Convencionais [2 passos][3 passos]; Autocondicionantes [1 passo][2 passos]; Universais [Cond. seletivo][Cond. total][Autocondicionante]. Total = **7** botões, cada um é link/botão real (não `div` com onClick).
- **H-04** Cada subcategoria leva à página correta (7 asserts de URL + `h1`).
- **H-05** Barra de pesquisa presente e com placeholder "Pesquisar sistema, marca ou produto".
- **H-06** "Produtos mais consultados" exibe cards; com zero dados, a seção some ou mostra estado vazio — nunca quebra.
- **H-07** "Melhores preços" lista apenas produtos com **≥2 preços comparáveis** (mesma apresentação) e ordena pela maior diferença. Produto com 1 preço ou apresentações diferentes **não** entra.
- **H-08** Guia rápido com os 7 temas do §21, cada um abrindo conteúdo com fonte.

### 1.2 Página de categoria (§2, §3, §9, §10, §19)
- **C-01** Representação gráfica no topo condizente com a categoria (tabela abaixo). Verificar **texto acessível** da sequência, não só imagem.

| Categoria | Sequência esperada |
|---|---|
| Convencional 2 passos | Ácido → Primer + Adesivo |
| Convencional 3 passos | Ácido → Primer → Adesivo |
| Autocond. 1 passo | Ácido + Primer + Adesivo (um único produto) |
| Autocond. 2 passos | Primer autocondicionante → Adesivo |
| Universal seletivo / total | Ácido → Adesivo universal |
| Universal autocondicionante | Adesivo universal (sem ácido separado) |

- **C-02** Explicação curta abaixo do diagrama, seguida de "PRODUTOS DISPONÍVEIS".
- **C-03** Bloco "Como identificar?" (§19) presente em todas as 7 categorias.
- **C-04** Somente produtos daquela categoria aparecem (fixture com produto de outra categoria não pode vazar).
- **C-05** Categoria sem produtos → estado vazio explícito ("Nenhum produto cadastrado nesta categoria ainda"), não lista em branco.
- **C-06** URL de categoria inexistente (`/sistemas-adesivos/convencionais/7-passos`, `/sistemas-adesivos/convencionais/1-passo`, `/sistemas-adesivos/universais/2-passos`) → 404 amigável com link para home.

### 1.3 Card de produto (§4)
- **P-01** Card contém: imagem do frasco, nome comercial, fabricante, apresentação, volume, categoria, estratégia, principais componentes, **VER PRODUTO**, **COMPARAR PREÇOS**.
- **P-02** Imagem com `alt` = "Frasco de {nome} — {fabricante}". Falha de carregamento → placeholder, sem ícone quebrado nem layout pulando.
- **P-03** Nome muito longo (fixture com 80 caracteres) não estoura o card nem empurra botões para fora.
- **P-04** Componentes ausentes → "Informação ainda não verificada" (texto único de ausência, decisão do Molar em `308375f`), nunca vazio nem inventado.

### 1.4 Página do produto (§5, §20)
- **D-01** Nome + fabricante, imagem grande, Classificação, Estratégia, Apresentação, Composição, Indicações.
- **D-02** **Cada bloco de informação exibe sua fonte** (URL + data de acesso) — classificação, composição, indicações, modo de uso, preço.
- **D-03** Divergência entre fontes → aviso visível ("Fontes divergem: …") mostrando as duas versões. Nunca escolher uma silenciosamente.
- **D-04** Composição lista apenas componentes confirmados; campo desconhecido = "Não informado", não "Não contém".
- **D-05** Id inexistente → 404. `/produto/Ficticio-Ambar` (maiúsculas) e `/produto/ficticio-ambar/` (barra final) → comportamento consistente (404 ou redirect), nunca 500.
- **D-06** Acesso direto pela URL (deep link, sem passar pela home) renderiza tudo.

### 1.5 Modo de uso (§6)
- **M-01** Etapas numeradas `01, 02, …` em ordem, com a sequência do IFU daquele produto.
- **M-02** Tempos/camadas/fricção exibidos exatamente como na fixture (sem arredondar "20 s" para "20-30 s").
- **M-03** Fonte = IFU oficial (URL do fabricante) + data.
- **M-04 (regra fundamental)** Teste de dados: para cada par de produtos da mesma categoria, **protocolos idênticos geram alerta** no CI para revisão humana (Bula). Protocolo sem `fonte.tipo = "IFU"` → **falha**.
- **M-05** Produto universal mostra protocolo **por estratégia** (seletivo/total/autocond.) quando o IFU diferenciar.
- **M-06** Produto sem IFU disponível → "Protocolo oficial não localizado" — nunca protocolo genérico da categoria.

### 1.6 Universais (§7, §8)
- **U-01** Cada estratégia lista só produtos com indicação oficial para ela.
- **U-02** Produto indicado para as 3 estratégias aparece nas 3 páginas **com o mesmo slug/URL** de produto.
- **U-03** Indicador visual "☑ seletivo ☑ total ☑ autocondicionante" no card e na página do produto, com texto explícito de que são **estratégias do mesmo adesivo**.
- **U-04** Produto indicado só para 2 estratégias: não aparece na 3ª e o indicador mostra a 3ª como não indicada.
- **U-05** Na busca, "Mais consultados" e "Melhores preços", o universal aparece **uma única vez** (não 3).
- **U-06** No comparador, adicionar o mesmo universal a partir de duas páginas de estratégia diferentes → **um** item só.
- **U-07** Contagem de produtos em "Universais" (se houver) não soma o mesmo produto 3×.

### 1.7 Comparação entre sistemas (§11)
- **CS-01** Selecionar 2 e 3 produtos (ex.: Adper Single Bond 2 × Ambar × Prime&Bond 2.1) → tabela com as 13 linhas: Classificação, Estratégia, Nº de passos, Condicionamento, Primer, Adesivo, MDP, HEMA, Silano, Solvente, Fotopolimerização, Volume, Fabricante.
- **CS-02** MDP/HEMA/Silano: três estados distintos — **Sim**, **Não** (confirmado pelo fabricante), **Não informado**. Ausência de dado ≠ "Não".
- **CS-03** Com 1 produto selecionado → botão comparar desabilitado com dica. Limite máximo definido (sugestão 4) → ao exceder, mensagem clara.
- **CS-04** Selecionar o mesmo produto duas vezes não duplica coluna.
- **CS-05** Remover produto da comparação atualiza a tabela.
- **CS-06** Seleção persiste na URL (`/comparar?ids=a,b,c`): recarregar, compartilhar link e voltar do navegador mantêm a comparação. IDs inválidos na URL são ignorados com aviso, sem crash.
- **CS-07** Mobile: tabela legível (scroll horizontal **dentro** da tabela com 1ª coluna fixa, ou layout em cards) — sem scroll horizontal da página.

### 1.8 Comparação de preços (§12–§16) — prioridade máxima
Ver casos detalhados na seção 3.
- **PR-A** Lista as 3 lojas (Dental Cremer, Dental Speed, Dental Med Sul) **sempre**, mesmo sem preço.
- **PR-B** 🏆 MENOR PREÇO destacado com **texto**, não só cor/emoji.
- **PR-C** "Você economiza R$ X,XX em relação ao maior preço encontrado."
- **PR-D** Cada preço com "Última atualização: DD/MM/AAAA".
- **PR-E** Botão "COMPRAR NA {LOJA}" leva à página **do produto** na loja.
- **PR-F** Apresentações diferentes → "Apresentações diferentes — comparação de preço não disponível."
- **PR-G** Sem preço → "Não encontrado / indisponível".

### 1.9 Pesquisa (§17)
Ver seção 4. Barra **fixa** (sticky) em todas as páginas; resultados agrupados ou com tipo (produto, fabricante, categoria, componente).

### 1.10 Visual (§18)
- **V-01** Paleta roxo/magenta, lilás, branco, cinza claro, texto preto — e **contraste AA** (ver seção 7).
- **V-02** Regressão visual com `toHaveScreenshot()` na home e numa página de produto (desktop + mobile), após o design estabilizar.

---

## 2. Fluxos E2E críticos (§22)

Os dois fluxos rodam nos 4 projetos Playwright, com fixtures determinísticas, e são **gate de merge**.

### E2E-01 — Convencional 2 passos até a compra
1. Abrir `/`.
2. Clicar em **Convencionais → 2 passos**. ✔ URL da categoria; `h1` contém "2 passos"; diagrama "Ácido → Primer + Adesivo"; ≥1 card.
3. No card do produto-fixture `ficticio-ambar` (Âmbar Fictício / Fabricante Alfa), clicar **VER PRODUTO**. ✔ URL `/produto/ficticio-ambar`; imagem grande visível e carregada (`naturalWidth > 0`); classificação "Convencional — 2 passos".
4. Rolar até **Modo de uso**. ✔ etapas numeradas em ordem; fonte IFU visível.
5. Clicar **COMPARAR PREÇOS**. ✔ 3 lojas listadas; datas DD/MM/AAAA; menor preço destacado; texto de economia com valor correto da fixture.
6. Clicar **COMPRAR NA DENTAL CREMER**. ✔ abre nova aba (`context.waitForEvent('page')`) com URL **exatamente** igual à `url_produto` da fixture; `pathname !== "/"`; link tem `rel="noopener noreferrer"`. (Não navegar de fato para a loja no CI — interceptar com `page.route` e retornar 200.)
7. Voltar à aba original. ✔ estado preservado.
8. **Variação:** repetir usando somente teclado (Tab/Enter) — ver A11Y-03.
9. **Variação:** botão Voltar do navegador em cada passo retorna à tela anterior com scroll restaurado.

### E2E-02 — Universal seletivo → comparar produtos → comparar preços
1. Abrir `/`.
2. **Universais → Condicionamento seletivo**. ✔ diagrama "Ácido → Adesivo universal"; somente produtos indicados para seletivo (fixture inclui um universal sem indicação para seletivo, que **não** pode aparecer).
3. ✔ Card do universal multi-estratégia mostra ☑☑☑ e o aviso "mesmo adesivo".
4. Selecionar 2–3 produtos para **comparar**. ✔ contador de selecionados; botão habilita a partir de 2.
5. Abrir **Comparar**. ✔ tabela com 13 linhas; valores batem com a fixture; "Não informado" onde aplicável.
6. A partir da tabela (ou do produto), abrir **Comparar preços** de um deles. ✔ mesmas asserções do E2E-01 passo 5.
7. ✔ Recarregar `/comparar?ids=…` mantém seleção.
8. **Variação:** iniciar o fluxo por **Condicionamento total** e adicionar o mesmo universal → não duplica (U-06).

---

## 3. Regras de preço — casos de borda

Fixtures dedicadas em `tests/fixtures/precos/`. Cada caso = 1 teste unitário da função pura **+** 1 assert e2e na UI.

| ID | Cenário (fixture) | Esperado | Sev. se falhar |
|---|---|---|---|
| PR-01 | 3 lojas, mesmo SKU/apresentação, preços distintos | 🏆 no menor; economia = maior − menor | S1 |
| PR-02 | Single Bond Universal **3 mL** numa loja e **5 mL** em outra | "Apresentações diferentes — comparação de preço não disponível."; **sem** 🏆 e **sem** economia entre elas | S1 |
| PR-03 | Mesmo volume, **quantidade** diferente (1 frasco × kit 2 frascos) | Não comparável (mesma mensagem) | S1 |
| PR-04 | Mesmo nome, **fabricante** diferente (homônimo) | Não comparável | S1 |
| PR-05 | Mesmo produto, apresentação "refil" × "kit completo" mesmo volume | Não comparável | S1 |
| PR-06 | 2 lojas iguais + 1 loja com apresentação diferente | Compara só as 2 comparáveis; a 3ª exibe preço com aviso "apresentação diferente" e fica fora do 🏆/economia | S1 |
| PR-07 | 1 loja sem preço | "Não encontrado / indisponível" nessa loja; as outras 2 continuam comparadas normalmente | S1 |
| PR-08 | 2 lojas sem preço | Mostra o único preço; **sem** 🏆 (não há com quem comparar) e **sem** frase de economia (ou "economia: não aplicável") | S1 |
| PR-09 | 3 lojas sem preço | 3× "Não encontrado / indisponível"; nenhum valor, nenhum R$ 0,00 | S1 |
| PR-10 | **Empate** no menor preço (2 lojas) | Ambas marcadas como menor preço (ou regra explícita documentada) — nunca escolha arbitrária silenciosa | S2 |
| PR-11 | 3 preços iguais | Sem frase "Você economiza R$ 0,00"; mensagem "mesmo preço nas lojas" | S2 |
| PR-12 | Preço `0`, negativo ou `null` na fonte | Tratado como indisponível; nunca exibido como R$ 0,00 | S1 |
| PR-13 | Produto **esgotado** com preço listado | Exibe "indisponível/esgotado"; não entra no 🏆 (confirmar regra com PM) | S2 |
| PR-14 | Precisão: 89,90 × 120,35 × 104,10 | Economia exatamente **R$ 30,45** (sem 30,449999) | S1 |
| PR-15 | Formatação pt-BR: 1234,5 | "R$ 1.234,50" (separador de milhar ponto, decimal vírgula, 2 casas) | S2 |
| PR-16 | Data `2026-10-06T23:30:00-03:00` | "06/10/2026" — **não** 07/10 por conversão UTC (rodar teste com `TZ=UTC` e `timezoneId: 'America/Sao_Paulo'`) | S1 |
| PR-17 | Preço sem data de atualização | Falha na validação de dados (CI); na UI nunca mostrar preço sem data | S1 |
| PR-18 | Datas diferentes entre lojas | Cada preço com sua própria data | S2 |
| PR-19 | Preço muito antigo (ex.: > 30 dias) | Aviso "preço pode estar desatualizado" (confirmar limiar com PM) | S3 |
| PR-20 | Promoção / preço "de/por" | Usa o preço efetivo "por"; registro deixa claro | S2 |
| PR-21 | Link de compra = home (`https://www.dentalcremer.com.br/`) | **Falha de validação** no CI; na UI, botão substituído por "Link do produto indisponível" | S1 |
| PR-22 | Link de compra = página de busca/categoria da loja | Falha de validação (path deve ser de produto — regra por domínio) | S1 |
| PR-23 | Link aponta para domínio de **outra** loja | Falha de validação | S1 |
| PR-24 | Link `http://` ou com espaço/caractere inválido | Falha de validação | S2 |
| PR-25 | Loja sem preço | Botão COMPRAR **não** aparece (ou desabilitado) para essa loja | S2 |
| PR-26 | Duplo clique em COMPRAR | Abre no máximo 1 aba | S3 |
| PR-27 | "Melhores preços" na home | Diferença calculada **apenas** entre preços comparáveis; produto do PR-02 não aparece | S1 |
| PR-28 | Preço exibido no card × na página do produto × em "Melhores preços" | Mesmo valor e mesma data nos três lugares | S2 |
| PR-29 | Offline (PWA) | Preço exibido do cache com data original + aviso "você está offline; preços podem ter mudado" | S2 |

**Validação de dados automática (bloqueia CI)** — `pnpm validar:dados` (zod em `src/lib/esquema/oferta.ts`). Hoje cobre: loja ∈ 3 lojas; `url` obrigatória salvo `nao-encontrado`, do domínio da loja e ≠ home; `centavos` inteiro > 0 (cobre PR-12); `disponivel` exige preço `padrao`; não-disponível sem preço; `consultadoEm` obrigatório (PR-17); `apresentacaoId` existente no produto; sem oferta duplicada por (loja, apresentação). **Lacunas** (seção 12): http aceito (PR-24), página de busca/`index.html` aceitas (PR-21/22), data futura aceita.

**Comportamento definido pelo contrato** (`src/lib/precos.ts`, confirmado em `tests/unit/cenarios-fixtures.test.ts`):
- Comparabilidade = mesmo `apresentacaoId` (curadoria decide a equivalência). Comparação usa o preço `padrao`; Pix/boleto são informativos (PR-20).
- Sempre 3 linhas; loja sem registro = `nao-encontrado`. Ordem: com preço do menor ao maior, depois sem preço em ordem alfabética.
- **Empate (PR-10): todas as lojas empatadas no menor preço recebem `menorPreco`.** Preços todos iguais (PR-11): **nenhuma** linha com `menorPreco` e `economiaCentavos` indefinida → UI mostra "Mesmo preço nas lojas comparadas" (`7f71335`).
- `comparavel` só com ≥ 2 preços; com 1 preço não há 🏆 nem economia (PR-08).
- `indisponivel` mantém `url` (a página existe) → UI decide se mostra "Ver na loja"; `nao-encontrado` nunca tem `url` (PR-25).

### 3.1 Fixtures de preço (`tests/fixtures/dados`, todas fictícias)

| Produto (id) | Categoria | Cenário | Esperado |
|---|---|---|---|
| `ficticio-ambar` | Conv. 2 passos | 3 preços 89,90 / 120,35 / 104,10, datas 06/10, 05/10, 30/09 | 🏆 Dental Cremer; economia **R$ 30,45**; cada data na sua loja (PR-01/14/16/18). Fluxo E2E-01. |
| `ficticio-single-bond-2` | Conv. 2 passos (fabricante "3M Fictícia") | Empate 99,90 × 99,90 × 119,90 | 🏆 em Cremer **e** Speed; economia R$ 20,00 (PR-10) |
| `ficticio-prime-bond-2-1` | Conv. 2 passos | Só Cremer com preço; Speed não encontrado; Med Sul indisponível | Sem 🏆, sem economia; 3 linhas (PR-07/08) |
| `ficticio-multiuso-3p` | Conv. 3 passos (nome com 85 caracteres) | Nenhum preço | 3× sem valor, nunca R$ 0,00 (PR-09, P-03) |
| `ficticio-tudo-em-um` | Autocond. 1 passo (Kuraray Fictícia, 10-MDP) | 3 preços iguais 50,00 | Sem frase de economia (PR-11) |
| `ficticio-dois-frascos` | Autocond. 2 passos | Kit em Cremer/Med Sul; **refil** só na Speed | Kit compara Cremer × Med Sul (R$ 30,00); refil isolado (PR-06) |
| `ficticio-universal-triplo` | Universal nas **3** estratégias | 3 mL na Cremer × 5 mL na Speed; Med Sul 5 mL indisponível | Nenhuma comparação (PR-02); 1 produto em 3 páginas (U-02) |
| `exemplo-universal` (Molar) | Universal total + autocond. (**não** seletivo) | 159,90 × 149,90 (5 mL) + 3 mL só Med Sul | Não aparece em seletivo (U-04); divergência HEMA (D-03) |
| `ficticio-rascunho` | Conv. 2 passos, **rascunho** | Economia artificial de R$ 450,00 | Nunca aparece com `INCLUIR_RASCUNHOS=0` — nem em listas nem em Melhores preços (BUG-005) |

## 4. Pesquisa — casos de borda

Normalização esperada: minúsculas + remoção de diacríticos (NFD) + `&`/hífen/pontuação tratados de forma tolerante. Busca em: nome comercial, fabricante, categoria/estratégia, componentes.

| ID | Consulta | Esperado |
|---|---|---|
| B-01 | `Ambar`, `ambar`, `AMBAR`, `Âmbar` | Encontra Ambar (FGM) nos 4 casos |
| B-02 | `Single Bond` | Adper Single Bond 2 **e** Single Bond Universal |
| B-03 | `Prime&Bond` | Encontra Prime&Bond (ex.: 2.1 / active / universal conforme cadastro) |
| B-04 | `prime & bond`, `prime and bond`, `primebond`, `prime bond` | Mesmo resultado do B-03 |
| B-05 | `Prime&Bond` via URL | `/busca?q=Prime%26Bond` funciona; `&` **não** pode quebrar a query string (`?q=Prime&Bond` truncando para "Prime" = bug S2) |
| B-06 | `MDP`, `mdp`, `10-MDP`, `10 MDP` | Produtos cuja composição confirmada contém MDP; produto com MDP "não informado" **não** aparece |
| B-07 | `2 passos` | Convencionais 2 passos **e** Autocondicionantes 2 passos (e/ou as duas categorias como resultado) |
| B-08 | `2passos`, `dois passos`, `2 PASSOS` | Mesmo resultado do B-07 (no mínimo `2passos` e caixa alta) |
| B-09 | `1 passo` × `1 passos` | Autocondicionante 1 passo |
| B-10 | `Universal`, `universais` | Categoria Universais + produtos universais (cada produto **1 vez**) |
| B-11 | `autocondicionante`, `auto-condicionante`, `auto condicionante`, `autocondicionantes` | Mesmo resultado |
| B-12 | `condicionamento seletivo`, `seletivo` | Estratégia seletivo |
| B-13 | `Kuraray`, `kuraray noritake` | Produtos do fabricante |
| B-14 | `3M`, `3m` | Produtos 3M (termo curto com dígito) |
| B-15 | Vazio / só espaços | Não dispara busca; não mostra "0 resultados" agressivo |
| B-16 | 1 caractere (`a`) | Comportamento definido (mínimo de caracteres ou sugestões) sem travar |
| B-17 | Sem resultado (`xyzabc`) | "Nenhum resultado para 'xyzabc'" + sugestões (categorias) |
| B-18 | 1.000 caracteres | Sem crash, sem travar a UI (> 200 ms por tecla = bug S3) |
| B-19 | `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>` | Renderizado como texto; nenhum `dialog` dispara |
| B-20 | Metacaracteres de regex: `(`, `*`, `+`, `[`, `\`, `.*` | Sem exceção no console; trata como literal |
| B-21 | `%`, `%%`, `%E0` (URI malformado) na URL | Sem 500; página de busca renderiza |
| B-22 | Emoji / unicode (`🦷`, `ç`, `ã`, `ﬁ`) | Sem crash; `ç`/`ã` normalizados |
| B-23 | Digitação rápida | Debounce; resultado final corresponde ao último termo (sem resposta antiga sobrescrevendo a nova) |
| B-24 | Voltar do navegador após abrir resultado | Retorna à busca com termo e resultados preservados |
| B-25 | Barra fixa | Visível após rolar em todas as páginas; não cobre títulos/âncoras; no mobile com teclado aberto continua utilizável |
| B-26 | Teclado | `/` ou foco direto; setas navegam sugestões; Enter abre; Esc fecha; resultados anunciados via `aria-live` |

---

## 5. Universais em várias estratégias — casos de borda
Além de U-01…U-07:
- **UE-01** Produto com estratégia "total" no IFU mas "seletivo" não mencionado → não aparece em seletivo (indicação oficial apenas).
- **UE-02** Divergência entre fontes sobre estratégia indicada → produto aparece com selo de divergência, não decidido silenciosamente.
- **UE-03** Protocolo exibido ao entrar pela página "Autocondicionante" deve abrir a aba/seção do protocolo autocondicionante (se o IFU diferenciar), não o de condicionamento total.
- **UE-04** Preço do universal é o mesmo nas 3 páginas de estratégia (é o mesmo produto).
- **UE-05** Teste de dados: estratégias de um produto universal ⊂ {seletivo, total, autocondicionante} e ≥1; produto não-universal não tem estratégias de universal.

---

## 6. PWA — instalável e offline

| ID | Caso | Como testar |
|---|---|---|
| PWA-01 | `manifest.webmanifest` válido: `name`, `short_name`, `lang: "pt-BR"`, `start_url`, `scope`, `display: "standalone"`, `theme_color` (roxo), `background_color`, ícones 192 e 512 + 1 `maskable` | Request + parse JSON; cada ícone retorna 200 com dimensão correta |
| PWA-02 | `<link rel="manifest">`, `<meta name="theme-color">`, `apple-touch-icon` (iOS não usa manifest para ícone) | DOM |
| PWA-03 | Service worker registrado e `activated` em escopo `/` | `navigator.serviceWorker.ready` |
| PWA-04 | Critérios de instalabilidade | Lighthouse CI (categoria PWA/installable) no build de produção |
| PWA-05 | Offline após 1ª visita: home, uma categoria e um produto já visitados abrem com `context.setOffline(true)` | Playwright |
| PWA-06 | Offline em página **nunca** visitada → página offline amigável em pt-BR (não o dinossauro do Chrome) | Playwright |
| PWA-07 | Offline: imagens dos frascos já vistas aparecem; não vistas → placeholder | Playwright |
| PWA-08 | Offline: preços com data original + aviso de offline (PR-29); botão COMPRAR avisa que precisa de conexão | Playwright |
| PWA-09 | Offline: busca funciona sobre o catálogo em cache (se o índice for local) ou mostra mensagem clara | Playwright |
| PWA-10 | Voltar online → aviso some, dados revalidam | Playwright |
| PWA-11 | **Atualização de versão**: novo deploy → usuário recebe conteúdo novo (sem ficar preso no cache antigo para sempre); `sw.js` servido com `Cache-Control: no-cache` na Vercel | Dois builds sequenciais; checar header |
| PWA-12 | Modo standalone (`display-mode: standalone`): navegação interna funciona sem barra do navegador (botão voltar próprio onde necessário) | Emular media query |
| PWA-13 | Rede lenta (Slow 3G via CDP) → skeletons, sem layout shift grande (CLS < 0.1) | Playwright + CDP |

---

## 7. Acessibilidade (meta: WCAG 2.1 AA)

- **A11Y-01** axe-core sem violações `serious`/`critical` em: home, 7 categorias, produto, comparar, comparar preços, busca, guia, 404, página offline — em desktop e mobile.
- **A11Y-02** `<html lang="pt-BR">`; um único `h1` por página; hierarquia de headings sem saltos.
- **A11Y-03** Fluxo E2E-01 completo **só com teclado**; foco visível em todos os elementos; ordem lógica; nenhuma armadilha de foco (modais devolvem foco ao fechar; Esc fecha).
- **A11Y-04** Contraste: texto sobre lilás/magenta ≥ 4.5:1 (texto normal) / 3:1 (grande e componentes). Atenção a texto branco sobre lilás claro.
- **A11Y-05** 🏆 menor preço, ☑ estratégias, "Sim/Não/Não informado" não dependem só de cor ou emoji — texto ou `aria-label` explícito.
- **A11Y-06** Diagramas (Ácido → Primer → Adesivo) têm equivalente textual lido por leitor de tela.
- **A11Y-07** Imagens dos frascos com `alt` descritivo; imagens decorativas com `alt=""`.
- **A11Y-08** Tabela de comparação com `<th scope>` correto; leitor de tela anuncia produto + atributo.
- **A11Y-09** Links "COMPRAR" com nome acessível único ("Comprar Ambar na Dental Cremer — abre em nova aba").
- **A11Y-10** Zoom 200% e texto ampliado sem perda de conteúdo; `prefers-reduced-motion` respeitado.
- **A11Y-11** Resultados de busca e mudanças da comparação anunciados via `aria-live="polite"`.
- **A11Y-12** Alvos de toque ≥ 44×44 px (botões de subcategoria, COMPRAR, checkboxes de comparar).

---

## 8. Mobile e casos gerais de borda

### Mobile
- **MOB-01** Sem scroll horizontal da página em 320, 360, 390 e 430 px (`document.documentElement.scrollWidth <= innerWidth`).
- **MOB-02** Barra de busca fixa não cobre conteúdo nem conflita com o teclado virtual / notch (`safe-area-inset`).
- **MOB-03** Cards empilham corretamente; botões VER PRODUTO / COMPARAR PREÇOS acessíveis com o polegar.
- **MOB-04** Tabela de comparação usável (CS-07).
- **MOB-05** Orientação paisagem não quebra layout.
- **MOB-06** WebKit (iPhone): datas, `Intl.NumberFormat` BRL e `target=_blank` funcionam.

### Navegação, sessão e concorrência
- **G-01** Botão Voltar/Avançar em todos os fluxos mantém estado (filtros, seleção de comparação, termo de busca, scroll).
- **G-02** Refresh em qualquer página (deep link) funciona — sem 404 de rota client-only na Vercel.
- **G-03** Duplo clique em: subcategoria, VER PRODUTO, adicionar à comparação (não adiciona 2×), COMPRAR (PR-26).
- **G-04** Duas abas: adicionar à comparação em uma aba e verificar comportamento na outra (definido e sem corrupção de `localStorage`).
- **G-05** `localStorage` indisponível (modo privado / bloqueado) → app funciona, comparação via URL.
- **G-06** JavaScript desabilitado → conteúdo principal (classificação, produto, preços) renderizado pelo servidor.
- **G-07** Imagem do frasco 404 / lenta → placeholder; sem CLS.
- **G-08** Console sem erros (`page.on('console')` + `pageerror`) em todos os testes e2e — erro de console = falha.
- **G-09** Metadados por página (title, description, Open Graph) em pt-BR com nome do produto.
- **G-10** 404 e 500 personalizados em pt-BR.

### Integridade científica (dados — gate de CI)
- **SCI-01** Todo campo científico (classificação, composição, indicação, protocolo) tem `fonte.url` + `fonte.acessadoEm`.
- **SCI-02** Protocolo com `fonte.tipo = "IFU"` do fabricante; nenhum protocolo compartilhado por referência entre produtos (M-04).
- **SCI-03** Campo com divergência registrada → UI mostra aviso (D-03).
- **SCI-04** Nenhum texto/tempo copiado da imagem de referência sem fonte (revisão manual com Bula na entrada de dados).
- **SCI-05** Categoria do produto ∈ às 7 subcategorias; nº de passos coerente com a categoria (ex.: "Convencional 3 passos" com 2 etapas de aplicação → alerta).

### Escalabilidade (§22)
- **ESC-01** Adicionar uma fixture de "outro material" (ex.: `tipo: "resina"`) não quebra a home nem aparece nas listas de sistemas adesivos.

---

## 9. `data-testid` (proposta para Pulpa — nomes alinhados aos componentes do DESIGN §3)

Regra geral: preferir **papel + nome acessível** (`getByRole('link', { name: /Comprar .* Dental Cremer/ })`); `data-testid` só onde o texto muda ou é ambíguo. Atributos `data-*` extras carregam o estado que o teste precisa conferir sem depender de cor/emoji.

| Componente / área | `data-testid` | Atributos extras |
|---|---|---|
| `<SearchBar>` | `search-input`, `search-results`, `search-result-item` | `data-produto-id` no item |
| Home — grupos/subcategorias | `group-{convencionais\|autocondicionantes\|universais}`, `subcategory-link` | `data-subcategoria="{id da taxonomia}"` |
| Home — melhores preços | `best-prices`, `best-prices-item` | `data-produto-id`, `data-economia-centavos` |
| `<StepDiagram>` | `step-diagram` | `data-sequencia="acido,primer+adesivo"` (de `SUBCATEGORIA.sequencia`) |
| `<ProductCard>` | `product-card`, `btn-ver-produto`, `btn-comparar-precos`, `compare-toggle` | `data-produto-id` |
| `<ClassBadge>` / estratégias | `strategy-badges` | `data-estrategias="universal-condicionamento-seletivo,…"` |
| `<SourceLink>` | `source-link` | `data-fonte-tipo="ifu\|ficha-tecnica\|…"` |
| `<DivergenceNote>` | `divergence-note` | `data-campo="composicao.hema"` |
| `<StrategySelector>` | `strategy-selector` | estado via `aria-pressed`/`aria-selected` |
| Modo de uso | `protocol`, `protocol-step` | `data-protocolo-id`, `data-step="01"` |
| `<CompareTray>` | `compare-tray`, `compare-count`, `btn-comparar` | — |
| Comparador `/comparar` | `compare-table`, `compare-row` | `data-atributo="mdp\|hema\|…"`, `data-produto-id` na coluna |
| Preços `#precos` | `price-section`, `price-row`, `price-value`, `price-updated-at`, `best-price-badge`, `savings-text`, `presentations-differ`, `btn-comprar`, `presentation-selector` | `price-row`: `data-loja="dental-cremer"`, `data-status="disponivel\|indisponivel\|nao-encontrado"`, `data-menor-preco="true\|false"`, `data-centavos` |
| PWA | `offline-banner` | — |

## 10. Estrutura de arquivos

```
tests/
  fixtures/dados/materiais/sistemas-adesivos/   catálogo fictício (seção 3.1) — DADOS_DIR
  unit/
    dados.test.ts               (Molar) esquema
    cenarios-fixtures.test.ts   (Sonda) seções 3 e 4 sobre as fixtures + bugs conhecidos (it.fails)
  e2e/                          (Sonda) Playwright
    fluxo-convencional-2-passos.spec.ts   (E2E-01)
    fluxo-universal-seletivo.spec.ts      (E2E-02)
    precos.spec.ts  busca.spec.ts  universais.spec.ts  comparar.spec.ts
    navegacao.spec.ts  pwa.spec.ts  a11y.spec.ts  mobile.spec.ts
playwright.config.ts   4 projetos; webServer = next build && next start com
                       DADOS_DIR=tests/fixtures/dados INCLUIR_RASCUNHOS=0;
                       timezoneId America/Sao_Paulo; locale pt-BR
```

Vitest já inclui `tests/unit/**` (não pega `tests/e2e`). Playwright usa `testDir: tests/e2e`.

**Gates de CI:** `pnpm check` (lint + typecheck + Vitest + validar:dados) + E2E-01 + E2E-02 + a11y (serious/critical) + PWA-01/03/05. Demais specs rodam e reportam.

## 11. Perguntas em aberto

| # | Pergunta | Status |
|---|---|---|
| 1 | Empate no menor preço | ✅ Contrato: todas as empatadas recebem `menorPreco` |
| 2 | Produto esgotado com preço | ✅ Contrato: `indisponivel` não pode ter preço → fora do 🏆 |
| 3 | Limiar de "preço desatualizado" (PR-19) | ❓ PM |
| 4 | Limite máximo no comparador (CS-03) | ❓ PM / DESIGN §4.6 |
| 5 | Sinônimos na busca ("dois passos", "prime and bond") | ❓ PM — hoje só normalização (acento, caixa, `&+/_-`, espaços) |
| 6 | Escopo offline (catálogo inteiro × visitadas) | ❓ Ponte / Molar |
| 7 | Comparação em URL e/ou `localStorage` | ✅ ARQUITETURA: URL (`/comparar?ids=`) |
| 8 | "Mais consultados" sem dados de acesso | ❓ PM — proposta "Em destaque" (ARQUITETURA §9); H-06 testará o rótulo decidido |
| 9 | Oferta `indisponivel` mostra botão para a página da loja? | ❓ PM / DESIGN §4.7 |

## 12. Bugs encontrados

Provados por `tests/unit/cenarios-fixtures.test.ts` (bug aberto = `it.fails`; quando corrigido, o teste quebra e vira `it`). Dono: **Molar** (`src/lib`).

| Bug | Sev. | Status | Correção / reverificação |
|---|---|---|---|
| BUG-001 | S2 | ✅ Corrigido `f1aa8a6` — reverificado 06/10 | "N passo(s)" virou expressão; número solto casa só palavra inteira. Regressão ok: `2passos`, `2 PASSOS`, `3passos`, `3M`, `Single Bond 2`, `2.1`. |
| BUG-002 | S3 | ✅ Corrigido `f1aa8a6` — reverificado | https obrigatório no link de compra (fontes ainda aceitam http, por decisão). |
| BUG-003 | S2 | ✅ Corrigido `f1aa8a6` + `591374a` — reverificado | Bloqueia `//`, `/index.*`, caminhos/params de busca; exige forma de página de produto por loja (Cremer/Speed `/<slug>.html`, Med Sul `/<slug>`). **Limitação conhecida:** Med Sul aceita categoria de 1 nível (ex.: `/adesivos`) — garantia é a revisão humana do link. |
| BUG-004 | S3 | ✅ Corrigido `f1aa8a6` — reverificado | Toda `DataISO` ≤ hoje (UTC). |
| BUG-005 | S1 | ✅ Corrigido `f1aa8a6` — reverificado | `catalogo()` oculta ofertas de rascunho. |
| BUG-006 | S3 | ✅ Corrigido `f620700` — reverificado | MDP indexado também como 10-MDP; `"10-MDP"` ≡ `"MDP"`. |
| BUG-007 | S3 | ⏸ Wontfix no app (Molar) — reverificar no preview da Vercel | URI malformada → 500 no decode de params do próprio Next; corrigir exigiria middleware (runtime num site estático). Se o preview também der 500 → reabrir como upstream do Next. `test.fail` mantido. |
| BUG-008 | S2 | ✅ Corrigido `2ac25e8` — reverificado | Header a 320 px (contador vira badge < 360 px) e rótulo do diagrama hifenizado. MOB-01 verde em 320/390/412 px. |
| BUG-009 | S2 | ✅ Corrigido `2ac25e8` — reverificado | Causa: animação `stepIn` animava opacidade e o axe media no meio do fade-in (contraste final não era o problema). Agora só desloca. |
| BUG-010 | S3 | ✅ Corrigido `2ac25e8` — reverificado | |
| BUG-011 | S3 | ✅ Corrigido `2ac25e8` — reverificado | |
| BUG-012 | S2 | ✅ Corrigido `2ac25e8` — reverificado | Card e comparador só mostram "a partir de" com apresentação comparável (e dizem qual); senão "Apresentações diferentes" / "Preço em uma só loja" + ver preços. `test.fail` removido. |
| BUG-013 | S3 | ✅ Corrigido `2ac25e8` — reverificado | Lista todas as apresentações ("5 mL · 3 mL"). |
| BUG-014 | S4 | 🔴 Aberto (Pulpa) | Nome acessível do Comparar no header varia: 320 px "Comparar 0 produtos selecionados"; ≥ 360 px "Comparar (0) produtos selecionados" (leitor de tela lê os parênteses). |
| BUG-015 | — | ⚪ Retirado — não reproduzível | `/guia` a 320 px com 330 px vista uma vez; provável servidor de outra worktree na porta fixa. |
| BUG-016 | S3 | ✅ Corrigido `0c531c3` — reverificado (Molar) | Sair tocado antes da hidratação envia o form nativo sem `sairLocal()`: cookie e páginas do SW somem (Clear-Site-Data), mas a flag `sa:sessao` fica → depois o /login mostra "Sua sessão expirou" para quem saiu. |

**Fixtures novas:** URLs de compra devem seguir a forma da loja (`https://www.dentalcremer.com.br/<slug>.html`, `https://www.dentalspeed.com/<slug>.html`, `https://www.dentalmedsul.com.br/<slug>`).

### BUG-006 — "10-MDP" não acha produto com MDP cadastrado só como "MDP" · **S3**
- **Passos:** `DADOS_DIR=tests/fixtures/dados`; buscar `"10-MDP"` e `"MDP"`.
- **Esperado:** mesmos resultados (10-MDP é o nome técnico do MDP; o usuário digita qualquer um dos dois).
- **Obtido:** `"MDP"` → `exemplo-universal, ficticio-tudo-em-um, ficticio-universal-triplo`; `"10-MDP"` → `exemplo-universal, ficticio-tudo-em-um` (falta `ficticio-universal-triplo`, que tem `mdp: sim` e componente "MDP"). Não é regressão — já ocorria antes de `f1aa8a6`.
- **Sugestão:** em `itemDeBusca`, quando `composicao.mdp.valor === "sim"`, indexar `"MDP 10-MDP"`.

### BUG-001 — Busca por número de passos traz produtos da categoria errada · **S2**
- **Passos:** `DADOS_DIR=tests/fixtures/dados`; `buscar(índice, "3 passos")` ou `buscar(índice, "1 passo")`.
- **Esperado:** `"3 passos"` → só `ficticio-multiuso-3p`; `"1 passo"` → só `ficticio-tudo-em-um`.
- **Obtido:** `"3 passos"` também traz `ficticio-single-bond-2` (2 passos) porque o termo `3` casa com o fabricante "3M" e `passos` casa com "2 passos". `"1 passo"` também traz `ficticio-prime-bond-2-1` (2 passos) porque "2.1" vira "2 1". Com dados reais: Adper Single Bond 2 (3M, 2 passos) aparece ao buscar "3 passos".
- **Causa:** `buscar()` faz AND de termos soltos por substring; número + "passo(s)" deveria ser tratado como uma expressão (ex.: casar a frase normalizada inteira primeiro, ou indexar `"{n} passo(s)"` como token único).

### BUG-002 — Link de compra `http://` é aceito · **S3**
- **Passos:** oferta com `url: "http://www.dentalcremer.com.br/produto-x"` → `pnpm validar:dados`.
- **Esperado:** erro (exigir HTTPS, critério PR-24).
- **Obtido:** válido (`Url` aceita `/^https?$/`; `validarUrlDeProduto` não confere o protocolo).

### BUG-003 — Link de compra para busca/home disfarçada é aceito · **S2**
- **Passos:** `validarUrlDeProduto("dental-cremer", url)` com `https://www.dentalcremer.com.br/busca?q=ambar`, `…/index.html` ou `…//`.
- **Esperado:** rejeitar — o briefing exige a **página específica do produto**, nunca home nem busca (PR-21/22).
- **Obtido:** `null` (válido) nos três; só `pathname === "/"` é barrado.
- **Sugestão:** bloquear `index.*`, `//`, e caminhos de busca/categoria conhecidos por loja (`dominios` + padrões de rota de produto em `LOJAS`, a confirmar com Bula).

### BUG-004 — `consultadoEm` no futuro é aceito · **S3**
- **Passos:** oferta com `consultadoEm: "2099-01-01"` → `OfertasDoProduto.safeParse`.
- **Esperado:** erro (data de consulta não pode ser futura; senão a UI exibe "Última atualização: 01/01/2099").
- **Obtido:** válido. (Mesma lacuna provável em `Fonte.acessadoEm` e `Revisao.atualizadoEm`.)

### BUG-005 — Ofertas de produto em rascunho vazam para produção · **S1**
- **Passos:** `DADOS_DIR=tests/fixtures/dados INCLUIR_RASCUNHOS=0`; `const c = catalogo(); maioresEconomias(c.ofertas)`.
- **Esperado:** `ficticio-rascunho` ausente (rascunho nunca vai para produção — ARQUITETURA §3.1.5).
- **Obtido:** `ficticio-rascunho` é o **1º** de "Melhores preços". `catalogo()` filtra `produtos` mas devolve `ofertas` sem filtro. A home mostraria um produto não revisado com link para `/produto/ficticio-rascunho`, que é **404** em produção (`dynamicParams = false`).
- **Saída real:** `produtos: false | melhores: [ 'ficticio-rascunho', 'ficticio-ambar', 'ficticio-dois-frascos', 'ficticio-single-bond-2', 'exemplo-universal' ]`

## 13. Execução E2E (Playwright) — 06/10/2026, front `682f4c2`

`pnpm e2e` → build de produção com fixtures + `next start` (servidor **sempre novo**: um `next start` antigo na porta servia CSS/dados velhos e mascarava resultados). **Porta por worktree:** 3100 + hash do caminho (3100–3199), para agentes rodarem e2e em paralelo; `PORTA_E2E=31xx` força outra. Nunca matar processo numa porta que não é a sua. 4 projetos: desktop-chromium, mobile-chrome (Pixel 7), mobile-safari (iPhone 13), small (320 px).

Fluxos do §22 (E2E-01 completo até o clique em Comprar; E2E-02 até comparar produtos e preços) e todos os cenários de preço PR-01/02/06/07/08/09/10/11/14/16/18/21/25 **passam** em desktop e mobile-safari. As falhas restantes são os bugs abaixo.

Decisão de UI validada (Pulpa): com 3 preços iguais (PR-11), nenhuma loja recebe o selo; aparece "Mesmo preço nas lojas comparadas". ✅ Coerente com PR-11. A regra foi movida para `compararPrecos` (`7f71335`): preços todos iguais → nenhuma linha com `menorPreco`; reverificado em unitário e E2E.

### BUG-007 — URI malformada em rota dinâmica responde 500 · **S3** · Molar
- **Passos:** `pnpm e2e` (ou `curl -o /dev/null -w "%{http_code}" localhost:3100/produto/%E0`).
- **Esperado:** 404 amigável (C-06/D-05/B-21).
- **Obtido:** `/produto/%E0` → **500**; `/sistemas-adesivos/%E0/x` → **500**. (`/%E0` → 404, `/busca?q=%E0` → 200.) Pode ser comportamento do `next start` — conferir no preview da Vercel.
- **Teste:** `navegacao.spec.ts` (marcado `test.fail` com BUG-007).

### BUG-008 — Overflow horizontal no mobile; toques acertam o elemento errado · **S2** · Pulpa
- **Passos:** `pnpm e2e --project=mobile-chrome` (ou abrir a home/qualquer categoria a 412 px ou 320 px).
- **Esperado:** `scrollWidth` ≤ largura do aparelho (MOB-01).
- **Obtido (412 px):** home → 801 px (`span.whitespace-nowrap` até 800 px); as 7 categorias → **842 px** (`figure.diagram` / `figcaption` / `span.notacao` até 821 px; nos universais `div.paths`/`div.path__title`). No Chrome Android o layout viewport cresce para ~984 px e o conteúdo se sobrepõe: clicar em "Condicionamento seletivo" na home é interceptado por `.grp__body`/`h2`; na categoria, o link do produto é interceptado por `figure.diagram` e "Comparar com 3 passos →". **Consequência: E2E-01, E2E-02, H-04 (universais) e G-01 falham no mobile-chrome por timeout de clique.** Falha em mobile-chrome, mobile-safari e small.

### BUG-009 — Contraste insuficiente no diagrama "Como identificar?" · **S2** · Pulpa
- **Passos:** `pnpm e2e -g A11Y` (axe, WCAG 2.1 AA).
- **Obtido (`color-contrast`, serious):** `.step--pa > .step__glyph`, `.step--primer > .step__count`, `.step--adh > .step__label`, `.step--adh > .step__count` em categorias convencionais/autocondicionantes e no seletor de estratégias da página de produto universal.

### BUG-010 — Salto de heading h1 → h3 · **S3** · Pulpa
- **Rotas:** `/comparar` (estado vazio) e `/guia` (`<h3>Conteúdo em preparação.`). Todas as larguras.

### BUG-011 — Links em bloco de texto só se distinguem pela cor · **S3** · Pulpa
- **Obtido (`link-in-text-block`, serious):** na página de produto, `.small > a[href$="ifu.pdf"]` (fonte) e `a[href$="metodologia#precos"]`. Precisam de sublinhado ou outro indicador além da cor (A11Y-05).

### BUG-012 — Comparador mostra "Menor preço" de produto sem preços comparáveis · **S2** · Pulpa
- **Passos:** `/comparar?ids=ficticio-universal-triplo,ficticio-ambar`.
- **Esperado:** para produto sem nenhuma apresentação com ≥ 2 lojas, nada de "menor preço" (PR-02/PR-08); a linha extra coloca lado a lado preços de produtos e volumes diferentes (5 mL × 4 mL), o que o §13 proíbe.
- **Obtido:** linha `menor-preco` com "a partir de R$ 159,90" para `ficticio-universal-triplo` (5 mL na Speed, único preço da apresentação; a Cremer vende o 3 mL por R$ 99,90 — o "a partir de" também está errado). Sugestão: mostrar só "ver preços" (link para `#precos`) ou o valor apenas quando `comparacao.comparavel`, sempre com a apresentação.
- **Teste:** `fluxos.spec.ts` › BUG-012 (`test.fail`).

### BUG-013 — Comparador mostra só o volume da apresentação principal · **S3** · Pulpa
- **Passos:** `/comparar?ids=ficticio-universal-triplo,…`.
- **Esperado:** "3 mL · 5 mL" (todas as apresentações cadastradas) ou a apresentação explicitada.
- **Obtido:** "5 mL".

### Reexecução — front `2ac25e8`
`pnpm e2e` (4 projetos): **297 passed, 3 skipped** (SW/offline só no Chromium). BUG-007 segue como `test.fail` (wontfix no app). Corrigida uma corrida no próprio teste G-01/E2E-01: a home também linka `ficticio-ambar` (Melhores preços), então o 2º clique podia acontecer ainda na home no WebKit — agora espera a URL da categoria (48/48 em 8 repetições, mobile-chrome + mobile-safari).

### Ajustes — main `308375f`
- Texto de ausência agora é "Informação ainda não verificada" (Pulpa ajustou E2E-02). Onde o plano diz "Não informado", ler este texto.
- **P-02** coberto: a fixture `ficticio-multiuso-3p` aponta de propósito para `frasco-inexistente.webp`; o teste exige "Imagem ainda não disponível" e nenhuma `<img>` quebrada visível. O 404 dessa foto é o único erro de console tolerado (`apoio.ts`).

## 14. Login por senha — no main `73cfb1c`

Contrato esperado: todas as páginas exigem login; cookie HttpOnly de longa duração + flag em `localStorage`. Os testes rodam com a senha de teste vinda do ambiente (nunca commitada). Os E2E existentes passam a logar uma vez (projeto `setup` do Playwright → `storageState`), salvo os testes desta seção, que começam sem sessão.

| ID | Caso | Esperado | Sev. se falhar |
|---|---|---|---|
| LOG-01 | Sem cookie, abrir cada rota (`/`, 7 categorias, `/produto/{id}`, `/comparar?ids=a,b`, `/busca?q=Prime%26Bond`, `/guia`, `/metodologia`) | Redireciona para `/login?next=<rota original codificada, com query>` | S1 |
| LOG-02 | `next` malicioso: `/login?next=https://evil.com`, `//evil.com`, `/\evil.com`, `javascript:alert(1)` | Após login fica no site (vai para `/`); nunca redireciona para fora | S1 |
| LOG-03 | Senha errada, vazia, só espaços, 10 000 caracteres, unicode/emoji | Mensagem de erro em pt-BR, continua em `/login`, sem cookie de sessão, sem 500 | S1 |
| LOG-04 | Senha certa | Vai para o destino do `next` (incluindo query e `#precos`); cookie `HttpOnly`, `Secure` (em https), `SameSite`, expiração longa | S1 |
| LOG-05 | Recarregar; fechar o contexto e reabrir com o mesmo `storageState`; nova aba | Não pede login de novo | S2 |
| LOG-06 | "Sair" | Cookie removido + flag de `localStorage` limpa; qualquer rota volta a exigir login; Voltar do navegador não mostra conteúdo protegido do cache | S1 |
| LOG-07 | Sem cookie: `/manifest.webmanifest`, `/sw.js`, ícones, `/offline`, `/login`, `/robots.txt` | 200, sem redirect (PWA instalável antes do login) | S2 |
| LOG-08 | Sem cookie, `request.get` em páginas protegidas (sem seguir redirect) | Nunca 200 com HTML da página; corpo não contém nome de produto/preço das fixtures | S1 |
| LOG-09 | Service worker: logar, visitar páginas (vão para o cache), "Sair", ficar offline e abrir as mesmas páginas | Conteúdo protegido **não** é servido pelo SW sem sessão (cache limpo no logout ou SW checa a flag) | S1 |
| LOG-10 | Flag em `localStorage` sem cookie (forjada) | Não libera nada: o servidor decide pelo cookie | S1 |
| LOG-11 | Cookie com valor inválido/adulterado/expirado | Tratado como sem sessão (LOG-01) | S1 |
| LOG-12 | Senha não está no cliente: `grep -r "<senha>" .next/static` e no HTML de `/login` | Nenhuma ocorrência (nem do hash, se o hash permitir login) | S1 |
| LOG-13 | Duplo clique em Entrar; Enter no campo; teclado só | Um login só; formulário acessível (label, erro anunciado em `aria-live`, foco no erro) | S3 |
| LOG-14 | Muitas tentativas erradas seguidas | Comportamento definido (atraso/limite) sem travar quem acerta depois | S3 |

Perguntas ao Molar: nome da variável de ambiente da senha e do cookie; nome do campo/rota do formulário (`/login`, POST para onde?); se o login exige JS (Route Handler × Server Action); o que acontece com o SW no logout; rotas públicas definitivas.

### Execução do login — main `73cfb1c`
- Ajustes do Molar nos testes revisados e **aceitos**: `nextDe`/LOG-04 comparam caminho + parâmetros decodificados (o Next normaliza `,` → `%2C`; `&` dentro de `q` continua verificado), LOG-02 compara `hostname` (Location absoluto com porta). LOG-09 reforçado: depois de sair e offline, nem o produto nem a home (`/` saiu do shell do SW) mostram conteúdo.
- Teste corrigido (não era bug): no iPhone o header retrátil pode esconder o Sair; o helper `sair()` volta ao topo e clica no botão visível.
- **BUG-016** reproduzido em estresse (2/30 em mobile-chrome/mobile-safari) e depois de forma determinística com o envio nativo do form. Sugestão: o `/login?saiu=1` chamar `sairLocal()` ao montar (cobre o envio nativo e o sem-JS). Risco aceito a confirmar: no iOS, o apagamento do CacheStorage pelo `Clear-Site-Data` não é verificado (SW só testado no Chromium).
- Robustez (relato da Pulpa): o Sair da `header__nav` fica `display:none` abaixo de 1024 px; o helper usa `filter({ visible: true })` sem `.first()`.
- MOB-01b: `/guia` a 320 px com as webfonts bloqueadas também cabe. A falha do `/guia` vista antes (330 px) **não se reproduz** (0/11 + 0/6 com a fonte reserva) e provavelmente veio de rodar contra o servidor de outra worktree na porta fixa 3100. BUG-015 retirado (não reproduzível).
- BUG-016 corrigido (`0c531c3`): `/login?saiu=1` chama `sairLocal()` ao montar — cobre o envio nativo, o sem-JS e o Safari se ignorar `Clear-Site-Data`. Teste com `expect.poll` (limpeza roda na hidratação) + confere que o próximo `/login` não mostra "Sua sessão expirou".
- Flaky U-02 (mobile-safari, CI 37559347656): não reproduzido localmente (41/41 isolado; 4× o projeto inteiro, 509/509). Causa provável: `goto` em sequência aborta prefetches RSC e o WebKit reporta como `pageerror`. Correção no teste: helper `irPara()` (goto + `networkidle`) em todo teste com várias navegações (U-02, rascunho, PR-21). Se reaparecer no CI, preciso do texto do erro (não tenho `gh` autenticado).
