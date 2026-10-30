import type { Metadata, Viewport } from "next";
import { Nunito, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app/AppShell";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

// Bangla glyphs for the elder assistant; Nunito has no Bengali script
const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "Jotno – AI Diabetic Nutrition & Metabolic Assistant",
  description:
    "AI-powered multimodal metabolic companion for diabetic and pre-diabetic patients.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jotno",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${notoBengali.variable}`}>
      <body className="min-h-screen bg-backdrop font-sans text-ink antialiased selection:bg-pastel-blue">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
