import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // メインカラー
        primary: "#F06292", // ピンク（メインカラー）
        secondary: "#F8BBD0", // ライトピンク（アクセントカラー）
        tertiary: "#86efac", // グリーン（素材関連）

        // UI要素カラー
        background: {
          dark: "#111", // 背景色（濃）
          medium: "rgba(30, 30, 40, 0.8)", // 背景色（中）
          light: "rgba(180, 180, 180, 0.5)", // 背景色（淡）
        },

        // テキストカラー
        text: {
          primary: "#fff", // 白（メインテキスト）
          secondary: "#d1d5db", // グレー（サブテキスト）
          muted: "#9ca3af", // 薄いグレー（補足テキスト）
        },

        // アクセントカラー
        accent: {
          yellow: "#fcd34d", // 黄色（コイン、金額関連）
          red: "#dc2626", // 赤（リセットボタン、警告）
          blue: "#00ccff", // 青（情報）
        },
      },
    },
  },
  plugins: [],
};

export default config;
