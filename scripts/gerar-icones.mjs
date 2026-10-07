/**
 * pnpm icons — gera os ícones da marca Adesivologia a partir de assets/*.svg (DESIGN.md §0.1).
 *   assets/icon.svg          → PWA 192/512 e apple-icon (180)
 *   assets/icon-maskable.svg → PWA maskable 512 (desenho dentro da zona segura de 80%)
 *   assets/icon-pequeno.svg  → favicon.ico (16/32/48)
 * Rodar só quando um SVG mudar; a saída é commitada (o build não depende deste script).
 * sharp vem como dependência do next; não adicionamos outra cópia.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));

const png = (svg, tamanho) => sharp(svg, { density: 400 }).resize(tamanho, tamanho).png({ compressionLevel: 9 });

const saidas = [
  ["assets/icon.svg", "public/icons/icon-192.png", 192],
  ["assets/icon.svg", "public/icons/icon-512.png", 512],
  ["assets/icon-maskable.svg", "public/icons/icon-maskable-512.png", 512],
  ["assets/icon.svg", "src/app/apple-icon.png", 180],
];

mkdirSync("public/icons", { recursive: true });
for (const [svg, arquivo, tamanho] of saidas) {
  await png(svg, tamanho).toFile(arquivo);
  console.log(`✓ ${arquivo} (${tamanho}px)`);
}

// favicon.ico com entradas PNG (formato ICO "Vista+": cabeçalho de 6 bytes + 16 por imagem + PNGs).
const tamanhos = [16, 32, 48];
const imagens = await Promise.all(tamanhos.map((t) => png("assets/icon-pequeno.svg", t).toBuffer()));
const cabecalho = Buffer.alloc(6 + 16 * imagens.length);
cabecalho.writeUInt16LE(0, 0); // reservado
cabecalho.writeUInt16LE(1, 2); // tipo: ícone
cabecalho.writeUInt16LE(imagens.length, 4);
let deslocamento = cabecalho.length;
imagens.forEach((img, i) => {
  const e = 6 + 16 * i;
  cabecalho.writeUInt8(tamanhos[i], e); // largura
  cabecalho.writeUInt8(tamanhos[i], e + 1); // altura
  cabecalho.writeUInt16LE(1, e + 4); // planos
  cabecalho.writeUInt16LE(32, e + 6); // bits por pixel
  cabecalho.writeUInt32LE(img.length, e + 8);
  cabecalho.writeUInt32LE(deslocamento, e + 12);
  deslocamento += img.length;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([cabecalho, ...imagens]));
console.log(`✓ src/app/favicon.ico (${tamanhos.join("/")}px)`);
