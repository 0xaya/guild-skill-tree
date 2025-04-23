"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { signInWithPopup, GoogleAuthProvider, TwitterAuthProvider } from "firebase/auth";
import { auth } from "../config/firebase";
import { WalletIcon, GoogleIcon, LogoutIcon, SignInIcon, XIcon } from "./ui/Icons";

export function AuthButton() {
  const { user, isAuthenticated, authMethod, logout, loading } = useAuth();
  const [showSignInMenu, setShowSignInMenu] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSignInMenu(false);
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWalletConnect = async () => {
    setError(null);
    try {
      if (openConnectModal) {
        openConnectModal();
        setShowSignInMenu(false);
      } else {
        throw new Error("Connect modal is not available");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(err instanceof Error ? err.message : "ウォレット接続に失敗しました");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowSignInMenu(false);
    } catch (err) {
      console.error("Failed to sign in with Google:", err);
      setError(err instanceof Error ? err.message : "Googleログインに失敗しました");
    }
  };

  const handleTwitterLogin = async () => {
    setError(null);
    try {
      const provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
      setShowSignInMenu(false);
    } catch (err) {
      console.error("Failed to sign in with Twitter:", err);
      setError(err instanceof Error ? err.message : "Xログインに失敗しました");
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await logout();
      setShowLogoutMenu(false);
    } catch (err) {
      console.error("Logout failed:", err);
      setError(err instanceof Error ? err.message : "ログアウトに失敗しました");
    }
  };

  const handleButtonClick = () => {
    if (isAuthenticated) {
      setShowLogoutMenu(!showLogoutMenu);
      setShowSignInMenu(false);
    } else {
      setShowSignInMenu(!showSignInMenu);
      setShowLogoutMenu(false);
    }
  };

  const getDisplayIdentifier = () => {
    if (!user) return "";
    if (authMethod === "wallet" && typeof user === "object" && "address" in user) {
      const address = user.address;
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    if (authMethod === "google" && typeof user === "object" && "displayName" in user) {
      return user.displayName || user.email || "Google User";
    }
    if (authMethod === "twitter" && typeof user === "object" && "displayName" in user) {
      return user.displayName || user.email || "X User";
    }
    return "";
  };

  if (loading) {
    return (
      <Button variant="outline" className="flex items-center gap-2" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        onClick={handleButtonClick}
        variant={isAuthenticated ? "outline" : "primary"}
        className="flex items-center md:gap-2"
      >
        {isAuthenticated ? (
          authMethod === "wallet" ? (
            <WalletIcon className="flex-shrink-0" />
          ) : authMethod === "google" ? (
            <GoogleIcon className="flex-shrink-0" />
          ) : (
            <XIcon size={16} className="flex-shrink-0" />
          )
        ) : (
          <SignInIcon className="flex-shrink-0" />
        )}
        <span className="w-0 md:w-auto overflow-hidden md:overflow-visible whitespace-nowrap">
          {isAuthenticated ? getDisplayIdentifier() : "ログイン"}
        </span>
      </Button>

      {/* Sign In Menu */}
      {showSignInMenu && !isAuthenticated && (
        <div className="absolute top-full right-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg w-56 z-10">
          <div className="p-2 flex flex-col gap-1">
            <button
              onClick={handleWalletConnect}
              className="flex items-center gap-2 w-full px-[1.1rem] py-2 text-sm text-text-primary hover:bg-primary/10 rounded"
            >
              <WalletIcon size={16} />
              <span>ウォレット接続</span>
            </button>
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 w-full px-[1.1rem] py-2 text-sm text-text-primary hover:bg-primary/10 rounded"
            >
              <GoogleIcon size={16} />
              <span>Googleでログイン</span>
            </button>
            <button
              onClick={handleTwitterLogin}
              className="flex items-center gap-[0.7rem] w-full px-[1.1rem] py-2 text-sm text-text-primary hover:bg-primary/10 rounded"
            >
              <XIcon size={12} />
              <span>Xでログイン</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Menu */}
      {showLogoutMenu && isAuthenticated && (
        <div className="absolute top-full right-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg w-52 z-10">
          <div className="p-2">
            <div className="px-4 py-2 text-sm text-text-primary border-b border-primary/20">
              {getDisplayIdentifier()}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-[0.7rem] w-full px-[1.1rem] py-2 text-sm text-text-primary hover:bg-primary/10 rounded"
            >
              <LogoutIcon size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full right-0 mt-2 bg-red-500/10 border border-red-500 text-red-500 px-2 py-1 rounded text-xs z-10">
          {error}
        </div>
      )}
    </div>
  );
}
