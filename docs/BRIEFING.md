# Briefing — Plataforma de Sistemas Adesivos

> Fonte única da especificação do produto. Todo o time lê este arquivo antes de começar.

## Contexto de execução
- Repositório: `/Users/henriquepett/Downloads/pessoal/temp/sistemas-adesivos` (git, branch `main`).
- Deploy: **Vercel**. Tudo deve rodar em Vercel sem servidor próprio (Next.js App Router recomendado).
- PWA instalável ("Adicionar à tela inicial"): manifest, ícones, service worker.
- Idioma da interface: português do Brasil.
- **A imagem de referência citada no briefing ainda NÃO foi enviada.** Usar a descrição textual abaixo; quando a imagem chegar, ela ficará em `docs/referencia/`.

## Regras inegociáveis de dados (correção científica)
- CLASSIFICAÇÃO → literatura científica / fabricante
- MODO DE USO → IFU (instruções de uso) oficial do fabricante, por produto. Nunca copiar protocolo de outro produto da mesma categoria.
- COMPOSIÇÃO → fabricante / documentação técnica (só componentes confirmados)
- PREÇO → loja no momento da consulta, com data "Última atualização: DD/MM/AAAA"
- LINK de compra → página específica do produto na loja (nunca a home da loja)
- Toda informação deve ter **fonte registrada** (URL + data de acesso).
- Divergência entre fontes → sinalizar a divergência, não escolher nem inventar.
- Preço não encontrado → "Não encontrado / indisponível". **Nunca inventar preço.**
- Comparação de preço só entre **mesmo fabricante + mesmo nome comercial + mesma apresentação + mesmo volume + mesma quantidade (+ mesmo SKU se possível)**. Senão: "Apresentações diferentes — comparação de preço não disponível."
- Lojas: Dental Cremer, Dental Speed, Dental Med Sul.

---

## Prompt original do cliente (íntegra)

PROMPT DEFINITIVO — SITE DE SISTEMAS ADESIVOS

Crie uma plataforma web responsiva e mobile (pwa, com opção de adicionar a pagina inicial), voltada para estudantes de Odontologia e cirurgiões-dentistas, utilizando como referência visual e estrutural a imagem fornecida pelo usuário, que apresenta a classificação dos sistemas adesivos odontológicos.

A plataforma deve transformar essa tabela estática em uma ferramenta interativa de consulta, estudo, comparação de produtos e comparação de preços.

### 1. ESTRUTURA PRINCIPAL
A página inicial deve apresentar uma grande classificação: SISTEMAS ADESIVOS, dividida em três grandes grupos:
- CONVENCIONAIS: 2 PASSOS, 3 PASSOS
- AUTOCONDICIONANTES: 1 PASSO, 2 PASSOS
- UNIVERSAIS: CONDICIONAMENTO SELETIVO, CONDICIONAMENTO TOTAL, AUTOCONDICIONANTE

Organização visual: grupo → subcategoria → representação visual → produtos → informações → interação.

### 2. NÃO COPIAR A IMAGEM COMO UMA TABELA ESTÁTICA
A imagem serve apenas como referência de organização visual e classificação. Cada coluna vira um botão/card interativo. Ex.: CONVENCIONAIS → [2 PASSOS] [3 PASSOS]. Ao clicar em CONVENCIONAIS → 2 PASSOS, abrir nova página com todos os produtos comerciais cadastrados nessa categoria.

### 3. REPRESENTAÇÃO VISUAL DE CADA SISTEMA
No topo de cada categoria, representação gráfica. Ex.: CONVENCIONAL — 2 PASSOS: Ácido + Primer/Adesivo ↓. Abaixo, explicação curta: "Sistema de condicionamento ácido prévio, seguido da aplicação de primer e adesivo, conforme a composição e protocolo específico do produto." Depois: PRODUTOS DISPONÍVEIS.

### 4. CATÁLOGO DE PRODUTOS
Cards com: imagem real do frasco; nome comercial; fabricante; apresentação; volume; categoria; estratégia adesiva; principais componentes; botão VER PRODUTO; botão COMPARAR PREÇOS.
Ex.: [FOTO] Ambar · FGM · Convencional • 2 passos · 4 mL · VER PRODUTO · COMPARAR PREÇOS

### 5. AO CLICAR NO PRODUTO
Página detalhada. Ex.: AMBAR — FGM; imagem grande do frasco; CLASSIFICAÇÃO (Convencional — 2 passos); ESTRATÉGIA ADESIVA (Condicionamento ácido + aplicação de adesivo); APRESENTAÇÃO (4 mL); COMPOSIÇÃO (componentes tecnicamente confirmados); INDICAÇÕES (conforme documentação oficial).

### 6. MODO DE USO
Seção extremamente visual, protocolo em etapas numeradas. Ex.: 01 Condicionamento (tempo e substrato conforme IFU) ↓ 02 Lavagem ↓ 03 Controle da umidade ↓ 04 Aplicação do adesivo ↓ 05 Evaporação do solvente ↓ 06 Fotopolimerização.
Cada produto possui seu próprio protocolo.
REGRA FUNDAMENTAL: não copiar automaticamente o protocolo de outro produto da mesma categoria. Diferenças possíveis: tempo; número de camadas; tempo de fricção; necessidade de nova aplicação; evaporação do solvente; fotopolimerização. Protocolo baseado prioritariamente na IFU oficial do fabricante.

### 7. UNIVERSAIS
Três caminhos: CONDICIONAMENTO SELETIVO (Ácido → adesivo universal); CONDICIONAMENTO TOTAL (Ácido → adesivo universal); AUTOCONDICIONANTE (adesivo universal sem condicionamento ácido separado). Ao clicar, mostrar produtos com indicação oficial para aquela estratégia.

### 8. FILTRO ESPECIAL PARA UNIVERSAIS
Um mesmo produto universal pode aparecer em mais de uma estratégia (☑ seletivo ☑ total ☑ autocondicionante). Deixar claro que são estratégias de uso do mesmo adesivo, não três produtos diferentes.

### 9. AUTOCONDICIONANTES
1 PASSO: Ácido + Primer + Adesivo em um único produto/componente, conforme classificação técnica. 2 PASSOS: Primer → Adesivo. Depois os produtos comerciais.

### 10. CONVENCIONAIS
2 PASSOS: ÁCIDO → PRIMER + ADESIVO → PRODUTOS. 3 PASSOS: ÁCIDO → PRIMER → ADESIVO → PRODUTOS.

### 11. COMPARAÇÃO ENTRE SISTEMAS
Botão COMPARAR. Usuário seleciona ex.: Adper Single Bond 2 × Ambar × Prime&Bond 2.1 e vê tabela com: Classificação, Estratégia, Número de passos, Condicionamento, Primer, Adesivo, MDP, HEMA, Silano, Solvente, Fotopolimerização, Volume, Fabricante.

### 12. COMPARAÇÃO DE PREÇOS (uma das funções mais importantes)
Dentro de cada produto: COMPARAR PREÇOS → DENTAL CREMER R$ XX,XX [COMPRAR]; DENTAL SPEED R$ XX,XX [COMPRAR]; DENTAL MED SUL R$ XX,XX [COMPRAR]. Destacar 🏆 MENOR PREÇO. Mostrar "Você economiza R$ XX,XX em relação ao maior preço encontrado."

### 13. REGRA PARA COMPARAÇÃO DE PREÇOS
Nunca comparar produtos ou apresentações diferentes (❌ Single Bond Universal 3 mL × 5 mL). Verificar: mesmo fabricante; mesmo nome comercial; mesma apresentação; mesmo volume; mesma quantidade; mesmo SKU quando possível. Se diferente: "Apresentações diferentes — comparação de preço não disponível."

### 14. PRODUTO SEM PREÇO EM UMA DENTAL
Não inventar. Mostrar "Não encontrado / indisponível" e continuar mostrando as outras lojas.

### 15. DATA DO PREÇO
Cada preço com "Última atualização: DD/MM/AAAA". Futuramente, atualização automática.

### 16. BOTÃO COMPRAR
"COMPRAR NA DENTAL CREMER" leva direto à página daquele produto na loja (idem Dental Speed, Dental Med Sul). Nunca para a home da loja.

### 17. PESQUISA
Barra fixa "🔎 Pesquisar sistema, marca ou produto". Buscas como "Ambar", "Single Bond", "MDP", "Universal", "2 passos", "Kuraray" etc.

### 18. VISUAL
Imagem enviada como referência estética. Manter: estrutura em blocos; classificação muito evidente; títulos grandes; separação clara das categorias; imagens dos frascos; aparência acadêmica; visual limpo. Modernizar para plataforma digital.
Paleta: roxo/magenta; lilás; branco; cinza muito claro; preto para textos.
Resultado: mistura de atlas odontológico + aplicativo de consulta + catálogo de produtos.

### 19. DIFERENCIAL — "COMO IDENTIFICAR?"
Em cada categoria, mostrar visualmente: 2 PASSOS (Ácido ↓ Primer + Adesivo); 3 PASSOS (Ácido ↓ Primer ↓ Adesivo); AUTOCONDICIONANTE 2 PASSOS (Primer autocondicionante ↓ Adesivo); UNIVERSAL (Condicionamento seletivo OU total OU autocondicionante). Funciona como ferramenta de estudo.

### 20. CORREÇÃO CIENTÍFICA
A imagem é só referência visual; não reproduzir automaticamente textos, tempos e protocolos dela. Classificação → literatura/fabricante; Modo de uso → IFU; Composição → fabricante/documentação técnica; Preço → loja no momento da consulta; Link → página específica do produto. Divergência entre fontes → sinalizar, não inventar.

### 21. ESTRUTURA FINAL DA HOME
SISTEMAS ADESIVOS
- CONVENCIONAIS [2 PASSOS] [3 PASSOS]
- AUTOCONDICIONANTES [1 PASSO] [2 PASSOS]
- UNIVERSAIS [COND. SELETIVO] [COND. TOTAL] [AUTOCOND.]
- 🔎 PESQUISAR PRODUTO
- ⭐ PRODUTOS MAIS CONSULTADOS (cards)
- 💰 MELHORES PREÇOS (produtos com maior diferença de preço entre as três dentais)
- 📚 GUIA RÁPIDO: Como escolher a estratégia adesiva? · Convencional x autocondicionante · O que é adesivo universal? · O que é MDP? · Esmalte x dentina · Condicionamento seletivo · Camada híbrida

### 22. OBJETIVO FINAL
Sensação de consultar uma versão digital, interativa e muito mais completa da tabela. Em poucos cliques:
- Sistemas Adesivos → Convencionais → 2 passos → produto → ver frasco → estudar modo de uso → comparar preços → clicar na dental → comprar.
- Sistemas Adesivos → Universais → Condicionamento seletivo → produtos compatíveis → comparar produtos → comparar preços.

Arquitetura escalável desde o início para receber outros materiais odontológicos no futuro; a v1 é exclusivamente sobre SISTEMAS ADESIVOS.
