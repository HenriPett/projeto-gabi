import type { MetadataRoute } from "next";

// Site fechado por senha (proxy): nada é indexável, em nenhum ambiente.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
