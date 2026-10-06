/**
 * pnpm icons — gera os ícones do PWA a partir de assets/icon.svg.
 * Rodar só quando o SVG mudar; a saída é commitada (o build não depende deste script).
 * sharp vem como dependência do next; não adicionamos outra cópia.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));

const svg = "assets/icon.svg";
const saidas = [
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-maskable-512.png", 512],
  ["src/app/apple-icon.png", 180],
];

mkdirSync("public/icons", { recursive: true });
for (const [arquivo, tamanho] of saidas) {
  await sharp(svg, { density: 300 }).resize(tamanho, tamanho).png({ compressionLevel: 9 }).toFile(arquivo);
  console.log(`✓ ${arquivo} (${tamanho}px)`);
}
