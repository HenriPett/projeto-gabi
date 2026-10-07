import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { RegistrarServiceWorker } from "@/pwa/RegistrarServiceWorker";
import { urlDoSite } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], weight: ["600", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(urlDoSite()),
  title: { default: "Sistemas Adesivos", template: "%s · Sistemas Adesivos" },
  description: "Classificação, protocolos e comparação de preços de sistemas adesivos odontológicos.",
  appleWebApp: { capable: true, title: "Adesivos", statusBarStyle: "default" },
  // Previews e dev não são indexados (ver também src/app/robots.ts).
  robots: process.env.VERCEL_ENV === "production" ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#5E2280", // --purple-700 (DESIGN.md §1.1); manter igual a src/app/manifest.ts
  viewportFit: "cover", // safe areas da CompareTray e da barra sticky (DESIGN §6)
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
