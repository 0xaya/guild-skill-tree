"use client";

import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

// メインネットのみを使用する設定
export const chains = [mainnet] as const;

// Wagmiの基本設定
export const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
  },
});
