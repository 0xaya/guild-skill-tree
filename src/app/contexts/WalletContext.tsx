"use client";

import { createContext, useContext, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface WalletContextType {
  isConnected: boolean;
  address: string | undefined;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [error, setError] = useState<Error | null>(null);

  const handleConnect = async () => {
    try {
      if (openConnectModal) {
        openConnectModal();
      } else {
        throw new Error("Connect modal is not available");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connect: handleConnect,
        disconnect: handleDisconnect,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
