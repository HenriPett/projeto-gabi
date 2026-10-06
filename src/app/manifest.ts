import type { MetadataRoute } from "next";

// Servido em /manifest.webmanifest; o Next injeta o <link rel="manifest"> no <head>.
// Cores = tokens do DESIGN.md §1 (--purple-700 primário, --gray-0 fundo).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sistemas Adesivos",
    short_name: "Adesivos",
    description: "Classificação, protocolos e comparação de preços de sistemas adesivos odontológicos.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#5E2280",
    categories: ["education", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
