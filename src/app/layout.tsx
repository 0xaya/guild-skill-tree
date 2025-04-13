import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "元素騎士ギルドスキルツリーシミュレータ",
  description: "元素騎士のギルドスキルをシミュレーションできる非公式ツールです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen`}>{children}</body>
    </html>
  );
}
