"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { config, projectId, chains } from "./config/wagmi";
import { WalletProvider } from "./contexts/WalletContext";
import { useState, useEffect } from "react";

// Web3Modalの初期化
if (typeof window !== "undefined") {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    defaultChain: chains[0],
    metadata: {
      name: "Guild Skill Tree",
      description: "Guild Skill Tree Simulator",
      url: "https://guild-skill-tree.vercel.app",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
