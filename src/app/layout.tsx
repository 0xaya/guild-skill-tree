import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ギルドスキルツリーシミュレータ | 元素騎士オンライン",
  description: "元素騎士オンラインのギルドスキルをシミュレーションできる非公式ツールです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
