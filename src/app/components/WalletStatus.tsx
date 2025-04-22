"use client";

import { useWallet } from "@/app/contexts/WalletContext";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function WalletStatus() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 mt-2 mr-2 p-2 bg-background-dark/80 rounded-lg text-xs">
      <span className="text-green-500">
        接続済み: {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
    </div>
  );
}
