import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ЭнхЭх · Эмчийн Web Admin",
  description: "Жирэмсний хяналтын эмнэлгийн систем",
};

export const viewport: Viewport = {
  themeColor: "#f6f8fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
