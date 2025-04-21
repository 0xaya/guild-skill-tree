"use client";

import { useWallet } from "../contexts/WalletContext";
import { useMemo } from "react";

export const WalletConnectButton = () => {
  const { isConnected, address, connect, disconnect, error } = useWallet();

  const shortenedAddress = useMemo(() => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, [address]);

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded text-sm">{error.message}</div>
      )}
      <button
        onClick={isConnected ? disconnect : connect}
        className={`px-4 py-2 rounded-lg ${
          isConnected ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
        } text-white font-medium transition-colors`}
      >
        {isConnected ? `切断 (${shortenedAddress})` : "ウォレット接続"}
      </button>
    </div>
  );
};
