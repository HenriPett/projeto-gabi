import type { NextConfig } from "next";

// Site 100% estático (SSG): dados lidos de data/ no build. Sem Cache Components —
// não há dado de runtime, e ele exige generateStaticParams não vazio.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
