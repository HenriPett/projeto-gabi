import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/site";

// Gerado no build. Só produção é indexável; previews (VERCEL_ENV=preview) e builds
// locais bloqueiam tudo — complementa o <meta name="robots"> do layout.
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" }, host: urlDoSite() };
}
