# Referências visuais — classificação dos sistemas adesivos

> O cliente não vai enviar a imagem de referência. Estas referências foram reunidas pelo time (Esmalte, Product Designer) em 06/10/2026.
>
> **Uso interno apenas.** Estas imagens servem de referência de *estrutura e linguagem visual*. Elas **não** vão para o site (nem para `public/`) e **não** são fonte de dados: tempos, protocolos, composições e nomes de produto vêm da IFU e da documentação do fabricante (BRIEFING §20). Algumas têm direitos reservados; o material da Unichristus, por exemplo, traz "todos os direitos reservados".
>
> Os PDFs originais não foram versionados. Para consultar, baixe pela URL de cada item.

## Índice

| # | Arquivo | Origem | Licença |
|---|---|---|---|
| 1 | `unichristus-p01-capa.png` | Fontenele GAA, Neri JR, Moura MEM, Bastos MC. *Manual prático de sistemas adesivos*. Fortaleza: Centro Universitário Christus; 2022, p. 1. <https://www.unichristus.edu.br/wp-content/uploads/2023/03/MANUALSISTEMASADESIVOS.pdf> | Todos os direitos reservados |
| 2 | `unichristus-p18-convencionais-2-3-passos.png` | Idem, p. 18 | idem |
| 3 | `unichristus-p19-apresentacao-comercial.png` | Idem, p. 19 | idem |
| 4 | `unichristus-p20-modo-de-uso-conv-3-passos.png` | Idem, p. 20 | idem |
| 5 | `unichristus-p26-autocondicionantes-1-2-passos.png` | Idem, p. 26 | idem |
| 6 | `unichristus-p35-universal-tecnicas.png` | Idem, p. 35 | idem |
| 7 | `perdigao-2022-p05-estrategias-adesao.png` | Perdigão J. *New Dental Adhesives — How Universal are They* (handout, Univ. of Iowa College of Dentistry, 10/06/2022), p. 5. <https://dentistry.uiowa.edu/sites/dentistry.uiowa.edu/files/2022-06/Perdigao-Adhesion-June%2010-Iowa-handout.pdf> | Material de aula; sem licença declarada |
| 8 | `perdigao-2022-p06-condicionamento-seletivo.png` | Idem, p. 6 | idem |
| 9 | `silva-souza-2010-fig1-convencionais.png` | Silva e Souza Jr. MH, Carneiro KGK, Lobato MF, Silva e Souza PAR, Góes MF. Adhesive systems: important aspects related to their composition and clinical use. *J Appl Oral Sci* 2010;18(3):207-14, Figura 1. <https://pmc.ncbi.nlm.nih.gov/articles/PMC5349047/> (tabela HTML renderizada por nós) | CC BY |
| 10 | `silva-souza-2010-fig9-autocondicionantes.png` | Idem, Figura 9 | CC BY |

Buscas que **não** renderam imagem útil: Dental Cremer blog (403), ResearchGate (403), BISCO "bonding generations" (só texto), RSD Journal 19206, RBO/ABORJ 746 e Eugenol "Understanding adhesive dentistry" (PDFs só com texto ou micrografias).

## O que aproveitar de cada uma

### 1 · Capa da Unichristus
- **Estrutura em blocos:** faixas cheias de cor sólida (azul-marinho e amarelo) com título em caixa-alta. É a mesma ideia do nosso cabeçalho de grupo (`.grp__head`). Isso confirma que é a linguagem de "material didático" que o público reconhece.
- O frasco estilizado como ícone de marca valida o monograma ou a silhueta de frasco como assinatura.

### 2 · Convencionais 2 e 3 passos (p. 18), **referência principal**
- **Diagrama Ácido/Primer/Adesivo:** etapas numeradas em círculo ①②③, com o nome da etapa manuscrito e um corte de dentina mostrando o efeito de cada passo: lama dentinária → condicionamento → fibras colágenas expostas → primer → adesivo.
- **Hierarquia:** o título da categoria em caixa-alta grande ("CONVENCIONAL DE 3 PASSOS") vem ao lado dos frascos da categoria. O frasco funciona como "assinatura" visual da subcategoria.
- **Atenção:** o kit de 3 passos aparece com **2 frascos** (primer, adesivo), e o ácido vem em seringa à parte. **Número de passos ≠ número de frascos.**

### 3 · Apresentação comercial (p. 19)
- Produtos agrupados por subcategoria dentro de uma **caixa tracejada com etiqueta escura** ("CONVENCIONAL DE 2 PASSOS"). Foto do frasco + nome + fabricante. Valida a nossa seção "Produtos disponíveis".
- **Não confiar nos dados:** a página tem erros de fabricante e de grafia ("3M ESPRE", "Prime &Bon"). Isso mostra na prática por que dados vêm só do fabricante (BRIEFING §20).

### 4 · Modo de uso, convencional 3 passos (p. 20)
- **Etapas numeradas** com ilustração + legenda curta + seta para a próxima. Caixas amarelas de "Você sabia?" com ícone de lâmpada para perguntas didáticas, como "Devo utilizar o jato de ar para secar a cavidade?". Inspira um bloco opcional "Por que essa etapa?" no Modo de Uso (v1.1).

### 5 · Autocondicionantes 1 e 2 passos (p. 26)
- O mesmo corte de dentina, **sem a etapa de ácido**, deixa clara a diferença para o convencional por contraste com a p. 18.
- **"PRIMER + ADESIVO" em um único rótulo** para 1 passo, a mesma convenção do nosso bloco combinado `step--pa`.
- A caixa didática informa que o condicionamento seletivo do esmalte também pode ser feito em autocondicionantes. A spec passa a prever isso como **etapa opcional tracejada**, e o conteúdo final deve ser validado pela fonte.

### 6 · Universal, três técnicas (p. 35)
- **Cada técnica numa caixa com etiqueta escura** e o protocolo em etapas ①②③ horizontais. Confirma o nosso seletor: o mesmo frasco aparece repetido em todas as técnicas.
- No seletivo, a ilustração destaca o ácido **só na margem de esmalte**. A diferença seletivo × total é **de substrato** e precisa de um pictograma de dente.

### 7 · Perdigão, estratégias de adesão (p. 5), **referência principal**
- **Tabela-síntese** Etch-and-rinse × Self-etch, com linhas por número de passos e uma notação compacta: `A + Pr + B` (3 passos), `A + (PrB)` (2 passos), `Pr + B`, `(PrB)`. **Parênteses = mesmo frasco.** É a forma mais curta de "como identificar", e vamos adotá-la em português.
- **Self-etch = seringa de ácido riscada com X vermelho.** Mostrar a etapa ausente, riscada, ensina por contraste.
- Frascos genéricos rotulados por função (Pr, B) em vez de marcas, para estudar sem viés comercial.

### 8 · Perdigão, condicionamento seletivo (p. 6)
- Ilustração de dentes com o ácido (azul) só no esmalte = "Selective enamel etch". Base para o pictograma de substrato dos universais.

### 9 e 10 · Silva e Souza Jr. et al. 2010, Figuras 1 e 9 (CC BY)
- Classificação acadêmica em tabela: número de passos × estratégia.
- **Fig. 9 traz um caso que a spec não cobria:** autocondicionante de **1 passo com pré-mistura (2 frascos)**. São dois frascos misturados e aplicados uma vez. Mais uma prova de que o contador do diagrama deve ser de **passos (aplicações)**, não de frascos.

## Decisões de design derivadas (aplicadas no DESIGN.md, "Revisão 2")
1. Contador do diagrama: "frasco N" → **"passo N"**. Linha opcional "Kit:" descreve frascos e seringa sem confundir com passos.
2. **Notação compacta** em português (`Ác + P + Ad`, `Ác + (P·Ad)`, `P + Ad`, `(Ác·P·Ad)`), com parênteses = mesmo frasco, nos cards de subcategoria, nos selos e no comparador.
3. **Etapa ausente riscada** ("Ácido fosfórico — não usa") nos autocondicionantes e no universal autocondicionante.
4. **Pictograma de substrato** (esmalte/dentina) nos três caminhos do universal.
5. Etapa opcional tracejada "Condicionamento seletivo do esmalte (opcional)" nos autocondicionantes, **somente se a fonte do conteúdo confirmar**.
