import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Sistem Pembayaran Santri | PPMH Silir Sari",
  description: "Aplikasi Pembayaran Bulanan Santri Pondok Pesantren Miftahul Huda Silir Sari",
  manifest: "/manifest.json?v=2",
  icons: {
    icon: "/logo-ppmh.png",
    apple: "/logo-ppmh.png",
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-slate-950 text-slate-50`}>
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        {children}
      </body>
    </html>
  );
}
