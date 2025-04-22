"use client";

import { useWallet } from "@/app/contexts/WalletContext";
import { Button } from "./ui/Button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function WalletConnectButton() {
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { error } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleConnect = async () => {
    try {
      if (openConnectModal) {
        openConnectModal();
      } else {
        throw new Error("Connect modal is not available");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div className="relative">
      <Button onClick={handleConnect} variant={isConnected ? "outline" : "primary"} className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        <span className="hidden sm:inline">{isConnected ? truncatedAddress : "ウォレット接続"}</span>
      </Button>
      {error && (
        <div className="absolute top-full right-0 mt-2 bg-red-500/10 border border-red-500 text-red-500 px-2 py-1 rounded text-xs">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}
    </div>
  );
}
