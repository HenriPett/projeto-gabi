import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegistrarServiceWorker } from "@/pwa/RegistrarServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Sistemas Adesivos", template: "%s · Sistemas Adesivos" },
  description: "Classificação, protocolos e comparação de preços de sistemas adesivos odontológicos.",
  appleWebApp: { capable: true, title: "Adesivos", statusBarStyle: "default" },
  // Previews e dev não são indexados (ver também src/app/robots.ts).
  robots: process.env.VERCEL_ENV === "production" ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#5E2280",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
