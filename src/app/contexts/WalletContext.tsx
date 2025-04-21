"use client";

import { createContext, useContext, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

interface WalletContextType {
  isConnected: boolean;
  address: string | undefined;
  connect: () => void;
  disconnect: () => void;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      await open();
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connect: handleConnect,
        disconnect,
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
