"use client";

import { useWallet } from "@/app/contexts/WalletContext";
import { Button } from "./ui/Button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { LogoutIcon, WalletIcon } from "./ui/Icons";

export function WalletConnectButton() {
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { error, disconnect } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleConnect = async () => {
    try {
      if (isConnected) {
        setShowMenu(!showMenu);
      } else if (openConnectModal) {
        openConnectModal();
      } else {
        throw new Error("Connect modal is not available");
      }
    } catch (err) {
      console.error("Failed to connect/disconnect wallet:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await disconnect();
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div className="relative" ref={menuRef}>
      <Button onClick={handleConnect} variant={isConnected ? "outline" : "primary"} className="flex items-center gap-2">
        <WalletIcon className="flex-shrink-0" />
        <span className="hidden sm:inline">{isConnected ? truncatedAddress : "ウォレット接続"}</span>
      </Button>
      {error && (
        <div className="absolute top-full right-0 mt-2 bg-red-500/10 border border-red-500 text-red-500 px-2 py-1 rounded text-xs">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}
      {showMenu && isConnected && (
        <div className="absolute top-full right-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg w-48">
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-primary/10 rounded"
            >
              <LogoutIcon size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
