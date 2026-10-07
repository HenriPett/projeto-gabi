# DESIGN.md — Plataforma de Sistemas Adesivos

> Autor: Esmalte (Product Designer). Fonte de verdade visual e de interação para o Frontend.
> Base: `docs/BRIEFING.md`. Rotas e modelo de dados: `docs/ARQUITETURA.md` (prevalece em caso de divergência). O cliente **não vai enviar** a imagem de referência; o time reuniu referências próprias em `docs/referencia/` (ver README de lá). **Revisão 2 (06/10/2026)** incorporou essas referências; as mudanças estão marcadas com **[R2]** e resumidas no §8.
> Protótipo navegável: `docs/prototipo/index.html` (abrir direto no navegador, sem build). **Todos os dados do protótipo são fictícios** (Produto Exemplo A, Fabricante 1, R$ fictício) — nunca copiar valores dele para o banco.

---

## 0. Conceito

**"Atlas digital de consulta."** Três camadas, cada uma com um tratamento visual:

| Camada | Sensação | Onde aparece | Tratamento |
|---|---|---|---|
| Atlas | acadêmico, didático | Home (classificação), diagrama "Como identificar?", Modo de Uso, Guia rápido | Títulos em serifa, caixa-alta com tracking, blocos coloridos por grupo, diagramas verticais com setas |
| App de consulta | rápido, utilitário | Busca fixa, filtros, comparador, tabelas | Sans-serif, densidade média, alvos de toque ≥ 44px, tabelas zebradas |
| Catálogo | produto, compra | Cards, página de produto, preços | Foto do frasco em fundo cinza-claro, preço em números tabulares, CTA magenta |

Princípios:
1. **Classificação sempre visível.** Todo produto mostra o selo de grupo + subcategoria; toda página tem breadcrumb.
2. **Cor nunca é o único sinal.** Grupo = cor + rótulo textual + ícone/forma.
3. **Fonte sempre a um toque.** Todo bloco de dado científico ou preço tem um link "Fonte" (URL + data de acesso).
4. **Ausência é informação.** "Não encontrado / indisponível", "Apresentações diferentes", "Divergência entre fontes" têm componentes próprios — nunca espaço vazio ou zero.

---

## 1. Design tokens

Implementar como CSS custom properties em `:root` (e/ou `tailwind.config` `theme.extend`). Nomes abaixo são os nomes definitivos.

### 1.1 Cor — primitivas

| Token | Hex | Uso |
|---|---|---|
| `--purple-900` | `#2E0F3D` | texto sobre lilás em títulos de grupo, header escuro |
| `--purple-800` | `#4A1A63` | hover de primário |
| `--purple-700` | `#5E2280` | **primário** (links, botões, foco) |
| `--purple-600` | `#7433A0` | ícones ativos |
| `--magenta-700` | `#8E1B5E` | hover do CTA |
| `--magenta-600` | `#A8236E` | **CTA de compra / acento** |
| `--magenta-100` | `#FBE7F1` | fundo de destaque magenta |
| `--lilac-400` | `#B9A0D6` | bordas decorativas, setas do diagrama |
| `--lilac-200` | `#DDD0EE` | bordas de card selecionado, chips |
| `--lilac-100` | `#EFE8F7` | superfícies de seção, hover de linhas |
| `--lilac-50` | `#F8F4FC` | fundo de blocos "atlas" |
| `--gray-0` | `#FFFFFF` | fundo base |
| `--gray-50` | `#F7F7F9` | fundo da página/frasco |
| `--gray-100` | `#EEEDF1` | zebra de tabela, skeleton |
| `--gray-200` | `#E0DEE5` | bordas padrão |
| `--gray-400` | `#A19DAA` | ícones desabilitados (não usar em texto) |
| `--gray-500` | `#858090` | **borda de input/select/chip de filtro** (3.8:1 em branco, 3.6:1 em gray-50) |
| `--gray-600` | `#5F5A68` | texto secundário |
| `--gray-900` | `#17141C` | **texto principal** ("preto") |
| `--green-700` | `#1B6B45` | menor preço / sucesso |
| `--green-50` | `#E7F5EE` | fundo menor preço |
| `--amber-800` | `#7A4B00` | divergência / atenção |
| `--amber-50` | `#FFF5E0` | fundo divergência |
| `--red-700` | `#B3261E` | erro |
| `--red-50` | `#FDECEA` | fundo erro |

### 1.2 Cor — semânticas (o código usa SÓ estas)

| Token | Valor | Contraste verificado |
|---|---|---|
| `--color-bg` | `--gray-0` | — |
| `--color-bg-subtle` | `--gray-50` | — |
| `--color-surface-atlas` | `--lilac-50` | — |
| `--color-text` | `--gray-900` | 18.2:1 em branco |
| `--color-text-muted` | `--gray-600` | 6.7:1 em branco, 6.1:1 em lilac-50, 5.7:1 em gray-100 |
| `--color-border` | `--gray-200` | decorativo (cards, divisores) — **nunca** como única borda de campo de formulário |
| `--color-border-input` | `--gray-500` | 3.8:1 — borda de inputs, selects, chips de filtro (WCAG 1.4.11) |
| `--color-border-accent` | `--lilac-400` | 2.3:1 — **só decorativo** (setas do diagrama, hover de card) |
| `--color-primary` | `--purple-700` | 10.4:1 em branco |
| `--color-primary-hover` | `--purple-800` | |
| `--color-on-primary` | `#FFFFFF` | |
| `--color-cta` | `--magenta-600` | 6.7:1 (texto branco no botão) |
| `--color-cta-hover` | `--magenta-700` | |
| `--color-focus` | `--purple-600` | anel de 2px + offset 2px; 7.7:1 em branco |
| `--color-best` / `--color-best-bg` | `--green-700` / `--green-50` | 5.8:1 |
| `--color-warn` / `--color-warn-bg` | `--amber-800` / `--amber-50` | 6.8:1 |
| `--color-error` / `--color-error-bg` | `--red-700` / `--red-50` | 5.7:1 |

### 1.3 Cor — grupos de classificação

Cada grupo tem 3 tokens (sólido / tinta / texto-sobre-tinta) **e** um marcador de forma, para não depender de cor.

| Grupo | `--grp-*-solid` | `--grp-*-tint` | `--grp-*-ink` | Marcador | Ícone/forma |
|---|---|---|---|---|---|
| Convencionais (`conv`) | `#5E2280` | `#EFE8F7` | `#3B1352` | ● círculo | barra vertical cheia |
| Autocondicionantes (`auto`) | `#A8236E` | `#FBE7F1` | `#6E1146` | ◆ losango | |
| Universais (`univ`) | `#3D3A8F` | `#E9E8F7` | `#25236A` | ▲ triângulo | |

Texto branco sobre todos os `solid`: ≥ 6.7:1. `ink` sobre `tint`: ≥ 9.7:1.

### 1.4 Cor — etapas do diagrama "Como identificar?"

| Etapa | Fundo | Borda esquerda 4px | Texto | Glifo |
|---|---|---|---|---|
| Ácido | `--magenta-100` | `--magenta-600` | `--gray-900` | "H⁺" |
| Primer | `--lilac-100` | `--purple-600` | `--gray-900` | "P" |
| Adesivo | `#E9E8F7` | `#3D3A8F` | `--gray-900` | "A" |
| Primer + Adesivo / Ácido + Primer + Adesivo (combinados) | gradiente horizontal dos fundos envolvidos | borda de cada um empilhada (2px cada) | `--gray-900` | glifos juntos ("P+A") |

### 1.5 Tipografia

Fontes (Google Fonts / `next/font`, `display: swap`):
- **Títulos "atlas":** `Source Serif 4` 600/700 → `--font-serif`
- **UI e corpo:** `Inter` 400/500/600/700 → `--font-sans`
- Números (preço, volume, tabela): `font-variant-numeric: tabular-nums`.

Escala (mobile → ≥1024px). `line-height` entre parênteses.

| Token | Mobile | Desktop | Família / peso | Uso |
|---|---|---|---|---|
| `--text-display` | 32px (1.15) | 48px (1.1) | serif 700 | "SISTEMAS ADESIVOS" na Home |
| `--text-h1` | 28px (1.2) | 36px (1.15) | serif 700 | título de página/produto |
| `--text-h2` | 22px (1.25) | 28px (1.2) | serif 600 | seções (Modo de Uso, Produtos disponíveis) |
| `--text-h3` | 18px (1.3) | 20px (1.3) | sans 600 | título de card, etapa |
| `--text-overline` | 12px (1.3) | 13px | sans 700, `uppercase`, `letter-spacing: .08em` | rótulos de grupo, "CLASSIFICAÇÃO" |
| `--text-body` | 16px (1.55) | 16px | sans 400 | corpo |
| `--text-small` | 14px (1.45) | 14px | sans 400/500 | metadados, tabela |
| `--text-caption` | 12px (1.4) | 12px | sans 500 | fonte, data de atualização |
| `--text-price` | 24px (1.1) | 28px | sans 700 tabular | preço |

Corpo nunca < 16px em mobile (evita zoom no iOS em inputs). Largura de leitura máx. 68ch.

### 1.6 Espaçamento, raio, sombra, grid

- Base 4px. `--space-1: 4px` · `-2: 8px` · `-3: 12px` · `-4: 16px` · `-5: 20px` · `-6: 24px` · `-8: 32px` · `-10: 40px` · `-12: 48px` · `-16: 64px`.
- Gutter lateral: 16px (mobile) · 24px (≥640) · 32px (≥1024). Container máx. 1200px.
- Entre seções: `--space-10` mobile, `--space-16` desktop.
- Raio: `--radius-sm: 6px` (chips, inputs) · `--radius-md: 10px` (botões, cards) · `--radius-lg: 16px` (blocos de grupo, painéis) · `--radius-full: 999px` (pílulas).
- Sombra: `--shadow-1: 0 1px 2px rgb(23 20 28 / .06), 0 1px 3px rgb(23 20 28 / .08)` (cards) · `--shadow-2: 0 4px 12px rgb(46 15 61 / .12)` (hover, barra de comparação) · `--shadow-3: 0 12px 32px rgb(46 15 61 / .18)` (sheet/modal).
- Breakpoints (mobile-first, `min-width`): `sm 640` · `md 768` · `lg 1024` · `xl 1280`.
- Alvos de toque: mín. 44×44px.

### 1.7 Movimento

- `--dur-fast: 120ms` (hover, foco) · `--dur-base: 200ms` (expandir, sheet) · `--dur-slow: 320ms` (entrada do diagrama).
- Easing: `cubic-bezier(.2,.8,.2,1)`.
- `@media (prefers-reduced-motion: reduce)` → todas as durações = 0ms, sem animação de setas.

### 1.8 Modo escuro

Fora do escopo da v1 (público consulta em clínica/sala de aula, fundo branco é o padrão acadêmico). Tokens semânticos já permitem adicionar depois sem mexer em componentes.

---

## 2. Estados (aplicam-se a TODOS os componentes interativos)

| Estado | Botão primário | Botão secundário (outline) | Card clicável | Chip/toggle |
|---|---|---|---|---|
| default | bg `--color-primary`, texto branco | borda 1.5px `--color-primary`, texto `--color-primary`, bg branco | borda `--color-border`, `--shadow-1` | borda `--lilac-200`, bg branco |
| hover (pointer) | bg `--color-primary-hover` | bg `--lilac-50` | `--shadow-2`, `translateY(-2px)`, borda `--lilac-400` | bg `--lilac-50` |
| focus-visible | `outline: 2px solid var(--color-focus); outline-offset: 2px` — **em todos**, nunca remover | idem | idem (no card inteiro) | idem |
| active/pressed | bg `--purple-900`, `scale(.98)` | bg `--lilac-100` | `scale(.99)` | — |
| selecionado | — | — | borda 2px `--color-primary` + check no canto | bg `--color-primary`, texto branco, ícone ✓, `aria-pressed="true"` |
| disabled | bg `--gray-100`, texto `--gray-600`, `cursor:not-allowed`, `aria-disabled="true"` (manter focável se tiver tooltip explicando) | borda `--gray-200`, texto `--gray-600` | opacidade 1, selo "Indisponível" | borda `--gray-200`, texto `--gray-600` |
| loading | texto mantém largura, spinner 16px à esquerda, `aria-busy="true"`, desabilitado | idem | skeleton (ver abaixo) | — |

**Loading de conteúdo:** skeleton em `--gray-100` com shimmer (desligado em reduced-motion), mesmas dimensões do conteúdo final (sem layout shift). Preço carregando: barra 96×24px.

**Vazio:** ilustração linear simples (frasco em `--lilac-400`) + título h3 + 1 frase + ação. Textos:
- Categoria sem produtos: "Nenhum produto cadastrado nesta categoria ainda." + link "Ver outras categorias".
- Busca sem resultado: "Nada encontrado para “{termo}”." + "Tente o nome comercial, o fabricante ou termos como *MDP*, *2 passos*, *Universal*." + chips de sugestão.
- Comparador vazio: "Selecione de 2 a 4 produtos para comparar." + botão "Explorar categorias".

**Erro de carregamento:** caixa `--color-error-bg` com ícone ⚠, texto "Não foi possível carregar {o quê}." + botão secundário "Tentar novamente". `role="alert"`.

---

## 3. Componentes base

### 3.1 Header + busca fixa (`<SearchBar>`)
- Header `position: sticky; top: 0; z-index: 50`, bg branco, borda inferior `--color-border`, altura 56px (mobile) / 64px (≥1024).
- Mobile: linha 1 = logotipo (wordmark "Sistemas Adesivos" serif 18px 700 `--purple-900`, `nowrap`) + botão "Comparar (n)" à direita (`nowrap`). **Abaixo de 360px:** o logotipo cai para 14px e o botão vira "Comparar" + contador num badge circular de 20px (`--color-primary`, texto branco 11px 700; `aria-label="Comparar, n produtos selecionados"`). Linha 2 = campo de busca 48px de altura, largura total. Ao rolar para baixo > 120px, a linha 1 colapsa (só a busca fica fixa, 64px total); reaparece ao rolar para cima.
- ≥1024: uma linha só: logo · busca (máx. 560px, centro) · links "Classificação", "Comparar", "Guia".
- Campo: `type="search"`, `role="combobox"`, `aria-expanded`, `aria-controls="search-listbox"`, placeholder **"Pesquisar sistema, marca ou produto"**, ícone lupa (SVG, não emoji) à esquerda 20px `--gray-600`, botão limpar (×) quando há texto, `aria-label="Limpar busca"`. bg `--gray-50`, borda 1.5px `--color-border-input`, raio `--radius-md`; foco: borda `--color-primary` + anel de foco.
- Atalho `/` foca a busca (desktop).
- **Sugestões (listbox)**: abre após 1 caractere, debounce 150ms, máx. 8 itens agrupados por tipo com overline: **CATEGORIAS** (ex.: "Convencionais › 2 passos"), **PRODUTOS** (miniatura 32px + nome + fabricante + selo de grupo), **FABRICANTES**, **COMPONENTES** (ex.: "MDP — 4 produtos"). Termo casado em `<mark>` (bg `--magenta-100`, sem itálico). Setas ↑↓ navegam (`aria-activedescendant`), Enter abre, Esc fecha. Mobile: listbox ocupa a tela abaixo do header (sheet branca).
- Busca é tolerante a acento/caixa ("ambar" = "Âmbar") e a sinônimos: "2 passos", "dois passos"; "auto", "self-etch"; "universal".
- Página de resultados `/busca?q=`: lista de cards de produto + filtros em chips (Grupo, Fabricante, Contém MDP, Contém HEMA).

### 3.2 Selo de classificação (`<ClassBadge>`)
Pílula `--radius-full`, altura 24px, padding 0 10px, `--text-caption` 600 uppercase tracking .04em.
`[marcador] CONVENCIONAL · 2 PASSOS` — bg `--grp-*-tint`, texto `--grp-*-ink`, marcador 8px em `--grp-*-solid`.
Variante `solid` (sobre foto/hero): bg `solid`, texto branco.

### 3.3 Breadcrumb
`nav[aria-label="Navegação estrutural"] > ol`. `--text-small`, separador "›" `aria-hidden`. Último item `aria-current="page"`, sem link. Mobile: mostra só "‹ {pai}" (link de voltar) para não quebrar linha.

### 3.4 Botões
Alturas: `lg 52px` (CTA de compra mobile), `md 44px` (padrão), `sm 36px` (só desktop, dentro de tabela). Padding horizontal 20/16/12px. Texto `--text-body` 600 (sm: 14px). Ícone 20px, gap 8px.
Variantes: `primary` (roxo), `cta` (magenta — **exclusivo de compra/"Comparar preços"**), `secondary` (outline), `ghost` (texto roxo, sublinhado no hover), `icon` (44×44, `aria-label` obrigatório).

### 3.5 Link de fonte (`<SourceLink>`)
`--text-caption` `--color-text-muted`: "Fonte: {nome do documento} · acesso em DD/MM/AAAA ↗". Link abre em nova aba (`target="_blank" rel="noopener"` + texto visualmente oculto "(abre em nova aba)"). Aparece ao pé de: Classificação, Composição, Indicações, Modo de uso, cada preço.

### 3.6 Aviso de divergência (`<DivergenceNote>`)
Caixa `--color-warn-bg`, borda-esquerda 4px `--color-warn`, raio `--radius-md`, padding 12/16. Ícone ⚠ (SVG). Título `--text-small` 700 `--color-warn`: "Divergência entre fontes". Corpo lista cada fonte e o que ela diz, lado a lado: "IFU (2024): 20 s · Ficha técnica (2022): 15 s". **Nunca escolher um valor**. `role="note"`.

### 3.7 Diagrama "Como identificar?" (`<StepDiagram>`) — componente-assinatura
Vertical em todos os breakpoints (é o formato do atlas; lê de cima para baixo).
- Container: bg `--color-surface-atlas`, raio `--radius-lg`, padding 20px (mobile) / 32px, borda 1px `--lilac-200`.
- Overline: "COMO IDENTIFICAR?" `--text-overline` `--color-primary`.
- Cada **etapa** = bloco de altura 56px (mobile) / 64px, largura 100% (máx. 360px, centralizado), raio `--radius-md`, cores da tabela 1.4, glifo em círculo 32px à esquerda (bg branco, borda 1.5px da cor da etapa), rótulo `--text-h3` uppercase.
- **Seta** entre etapas: SVG 24×28px, traço 2px `--lilac-400`, ponta em "V". `aria-hidden`.
- Etapa combinada (ex.: Primer + Adesivo num frasco) = um único bloco com rótulo "PRIMER + ADESIVO" e glifo "P+A"; abaixo, legenda caption "mesmo frasco".
- **[R2]** Contador à direita do bloco: **"passo 1", "passo 2"**, nunca "frasco N". **Passo = aplicação clínica, não frasco.** O kit de convencional 3 passos tem 2 frascos + ácido em seringa; o autocondicionante de 1 passo pode ter 2 frascos que se misturam e são aplicados uma vez (Silva e Souza Jr. 2010, Fig. 9). Textos de leitura: o ácido é "aplicado separadamente" (não "em frasco separado"); o bloco tudo-em-um é "uma única aplicação" (não "um único frasco"). "Mesmo frasco" continua válido só no bloco combinado Primer + Adesivo do convencional de 2 passos.
- **[R2] Legenda da notação:** deve **quebrar linha** entre itens. Cada item fica `nowrap` e o separador " · " fica **fora** do span. Containers de grade/flex que recebem o diagrama precisam de `min-width: 0` nos filhos, senão a legenda alarga a coluna.
- **[R2] Notação compacta** sob o título do diagrama, em `--text-small` 600 `--purple-900`, fonte tabular, com `aria-hidden` (a leitura completa já está no figcaption). `+` separa passos e `(…)` agrupa o que é aplicado junto (adaptado de Perdigão 2022):
  | Subcategoria | Notação |
  |---|---|
  | Convencional 3 passos | `Ác + P + Ad` |
  | Convencional 2 passos | `Ác + (P·Ad)` |
  | Autocondicionante 2 passos | `P_ac + Ad` (P_ac = primer autocondicionante; renderizar "P" com subscrito "ac") |
  | Autocondicionante 1 passo | `(Ác·P·Ad)` |
  | Universal seletivo | `Ác_esm + U` (subscrito "esm") |
  | Universal total | `Ác + U` |
  | Universal autocondicionante | `U` |
  Legenda fixa uma vez por página (caption muted): "Ác = ácido fosfórico · P = primer · Ad = adesivo · U = adesivo universal · esm = só esmalte · ( ) = aplicados juntos".
- **[R2] Etapa ausente riscada** (ensino por contraste, como a seringa riscada em Perdigão p. 5): nos autocondicionantes e no universal autocondicionante, o diagrama abre com um bloco fantasma **"Ácido fosfórico separado"**: altura 40px, borda 1.5px tracejada `--gray-500`, fundo transparente, texto `--gray-600` 14px com `text-decoration: line-through`, ícone ✕ 16px `--red-700` à esquerda, rótulo à direita "não usa". Ele não conta como passo (sem contador) e o figcaption diz "sem condicionamento ácido separado". Sem seta saindo dele: um traço tracejado de 16px liga ao primeiro passo real.
- **[R2] Etapa opcional** (só se o conteúdo, com fonte, confirmar para aquela subcategoria): bloco tracejado `--lilac-400` com rótulo "Condicionamento seletivo do esmalte" e selo "opcional". Aparece no lugar do bloco fantasma, nunca junto com ele. Não entra na notação compacta.
- Universais: três colunas **quando o próprio diagrama tem ≥700px de largura** (container query `@container diagrama`, nunca media query de janela) ou três cartões empilhados com divisor "OU" em pílula. Lado a lado, as colunas têm a mesma altura (`align-items: stretch`) e as etapas ocupam a largura do cartão.
- **Na página de categoria dos universais o diagrama ocupa a largura total** (fora do grid 5/12 + 7/12) e "O que caracteriza" vem abaixo. Na coluna de 5/12 os 3 caminhos ficavam com ~120px cada, e o cliente reportou palavras quebrando letra a letra e o 3º caminho sobrepondo a coluna direita (06/10/2026).
- **Tipografia dos blocos:** nunca `hyphens: auto` nem `overflow-wrap: anywhere` em rótulos de etapa, legendas de substrato ou etapa riscada. Use `word-break: normal` e `hyphens: manual`. Se um rótulo não couber, encurte-o: "PRIMER" + sub "autocondicionante" em vez de "PRIMER AUTOCONDICIONANTE". Intervalos numéricos ("1‑2 gotas") usam hífen inseparável (U+2011).
- Acessibilidade: `<figure>`; os blocos visuais ficam `aria-hidden="true"` e o `<figcaption>` traz a leitura completa em texto (visualmente oculto além do overline): "Convencional de 2 passos: 1. Ácido, em frasco separado; 2. Primer e adesivo no mesmo frasco."
- Animação de entrada: etapas entram em sequência **só com translateY 8px → 0** (80ms de stagger), **sem animar opacidade**, porque o fade reduzia o contraste abaixo de AA durante a entrada (axe, serious). Desligada em reduced-motion.

Mapa de diagramas (conteúdo fixo do produto, revisado pelo time de conteúdo):
| Categoria | Etapas |
|---|---|
| Convencional 3 passos | Ácido ↓ Primer ↓ Adesivo |
| Convencional 2 passos | Ácido ↓ Primer + Adesivo |
| Autocondicionante 2 passos | Primer autocondicionante ↓ Adesivo |
| Autocondicionante 1 passo | Ácido + Primer + Adesivo (um único frasco/componente) |
| Universal — cond. seletivo | Ácido (só em esmalte) ↓ Adesivo universal |
| Universal — cond. total | Ácido (esmalte + dentina) ↓ Adesivo universal |
| Universal — autocondicionante | ~~Ácido fosfórico separado~~ ↓ Adesivo universal |

Autocondicionante 1 e 2 passos também começam pelo bloco fantasma ~~Ácido fosfórico separado~~ **[R2]**.

**[R2] Pictograma de substrato** (`<SubstrateGlyph>`). No bloco de etapa **abaixo de 640px**, o pictograma fica a 24px e a legenda de substrato desce para a linha de baixo do rótulo (como `step__sub`), para o contador "passo N" não encostar na borda., obrigatório nos três caminhos do universal e no bloco Ácido dos convencionais. É um corte de dente simplificado em SVG de 40×40: a coroa tem um anel externo (esmalte, traço 1.5px `--gray-600`) e um núcleo (dentina, preenchimento `--gray-100`). A área condicionada recebe preenchimento `--magenta-600` com 45% de opacidade:
- seletivo: só o anel de esmalte;
- total / convencionais: anel e núcleo;
- autocondicionante: nenhuma área, com o rótulo "sem ácido".
Abaixo dele vem uma legenda caption ("esmalte" / "esmalte + dentina" / "sem ácido"). É isso que diferencia visualmente seletivo × total, que têm a mesma sequência de passos (referência: Unichristus p. 35, Perdigão p. 6). Precisa de um campo na taxonomia: `substratoAcido: "esmalte" | "esmalte-e-dentina" | null`, a validar com o Molar.

### 3.8 Card de produto (`<ProductCard>`)
Mobile: **horizontal compacto** (lista); ≥640: **vertical** em grade (2 col ≥640, 3 col ≥1024, 4 col ≥1280).

Anatomia vertical (de cima p/ baixo):
1. **Mídia** — proporção 4:5, bg `--gray-50`, foto do frasco `object-fit: contain`, padding 16px. `alt="Frasco do {nome} — {fabricante}"`. Sem foto: silhueta SVG de frasco em `--lilac-200` + caption "Imagem indisponível".
2. Canto superior esquerdo da mídia: `<ClassBadge>`.
3. Canto superior direito: toggle **Comparar** (ícone ⊕ 44×44, `aria-pressed`, `aria-label="Adicionar {nome} à comparação"`). Selecionado: ícone ✓ em círculo roxo.
4. Overline: fabricante (`--text-overline` `--color-text-muted`).
5. Nome comercial `--text-h3` `--color-text`, máx. 2 linhas (clamp).
6. Linha de metadados `--text-small` muted: "Frasco · 4 mL" (apresentação · volume).
7. Estratégia: `--text-small`: "Condicionamento ácido + adesivo". Universais: chips minis das estratégias indicadas (ver §4.5).
8. Componentes: até 3 chips (`--radius-sm`, 24px, bg `--gray-50`, borda `--gray-200`, `--text-caption`): "MDP", "HEMA", "Etanol". Excedente "+2".
9. Faixa de preço, conforme os dados:
   - ≥2 lojas com a mesma apresentação: "a partir de **R$ 00,00**" (`--text-small` + `--text-h3` tabular);
   - só 1 loja com preço: "**R$ 00,00** em 1 loja" (sem "a partir de", porque não houve comparação);
   - preços só em apresentações diferentes: "Preços em apresentações diferentes" (`--text-small` muted, sem valor);
   - nenhum preço: "Preço não encontrado" muted.
10. Ações (grid 2 colunas, gap 8): **VER PRODUTO** (`secondary`) · **COMPARAR PREÇOS** (`cta`). Mobile horizontal: ações em linha abaixo do conteúdo, largura total.

Anatomia horizontal (mobile < 640): mídia 96×120 à esquerda; à direita itens 2, 4, 5, 6, 8 (máx. 2 chips), 9; ações abaixo ocupando a largura do card.
- O card inteiro **não** é um link (tem 3 ações); o nome é o link principal para a página do produto.
- Hover/foco: ver §2.

### 3.9 Barra de comparação (`<CompareTray>`)
Aparece fixa no rodapé quando ≥1 produto está marcado. Altura 64px, bg branco, `--shadow-3`, borda-top `--lilac-200`. Conteúdo: miniaturas (32px) dos selecionados com × para remover, contador "2 de 4", botão primário **COMPARAR** (desabilitado com < 2: texto "Selecione mais 1"). Máx. 4 produtos (tentativa de 5º: toast "Limite de 4 produtos na comparação"). Estado persistido em `localStorage`. `role="region" aria-label="Produtos selecionados para comparação"`. Anunciar mudanças via `aria-live="polite"`.

---

## 4. Telas

### 4.1 Home `/`

Ordem (mobile, uma coluna):
1. **Header + busca fixa** (§3.1).
2. **Hero da classificação**: overline "CLASSIFICAÇÃO" · display **"SISTEMAS ADESIVOS"** (serif, `--purple-900`, centralizado) · subtítulo `--text-body` muted: "Consulte a classificação, estude o modo de uso e compare preços nas principais dentais." Abaixo, um traço de 64×3px `--magenta-600` (assinatura "atlas").
3. **Grade de classificação** — o coração da Home. Um bloco por grupo:
   - Bloco: raio `--radius-lg`, borda 1px `--grp-*-tint` escurecida (`--lilac-200`), overflow hidden.
   - **Cabeçalho do grupo**: faixa `--grp-*-solid`, altura 56px, texto branco `--text-h3` uppercase tracking .06em: "● CONVENCIONAIS". À direita, contador "12 produtos" caption branco 85% — **oculto < 640px** (não cabe ao lado de "AUTOCONDICIONANTES" em 375px; a contagem já aparece em cada subcategoria). Botão "?" (44×44, `aria-label="O que são sistemas convencionais?"`) abre popover com 2 linhas de definição.
   - **Corpo**: bg `--grp-*-tint`, padding 12px, grade de **cards de subcategoria**: mobile = 2 colunas (Universais: 1 coluna com 3 linhas — os rótulos são longos); ≥768 = 1 linha com todas as subcategorias.
   - **Card de subcategoria** (é um `<a>` inteiro): bg branco, raio `--radius-md`, min-height 96px, padding 16px. Conteúdo: rótulo grande `--text-h3` uppercase ("2 PASSOS"), **[R2] notação compacta** logo abaixo (`Ác + (P·Ad)`, `--text-small` 600 `--purple-900`, `aria-hidden`), **mini-diagrama** (até 3 blocos coloridos de 8px de altura empilhados — versão miniatura do §3.7, `aria-hidden`), caption "{n} produtos", seta "→" no canto. Hover/foco: §2. `aria-label="Convencionais, 2 passos — 5 produtos"`.
   - ≥1024: os três grupos lado a lado em 3 colunas (como colunas da tabela de referência), cards de subcategoria empilhados verticalmente em cada coluna. Isso reproduz a estrutura de tabela da referência, mas interativa.
4. **⭐ Em destaque** (v1; o briefing chama de "Produtos mais consultados") — h2 serif, **sem link "Ver todos" na v1**: não há página de listagem e o carrossel já mostra a curadoria inteira. O link volta quando houver `/sistemas-adesivos/em-destaque` ou similar. Curadoria manual em `data/materiais/sistemas-adesivos/destaques.json` (a ordem do arquivo é a ordem de exibição; seleção combinada entre Esmalte e Bula). Sem arquivo, ou com ele vazio, a seção não aparece e a ordenação padrão da categoria é A–Z; o título só vira "Mais consultados" quando houver dado real de analytics. Nunca rotular curadoria como popularidade. Mobile: carrossel horizontal com scroll-snap (cards verticais 240px de largura, 1.2 cards visíveis para indicar rolagem), sem autoplay; setas ‹ › em ≥1024. `role="region" aria-roledescription="carrossel"`.
5. **💰 Melhores preços** — h2 + subtítulo caption: "Produtos com maior diferença de preço entre as três dentais (mesma apresentação)." Lista de até 5 linhas: miniatura · nome + apresentação · "economia de **R$ 00,00**" em `--color-best` · chevron. Só entram produtos com ≥2 preços comparáveis. Rodapé: "Preços consultados em DD/MM/AAAA."
6. **📚 Guia rápido** — h2 + grade de cartões-tópico (mobile 1 col, ≥640 2 col, ≥1024 3 col): bg `--color-surface-atlas`, ícone linear 24px `--purple-600`, título `--text-h3`, 1 linha de resumo, link. Tópico ainda sem conteúdo com fonte: cartão **não interativo** (sem `<a>`, sem hover), borda 1px **tracejada** `--lilac-200`, fundo `--gray-50`, ícone `--gray-500`, título `--color-text`, linha "Em preparação" em caption muted. Tópicos: Como escolher a estratégia adesiva? · Convencional x autocondicionante · O que é adesivo universal? · O que é MDP? · Esmalte x dentina · Condicionamento seletivo · Camada híbrida.
7. **Rodapé**: aviso fixo `--text-caption` muted: "Conteúdo de consulta e estudo. Sempre siga as instruções de uso (IFU) do fabricante. Preços sujeitos a alteração nas lojas." + links Sobre / Fontes e metodologia.

Emojis do briefing (⭐ 💰 📚 🔎 🏆) → usar ícones SVG lineares equivalentes nos títulos (consistência e leitores de tela). Exceção: 🏆 pode ficar como emoji no selo de menor preço se o cliente insistir; spec padrão = ícone de troféu SVG.

### 4.2 Página de categoria `/sistemas-adesivos/{grupo}/{subcategoria}` (ex.: `/sistemas-adesivos/convencionais/2-passos`)

1. Breadcrumb: Sistemas Adesivos › Convencionais › 2 passos.
2. **Cabeçalho**: `<ClassBadge solid>` "CONVENCIONAL" · h1 serif "Convencional — 2 passos" · **tabs de subcategoria irmãs** (pílulas segmentadas: [2 passos] [3 passos]) para pular sem voltar. **Universais < 640px:** grade de 3 colunas iguais, raio `--radius-md` (igual ao seletor da §4.5), com rótulos curtos "Seletivo · Total · Autocond." e `aria-label` completo. A pílula com `flex-wrap` vira uma "bolha" de 3 linhas, o que é proibido; `role="tablist"` não — são links (`nav` com `aria-current`).
3. **Grade 2 colunas em ≥1024** (diagrama à esquerda 5/12, explicação à direita 7/12); mobile empilhado:
   - `<StepDiagram>` "Como identificar?" (§3.7).
   - **Explicação**: h2 "O que caracteriza", parágrafo `--text-body` (≤ 3 frases, máx. 68ch). Ex.: "Sistema de condicionamento ácido prévio, seguido da aplicação de primer e adesivo, conforme a composição e protocolo específico do produto." · `<SourceLink>` da classificação · link "Comparar com 3 passos →".
4. **PRODUTOS DISPONÍVEIS** — overline + h2 com contagem "5 produtos".
   - Barra de ferramentas: ordenar (select: "Em destaque", "Menor preço", "A–Z") + filtro "Fabricante" (chips multi-seleção) + toggle "Contém MDP". Mobile: um botão "Filtrar e ordenar" abre bottom sheet.
   - Lista/grade de `<ProductCard>` (§3.8).
   - `<CompareTray>` quando houver seleção.
5. Estados: loading = 4 skeletons de card; vazio = §2.

### 4.3 Página de produto `/produto/{id}`

Mobile, ordem:
1. Breadcrumb (mobile: "‹ Convencional · 2 passos").
2. **Hero**: mídia do frasco 1:1, bg `--gray-50`, raio `--radius-lg`, foto `contain`; toque abre zoom (dialog em tela cheia, pinch habilitado, `aria-label="Ampliar imagem do frasco"`). Galeria (miniaturas 56px) se houver >1 foto.
3. Overline fabricante · h1 serif "{NOME}" · `<ClassBadge>`.
4. **Ações primárias** (sticky no rodapé em mobile enquanto o hero estiver fora da tela): **COMPARAR PREÇOS** (`cta`, rola até §preços e foca o h2) + ícone ⊕ comparar.
5. **Ficha técnica** — lista de definição `<dl>` em duas colunas (rótulo overline muted / valor body), linhas separadas por borda `--gray-200`:
   - CLASSIFICAÇÃO — "Convencional — 2 passos" (link para a categoria)
   - ESTRATÉGIA ADESIVA — "Condicionamento ácido + aplicação de adesivo" (universais: §4.5)
   - APRESENTAÇÃO — "Frasco"
   - VOLUME — "4 mL"
   - FABRICANTE — "FGM"
   - `<SourceLink>` ao pé.
6. **Composição** — h2. Chips grandes (32px) para componentes-chave pesquisáveis (MDP, HEMA, silano, solvente) — clicar leva à busca por componente. Abaixo lista completa `<ul>` só com componentes **confirmados**. Se a fonte não declara: texto muted "Composição completa não divulgada pelo fabricante." `<SourceLink>`. `<DivergenceNote>` se houver.
7. **Indicações** — h2 + lista `<ul>` com bullets ▸ `--purple-600`. `<SourceLink>`.
8. **Modo de Uso** — seção-vitrine, bg `--color-surface-atlas` em largura total (sangra até as bordas), padding vertical 40px.
   - Overline "PROTOCOLO DO FABRICANTE" · h2 serif "Modo de Uso" · caption: "Segundo a IFU oficial de {fabricante} ({ano/versão}). Este protocolo é específico deste produto." Link "Ver IFU original ↗".
   - **Etapas** `<ol>`: cada etapa é um cartão branco, raio `--radius-md`, `--shadow-1`, padding 16px, grade `[número | conteúdo]`:
     - **Número**: "01" em serif 28px 700 `--magenta-600`, coluna 48px.
     - Título `--text-h3` ("Condicionamento").
     - Instrução `--text-body` (frase da IFU).
     - **Parâmetros** em chips com ícone — mapeiam 1:1 para `parametros[{tipo, texto}]` (ARQUITETURA.md); o chip mostra `texto` tal como veio da IFU, o ícone vem de `tipo`: `tempo`→relógio, `camadas`→camadas, `friccao`→mão, `jato-de-ar`→ar, `luz`→lâmpada, `substrato`→dente, `outro`→ⓘ. Exemplos de texto (linha abaixo): ⏱ tempo ("15 s"), ↻ camadas/aplicações ("2 camadas"), ✋ fricção ("fricção ativa 10 s"), 💨 jato de ar ("5 s"), 💡 fotopolimerização ("10 s · ≥ 1000 mW/cm²"), 🦷 substrato ("esmalte e dentina"). Ícones SVG; chip bg `--lilac-100`, texto `--purple-900` 14px 600 tabular. Só renderiza o parâmetro que a IFU informa.
     - Ilustração opcional da etapa (pictograma 64px) à direita em ≥640.
   - **Conector** entre cartões: linha vertical 2px `--lilac-400` de 16px com seta (mesmo SVG do diagrama), alinhada ao centro da coluna do número.
   - ≥1024: lista vertical continua (protocolo é sequencial; não fazer grade). Largura máx. 760px, centralizada.
   - Toggle "Modo estudo" (opcional v1.1): marca etapas como concluídas (checkbox por etapa) — não necessário na v1.
   - Rodapé da seção: aviso caption "Sempre confirme na embalagem do lote em uso." + `<SourceLink>`.
9. **Comparar preços** — §4.7.
10. **Produtos da mesma categoria** — carrossel de cards.

≥1024: layout 2 colunas no topo — coluna esquerda (5/12) mídia sticky; direita (7/12) itens 3–7. Modo de Uso e Preços em largura total abaixo.

### 4.4 Universais por estratégia `/sistemas-adesivos/universais/{condicionamento-seletivo|condicionamento-total|autocondicionante}`

Igual à §4.2, com diferenças:
- Tabs de estratégia: [Cond. seletivo] [Cond. total] [Autocondicionante].
- `<StepDiagram>` mostra **os três caminhos** lado a lado (≥640) ou empilhados com pílula "OU" (mobile), com o caminho da página atual destacado (borda 2px `--grp-univ-solid`, demais com opacidade 0.55 — mas texto ainda ≥ 4.5:1, então usar cor `--gray-600` em vez de opacity no texto).
- Abaixo dos cards de produto, texto caption: "Exibindo produtos com indicação oficial do fabricante para esta estratégia."

### 4.5 Seletor de estratégias dos universais (`<StrategySelector>`)

Problema: o mesmo adesivo aparece em 3 listas; o usuário não pode achar que são 3 produtos.

**No card de produto universal:**
- Abaixo do nome, linha "Estratégias indicadas:" + **três chips fixos sempre na mesma ordem** (Seletivo · Total · Autocond.). Indicado: chip bg `--grp-univ-tint`, texto `--grp-univ-ink`, ícone ✓. Não indicado: chip bg branco, borda tracejada `--gray-200`, texto `--gray-600`, ícone —, `aria-label="Não indicado para autocondicionante"`. A estratégia da página atual tem borda 2px `--grp-univ-solid`.
- Legenda fixa no topo da lista (uma vez, não por card): ícone ⓘ + "Um adesivo universal pode ser usado em mais de uma estratégia. É o **mesmo produto** — muda só a técnica de aplicação."

**Na página do produto universal** (substitui o item ESTRATÉGIA ADESIVA da ficha e controla o Modo de Uso):
- Bloco com título h3 "Escolha a estratégia de uso" e frase "Mesmo frasco, três formas de usar." + uma pequena ilustração: **um único frasco** central com 3 setas saindo para as estratégias (reforço visual de "1 produto → n técnicas").
- **Controle segmentado** (`role="radiogroup"`, cada opção `role="radio"`, setas ←→ navegam): [Seletivo] [Total] [Autocondicionante]. Grade de 3 colunas iguais, largura 100%, altura 44px, raio `--radius-md`, fundo `--gray-50`; rótulos curtos "Seletivo / Total / Autocond." com `aria-label` completo (o rótulo longo quebra linha em 375px); selecionado = pílula branca `--shadow-1` com texto `--purple-900` 600. Estratégia não indicada pelo fabricante: opção visível, desabilitada, rótulo "Autocondicionante — não indicado", tooltip/nota explicando.
- Ao trocar: atualiza **somente** o `<StepDiagram>` compacto e as etapas do **Modo de Uso** (cada estratégia tem seu protocolo da IFU). Nome, foto, composição, preço **não mudam** (prova visual de que é o mesmo produto). Transição: cross-fade 200ms só nas etapas. URL atualiza `?estrategia=seletivo` (compartilhável, sem novo histórico: `replaceState`).
- Valor inicial = estratégia de onde o usuário veio (query/referrer) ou a primeira indicada.
- `aria-live="polite"` no cabeçalho do Modo de Uso anuncia "Protocolo: condicionamento seletivo, 5 etapas".

### 4.6 Comparador de produtos `/comparar?ids=a,b,c`

- Entrada: `<CompareTray>` ou botão "Comparar" do header. 2–4 produtos.
- Cabeçalho da página: h1 "Comparar sistemas" + botão "Adicionar produto" (abre busca em dialog) + "Limpar".
- **Tabela** `<table>` real com `<caption class="sr-only">`, `<th scope="col">` por produto e `<th scope="row">` por atributo.
  - Linha de cabeçalho (sticky abaixo do header): miniatura 64px, nome (link), fabricante, `<ClassBadge>`, botão × remover (`aria-label="Remover {nome}"`).
  - Primeira coluna (atributos) **sticky à esquerda**, largura 132px mobile / 200px desktop, bg branco, sombra à direita quando houver scroll.
  - Colunas de produto: min 160px; mobile rola horizontalmente dentro de um container `overflow-x:auto` com `tabindex="0"` e `role="region" aria-label="Tabela de comparação, role para os lados"`. Indicador "→ arraste" na primeira visita.
  - Linhas (nesta ordem, agrupadas com sub-cabeçalhos overline):
    - **CLASSIFICAÇÃO**: Classificação · Estratégia · Número de passos (**[R2]** número + notação compacta, ex.: "2 · Ác + (P·Ad)")
    - **ETAPAS**: Condicionamento · Primer · Adesivo
    - **COMPOSIÇÃO**: MDP · HEMA · Silano · Solvente
    - **USO**: Fotopolimerização
    - **PRODUTO**: Volume · Fabricante · Menor preço (link "ver preços")
  - Valores booleanos: ✓ "Sim" (`--color-best`) / — "Não" (`--gray-600`) / "Não informado" (itálico muted). **Sempre texto + ícone**, nunca só ícone.
  - Zebra: linhas pares `--gray-50`. Hover de linha (desktop): `--lilac-50`.
  - Toggle acima da tabela: "Destacar diferenças" — quando ligado, linhas com valores iguais em todas as colunas ficam recolhidas/esmaecidas e as diferentes ganham marcador `--magenta-600` à esquerda.
  - Divergência numa célula: ícone ⚠ âmbar + tooltip/expansão com as fontes.
- Mobile alternativo (< 640): mesma tabela com scroll horizontal (não converter em cards — a leitura lado a lado é o objetivo). Com 2 produtos, cabe sem scroll em 360px (132 + 2×114).

### 4.7 Comparador de preços (seção na página de produto, âncora `#precos`; também como bottom sheet a partir do botão do card)

- h2 "Comparar preços" + linha de identificação da apresentação comparada (o que garante que é a mesma coisa): chip "**FGM · Ambar · Frasco 4 mL · 1 un.**" + SKU se houver.
- Lista de **3 linhas de loja**, sempre na ordem de **preço crescente**; lojas indisponíveis vão ao final (ordem alfabética entre si).
- **Linha de loja** (cartão, raio `--radius-md`, borda `--color-border`, padding 16px):
  - Mobile: grade `[nome da loja / data] [preço]` + botão em linha inteira abaixo.
  - ≥768: uma linha só `[logo/nome] [data] [preço] [botão]`.
  - Nome da loja `--text-h3` ("Dental Cremer") — logotipo da loja só se houver autorização; padrão = texto.
  - Preço `--text-price` tabular, "R$ 00,00".
  - Caption muted: "Última atualização: DD/MM/AAAA".
  - Botão `cta` largura total (mobile): **"COMPRAR NA DENTAL CREMER"** + ícone ↗; `href` = URL da página do produto na loja; `target="_blank" rel="noopener sponsored"`; texto oculto "(abre o site da loja em nova aba)".
- **Menor preço**: linha com borda 2px `--color-best`, bg `--color-best-bg`, selo no topo-esquerdo sobreposto à borda: ícone troféu + "MENOR PREÇO" (pílula `--green-700` texto branco, `--text-caption` 700). Empate: todas as empatadas recebem o selo, **exceto** quando todas as lojas com preço comparável têm o mesmo valor. Nesse caso não há selo nem caixa de economia, e no lugar aparece a nota neutra "Mesmo preço nas lojas comparadas" (`--text-small` `--color-text-muted`, com ícone =). Com uma única loja com preço: sem selo e sem economia. `aria-label` da linha inclui "menor preço".
- **Economia** (abaixo da lista, só se houver ≥2 preços comparáveis e diferença > 0): caixa `--color-best-bg`: "Você economiza **R$ 00,00** em relação ao maior preço encontrado." (`--text-body`, valor 700 `--color-best`).
- **Loja sem preço** (`indisponível`): linha bg `--gray-50`, preço substituído por "Não encontrado / indisponível" (`--text-small` 600 `--gray-600`), sem botão de compra (ou botão `secondary` "Buscar na loja" — **não**: briefing exige link de produto; sem link, sem botão). Data da última consulta mantida.
- **Apresentações diferentes**: quando as lojas vendem apresentações não equivalentes (volume/qtde/SKU), **não exibir ranking, selo nem economia**. Mostrar caixa `--color-warn-bg`: título "Apresentações diferentes — comparação de preço não disponível." + lista por loja com a apresentação encontrada e o preço dessa apresentação **sem destaque**, ex.: "Dental Speed — Frasco 5 mL — R$ 00,00 [ver na loja]". Se só algumas lojas divergem: compara-se apenas as equivalentes; as divergentes aparecem num sub-bloco "Outras apresentações (não comparadas)".
- Rodapé da seção: "Preços coletados nas lojas na data indicada e podem ter mudado. Confirme no site da loja." · link "Como comparamos preços".
- Estados: loading = 3 linhas skeleton; erro = §2; 0 preços = caixa neutra "Nenhuma das três lojas tem este produto disponível no momento." com data.

### 4.8 Busca fixa
Ver §3.1. Está presente em **todas** as telas no header. Página `/busca?q=` lista resultados agrupados (Categorias primeiro como cards de subcategoria; depois Produtos). Contagem anunciada em `aria-live`: "8 resultados para ‘MDP’".

---

### 4.9 Guia rápido `/guia` (índice): coluna de estudo (06/10/2026)

Problema (cliente): no desktop a grade de 7 cartões em 3 colunas termina em ~1/3 da tela e o resto fica em branco. Solução: transformar a página num **painel de estudo** com os artigos no centro e três ferramentas de consulta rápida ao lado.

**Layout**

```
≥1024px (container 1200px; a 1920 continua 1200 centralizado)
┌──────────── 8/12 ─────────────┐ ┌──── 4/12 (sticky top: 88px) ────┐
│ PARA ESTUDAR / h1 / lead       │ │ ① POR ONDE COMEÇAR (trilha 1→7) │
│ ┌ card ┐ ┌ card ┐  (2 colunas) │ │                                  │
│ ┌ card ┐ ┌ card ┐              │ │ ② COLA DAS 7 CATEGORIAS (tabela) │
│ ┌ card ┐ ┌ card ┐              │ └──────────────────────────────────┘
│ ┌ card ┐                       │
│ ─────────────────────────────  │
│ ③ GLOSSÁRIO (2 colunas de dl)  │
└────────────────────────────────┘
640–1023px: uma coluna; ordem = h1 → ① trilha → cartões (2 col) → ② cola → ③ glossário
<640px:     uma coluna; mesma ordem; cartões em 1 col
```

- Grade: `grid-template-columns: minmax(0, 8fr) minmax(0, 4fr)`, gap `--space-10`. A coluna lateral é `<aside aria-label="Ferramentas de estudo">` com `position: sticky; top: 88px; align-self: start` e **só fica sticky se couber**: `max-height: calc(100vh - 104px); overflow-y: auto` com `overscroll-behavior: contain`. Ela começa alinhada ao topo da grade de cartões, não ao h1.
- Cartões de artigo: 2 colunas no main (`.guide` com `repeat(2, minmax(0,1fr))` a partir de 640px), sem mudar o componente.
- O glossário fica no main, abaixo dos cartões, porque é a parte mais longa e não faz sentido sticky.
- Cada bloco é uma seção com `h2` (`--text-h3` sans 600, não serif, porque são ferramentas e não conteúdo) + overline acima: "PARA COMEÇAR", "CONSULTA RÁPIDA", "TERMOS".
- Superfície dos blocos laterais: fundo `--color-surface-atlas`, borda 1px `--lilac-200`, raio `--radius-lg`, padding `--space-5`; gap entre blocos `--space-6`.

**① Por onde começar (trilha de leitura)**
- Lista ordenada `<ol>` de 7 itens, do básico à síntese. **A ordem é o campo `ordem` dos artigos**, em ordem crescente (decisão do Molar, ARQUITETURA §3.3; não existe `trilha.json`). Os cartões usam a mesma ordem. A Dentina renumera assim:
  1. Esmalte x dentina — "os dois substratos e por que se comportam diferente"
  2. Camada híbrida — "o que a adesão forma na dentina"
  3. Convencional x autocondicionante — "as duas estratégias de base"
  4. O que é adesivo universal? — "um frasco, várias estratégias"
  5. Condicionamento seletivo — "a técnica que combina as duas"
  6. O que é MDP? — "o monômero que aparece na composição"
  7. Como escolher a estratégia adesiva? — "a síntese, para decidir"
  (As frases curtas são de navegação, não afirmações científicas; se o artigo tiver `resumo`, a Pulpa pode usar a 1ª oração dele em vez da frase.)
- Item: número em círculo de 28px (serif 700 14px, `--magenta-600`, borda 1.5px), título 15px 600 (link sublinhado só no hover; o item inteiro é o alvo, mín. 44px de altura), frase em caption muted. Linha vertical 2px `--lilac-200` ligando os círculos (estilo da Modo de Uso, versão mini).
- Artigo ainda não publicado: item sem link, título `--gray-600`, selo "em preparação" (caption). **Não pula a numeração.**
- Sem estado "lido" na v1 (não há conta; `localStorage` só se for pedido depois).

**② Cola das 7 categorias**
- `<table>` real, `caption` visível "Cola das 7 categorias" como h2 do bloco, `--text-small`, sem zebra, linhas separadas por borda `--lilac-200`.
- **Colunas:** Subcategoria · Notação · Passos · Produtos. O **grupo vira linha-cabeçalho** (`<th scope="rowgroup" colspan="4">`, overline 11px com o marcador ●◆▲ e a cor `--grp-*-ink` sobre `--grp-*-tint`), em vez de coluna, para caber em 4/12 (~380px).
  - Subcategoria: link para a categoria (`rotulo` curto: "2 passos", "Seletivo"…), 14px 600.
  - Notação: componente `<Notacao>` (o mesmo do diagrama), `nowrap`.
  - Passos: número de aplicações = `sequencia.length` da taxonomia (conv. 3→3, conv. 2→2, auto 2→2, auto 1→1, univ. seletivo/total→2, univ. autocond.→1), tabular, alinhado à direita.
  - Produtos: nº de produtos **publicados** naquela subcategoria (mesma contagem da Home), tabular, à direita; 0 aparece como "—" em `--gray-600` com `aria-label="nenhum produto"`.
- **Linha inteira clicável**: o link está na célula Subcategoria e um `::after` absoluto cobre a linha (`tr { position: relative }`). Hover: fundo `--lilac-100`. Foco visível no link (o anel envolve a linha via `:focus-within` → `outline` no `tr`).
- Rodapé da tabela (caption muted): a legenda da notação (`<LegendaNotacao>`), uma vez só.
- Tudo vem da taxonomia + `categorias.json` + contagem do catálogo. **Nada digitado à mão.**

**③ Glossário**: só em `/guia`, abaixo dos cartões (decisão do Molar, ARQUITETURA §3.3; **não existe `/guia/glossario`**)
Contrato: `glossario.json` = `{ fontes[], termos[{ id, termo, sigla?, nomeCompleto?, sinonimos[], definicao, fontes[ids], artigos[slugs], relacionados[ids] }], revisao }`, lido com `catalogo().glossario["sistemas-adesivos"]`. A ordem alfabética é da UI. Conteúdo: Dentina (~20 termos). **URL canônica de um termo: `/guia#termo-{id}`.** Artigos ("Veja também"), busca e termos relacionados apontam para ela. Os ids existem uma única vez na página.

- Cabeçalho do bloco: overline "TERMOS", h2 "Glossário", contagem caption ("20 termos").
- **Barra de navegação do glossário** (abaixo do h2): input "Filtrar termos" (44px, `type="search"`, largura máx. 320px) + **índice A–Z** em chips de 32×32px (13px 700, só as letras com termos, cada um levando à âncora `#letra-{x}`). Abaixo de 640px, os chips ficam numa linha com scroll horizontal (`overflow-x: auto`, `scroll-snap`). O filtro busca em termo, sigla e sinônimo, sem distinguir acento ou caixa; quando vazio mostra "Nenhum termo para “x”."; `aria-live="polite"` anuncia "n termos". Não é sticky (o header já é).
- **Lista**: agrupada por letra. O separador tem `id="letra-{x}"`, letra em serif 24px 700 `--purple-900` + filete `--lilac-200`. Os termos de cada letra ficam numa grade de **2 colunas a partir de 1024px** (`minmax(0,1fr)`, gap 24px) e 1 coluna abaixo. Cada termo é um `<article id="termo-{id}">` com `scroll-margin-top: 96px` (header sticky):
  - Título h3: sigla + termo ("MDP — 10‑metacriloiloxidecil di‑hidrogenofosfato", ou só o termo), 16px 700.
  - Sinônimos: caption muted "Também: lama dentinária, smear layer".
  - Definição: `--text-small` `--color-text`, 1–2 frases.
  - "Relacionados:" chips-link (28px, 13px) para outros termos (`relacionados` → `#termo-{id}`).
  - Rodapé: `<SourceLink>` compacto (Autor Ano, DOI ↗) + "Leia mais: <título do artigo> →" por artigo (link sublinhado).
  - `:target`: fundo `--lilac-100` que some em 1,5s (sem animação em reduced-motion); com filtro ativo, o termo-alvo nunca é escondido.
- Sem dado (ou só rascunho em produção): o bloco não aparece.

**Acessibilidade:** ordem do DOM = ordem mobile (h1 → trilha → cartões → cola → glossário). No desktop, `grid-template-areas` põe cartões e glossário no main e trilha e cola no aside. O leitor de tela lê trilha → cartões → cola → glossário, o que é aceitável porque a trilha funciona como introdução. `aside` com `aria-label`, tabela com `caption`, um h2 por bloco.

**Larguras de aceite:** 320, 390, 768, 1280, 1920. Sem scroll horizontal, a tabela da cola cabe sem rolagem a partir de 320px (Notação `nowrap`; a 320 as colunas somam ~290px: Subcategoria 90 · Notação 90 · Passos 44 · Produtos 56) e a lateral não ultrapassa a altura da viewport sem rolar internamente.

## 5. Acessibilidade (checklist de aceite)

- Contraste AA verificado em todos os pares da §1 (texto ≥ 4.5:1, UI/ícones ≥ 3:1).
- Foco visível em 100% dos interativos (`:focus-visible`, anel `--color-focus` 2px + offset 2px). Proibido `outline: none` sem substituto.
- Ordem de tabulação = ordem visual. "Pular para o conteúdo" como primeiro elemento focável.
- Landmarks: `header`, `nav`, `main`, `footer`; um único `h1` por página; hierarquia de headings sem saltos.
- Imagens de frasco com `alt` descritivo; ícones decorativos `aria-hidden="true"`; botões só-ícone com `aria-label`.
- Cor nunca sozinha: grupos têm rótulo + marcador; menor preço tem texto "MENOR PREÇO"; booleanos têm "Sim/Não".
- Diagramas: `figcaption` textual completo; blocos e setas `aria-hidden`.
- Zoom 200% sem perda de conteúdo; layout funciona a 320px de largura sem scroll horizontal (exceto tabela de comparação, que tem região rolável própria e focável).
- `prefers-reduced-motion` respeitado.
- `lang="pt-BR"`; datas em DD/MM/AAAA; moeda via `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`.
- Links externos sinalizados (ícone ↗ + texto oculto).
- Links dentro de texto corrido são sempre **sublinhados** (WCAG 1.4.1: a cor não pode ser o único sinal). Links que são componentes (cards, botões, abas, itens de navegação) não precisam de sublinhado.

---

## 6. PWA / mobile

- `theme_color: #5E2280` · `background_color: #FFFFFF` · `display: standalone` · nome curto "Adesivos".
- Ícone: monograma "SA" serif branco sobre `--purple-700`, com versão maskable (área segura 80%).
- Safe areas: `padding-bottom: env(safe-area-inset-bottom)` na `<CompareTray>` e barra sticky de ação.
- Banner "Adicionar à tela inicial": discreto, no rodapé da Home após a 2ª visita, dispensável, nunca modal.
- Offline: páginas já visitadas disponíveis; preços mostram aviso "Você está offline — preços de DD/MM/AAAA podem estar desatualizados" (caixa warn).

---

## 7. Entregáveis e próximos passos

- [x] Tokens, estados, componentes e telas (este arquivo).
- [x] Protótipo HTML estático: `docs/prototipo/` — `index.html` (Home), `categoria.html` (Convencional 2 passos), `produto.html` (produto + Modo de Uso + preços), `universal.html` (produto universal com seletor de estratégia + preços com apresentações diferentes/indisponível), `comparar.html` (tabela). `tokens.css` contém os tokens da §1 prontos para copiar.
- [x] Referências reunidas em `docs/referencia/` e incorporadas (§8).
- [ ] Revisão de implementação do Frontend contra esta spec (Esmalte).

---

## 8. Revisão 2: o que mudou com as referências (06/10/2026)

Fontes e análise: `docs/referencia/README.md`. As referências **confirmaram** a estrutura: blocos com faixa de título sólida, classificação em caixa-alta, produtos agrupados por subcategoria e Modo de Uso em etapas numeradas com seta. A paleta (roxo/magenta/lilás) **não muda**; as referências usam azul-marinho/amarelo, mas o briefing fixa a paleta. Mudanças:

| # | Mudança | Onde | Motivo (referência) |
|---|---|---|---|
| R2.1 | Contador "frasco N" → **"passo N"**; textos sem "frasco" para ácido e tudo-em-um | §3.7 | Passos ≠ frascos (Silva e Souza Jr. Fig. 9; Unichristus p. 18) |
| R2.2 | **Notação compacta** `Ác + (P·Ad)` + legenda | §3.7, §4.1 card de subcategoria, §4.6 linha "Número de passos" | Perdigão p. 5 |
| R2.3 | **Etapa ausente riscada** nos autocondicionantes / universal autocond. | §3.7 | Perdigão p. 5 (seringa riscada); Unichristus p. 26 vs p. 18 |
| R2.4 | **Pictograma de substrato** esmalte/dentina | §3.7, §4.4, §4.5 | Unichristus p. 35; Perdigão p. 6 |
| R2.5 | Etapa opcional tracejada "Condicionamento seletivo do esmalte" (condicionada a fonte) | §3.7 | Unichristus p. 26 |
| R2.6 | No comparador, a linha "Número de passos" mostra o número **e** a notação ("2 · `Ác + (P·Ad)`") | §4.6 | Perdigão p. 5 |

Fora do escopo v1, registrado para depois: corte de dentina animado por etapa (lama dentinária → fibras colágenas → camada híbrida, Unichristus p. 18/26) como modo "Estudar" do diagrama; caixa "Por que essa etapa?" no Modo de Uso (Unichristus p. 20).
