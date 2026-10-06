/**
 * Gera public/version.json no início do `pnpm build` (o site é 100% SSG: não há
 * /api/health). Diz qual build está no ar e quão recentes são os preços.
 *   curl https://<site>/version.json
 * Arquivo gerado: não versionar (.gitignore).
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const raiz = path.resolve(process.env.DADOS_DIR ?? "data", "materiais");
let precosAtualizadosEm = null;
let ofertas = 0;
if (existsSync(raiz)) {
  for (const material of readdirSync(raiz)) {
    const dir = path.join(raiz, material, "ofertas");
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      for (const o of JSON.parse(readFileSync(path.join(dir, f), "utf8")).ofertas ?? []) {
        ofertas++;
        if (!precosAtualizadosEm || o.consultadoEm > precosAtualizadosEm) precosAtualizadosEm = o.consultadoEm;
      }
    }
  }
}

const versao = {
  status: "ok",
  commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  ambiente: process.env.VERCEL_ENV ?? "local",
  geradoEm: new Date().toISOString(),
  ofertas,
  precosAtualizadosEm,
};
writeFileSync("public/version.json", JSON.stringify(versao, null, 2) + "\n");
console.log(`✓ public/version.json (${versao.ambiente}, ${versao.commit?.slice(0, 7) ?? "sem commit"})`);
