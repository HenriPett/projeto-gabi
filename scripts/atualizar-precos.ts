/**
 * pnpm precos:atualizar — revisita a página de cada oferta cadastrada e atualiza
 * preço/disponibilidade + consultadoEm. Usado pela Action .github/workflows/precos.yml,
 * que abre um PR só com data/materiais/*\/ofertas/ para revisão humana.
 *
 * - Só toca ofertas com url (status nao-encontrado é decisão de curadoria).
 * - Falha/ambiguidade → oferta fica COMO ESTAVA (data antiga continua honesta) e vai no relatório.
 * - Respeita robots.txt e espera entre requisições à mesma loja.
 * - Relatório em Markdown em $RELATORIO_PRECOS (padrão: stdout).
 *
 * Opções (env): DADOS_DIR, PRECOS_SO=<produtoId,...>, PRECOS_INTERVALO_MS (padrão 3000).
 */
import fs from "node:fs";
import path from "node:path";
import { OfertasDoProduto } from "../src/lib/esquema";
import { extrairPreco, permitidoPorRobots } from "./precos/extrair";

const AGENTE = "SistemasAdesivosBot/1.0 (+https://github.com/; atualizacao semanal de precos)";
const INTERVALO = Number(process.env.PRECOS_INTERVALO_MS ?? 3000);
const VARIACAO_ALERTA = 0.3;
const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const so = process.env.PRECOS_SO?.split(",").map((s) => s.trim()).filter(Boolean);

const brl = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

const robotsCache = new Map<string, string>();
const ultimoAcesso = new Map<string, number>();

async function baixar(url: string): Promise<{ status: number; corpo: string }> {
  const host = new URL(url).host;
  const espera = (ultimoAcesso.get(host) ?? 0) + INTERVALO - Date.now();
  if (espera > 0) await esperar(espera);
  ultimoAcesso.set(host, Date.now());
  const resp = await fetch(url, {
    headers: { "User-Agent": AGENTE, "Accept-Language": "pt-BR" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  return { status: resp.status, corpo: await resp.text() };
}

async function robotsPermite(url: string) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    try {
      const r = await baixar(`${u.origin}/robots.txt`);
      robotsCache.set(u.origin, r.status === 200 ? r.corpo : "");
    } catch {
      robotsCache.set(u.origin, "");
    }
  }
  return permitidoPorRobots(robotsCache.get(u.origin)!, u.pathname + u.search);
}

const linhas = { mudou: [] as string[], igual: 0, falhas: [] as string[], alertas: [] as string[] };

async function main() {
  const raiz = path.resolve(process.env.DADOS_DIR ?? "data", "materiais");
  const arquivos = fs
    .readdirSync(raiz)
    .flatMap((m) => {
      const dir = path.join(raiz, m, "ofertas");
      return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f)) : [];
    })
    .sort();

  let invalidos = 0;
  for (const arquivo of arquivos) {
    const bruto = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    if (so && !so.includes(bruto.produtoId)) continue;
    let alterado = false;

    for (const oferta of bruto.ofertas ?? []) {
      if (!oferta.url || oferta.status === "nao-encontrado") continue;
      const rotulo = `\`${bruto.produtoId}\` · ${oferta.lojaId} · ${oferta.apresentacaoId}`;
      const falha = (motivo: string) => linhas.falhas.push(`- ${rotulo}: ${motivo} — [página](${oferta.url})`);
      try {
        if (!(await robotsPermite(oferta.url))) {
          falha("bloqueado pelo robots.txt da loja (não consultado)");
          continue;
        }
        const { status, corpo } = await baixar(oferta.url);
        if (status !== 200) {
          falha(`HTTP ${status}`);
          continue;
        }
        const r = extrairPreco(corpo, oferta.skuLoja);
        if (!r.ok) {
          falha(r.erro);
          continue;
        }
        const antes = (oferta.precos ?? []).find((p: { tipo: string }) => p.tipo === "padrao")?.centavos as number | undefined;
        const statusAntes = oferta.status;
        if (r.disponivel) {
          oferta.status = "disponivel";
          // Pix/boleto não vêm no JSON-LD: removidos para não exibir valor velho com data nova.
          const tinhaOutros = (oferta.precos ?? []).some((p: { tipo: string }) => p.tipo !== "padrao");
          oferta.precos = [{ tipo: "padrao", centavos: r.centavos }];
          if (tinhaOutros) linhas.alertas.push(`- ${rotulo}: preços Pix/boleto removidos (reconferir manualmente)`);
        } else {
          oferta.status = "indisponivel";
          oferta.precos = [];
        }
        oferta.consultadoEm = hoje;
        alterado = true;

        const depois = r.disponivel ? r.centavos : undefined;
        if (statusAntes !== oferta.status || antes !== depois) {
          linhas.mudou.push(
            `| ${rotulo} | ${statusAntes}${antes ? ` ${brl(antes)}` : ""} | ${oferta.status}${depois ? ` ${brl(depois)}` : ""} |`,
          );
          if (antes && depois && Math.abs(depois - antes) / antes > VARIACAO_ALERTA)
            linhas.alertas.push(`- ⚠️ ${rotulo}: variação de ${Math.round(((depois - antes) / antes) * 100)}% — conferir apresentação/volume na página`);
        } else linhas.igual++;
      } catch (e) {
        falha(`erro de rede: ${(e as Error).message}`);
      }
    }

    if (!alterado) continue;
    const valido = OfertasDoProduto.safeParse(bruto);
    if (!valido.success) {
      invalidos++;
      linhas.falhas.push(`- \`${path.relative(process.cwd(), arquivo)}\`: resultado inválido no esquema, NÃO gravado — ${valido.error.issues[0]?.message}`);
      continue;
    }
    fs.writeFileSync(arquivo, JSON.stringify(bruto, null, 2) + "\n");
  }

  const md = [
    `## Atualização automática de preços — ${hoje.split("-").reverse().join("/")}`,
    "",
    "Gerado por `pnpm precos:atualizar` a partir do JSON-LD das páginas de produto. **Revise antes do merge**: a ferramenta não decide equivalência de apresentação.",
    "",
    `- Ofertas com preço/status alterado: **${linhas.mudou.length}**`,
    `- Reconsultadas sem mudança (só data atualizada): **${linhas.igual}**`,
    `- Não atualizadas (mantidas com a data antiga): **${linhas.falhas.length}**`,
    "",
    ...(linhas.mudou.length ? ["### Mudanças", "", "| Oferta | Antes | Depois |", "|---|---|---|", ...linhas.mudou, ""] : []),
    ...(linhas.alertas.length ? ["### Conferir", "", ...linhas.alertas, ""] : []),
    ...(linhas.falhas.length ? ["### Não atualizadas", "", ...linhas.falhas, ""] : []),
  ].join("\n");

  if (process.env.RELATORIO_PRECOS) fs.writeFileSync(process.env.RELATORIO_PRECOS, md);
  else console.log(md);
  if (invalidos) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
