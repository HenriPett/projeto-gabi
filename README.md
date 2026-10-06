# Sistemas Adesivos

Plataforma (PWA) de consulta, estudo e comparação de preços de sistemas adesivos odontológicos.

- Produto: [docs/BRIEFING.md](docs/BRIEFING.md)
- Arquitetura e modelo de dados: [docs/ARQUITETURA.md](docs/ARQUITETURA.md)

```bash
nvm use            # Node 24
pnpm install
pnpm dev           # http://localhost:3000
pnpm check         # lint + typecheck + testes + validação de dados
DADOS_DIR=tests/fixtures/dados pnpm dev   # roda com o catálogo fictício de teste
```
