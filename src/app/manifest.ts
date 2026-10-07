import type { MetadataRoute } from "next";

// Servido em /manifest.webmanifest; o Next injeta o <link rel="manifest"> no <head>.
// Cores = tokens do DESIGN.md §1 (--ink-900 header/tema, --gray-0 fundo).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Adesivologia",
    short_name: "Adesivologia",
    description: "Adesivologia: classificação, protocolos e comparação de preços de sistemas adesivos odontológicos.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#151515", // --ink-900 (DESIGN.md §1.1); manter igual ao viewport do layout
    categories: ["education", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
