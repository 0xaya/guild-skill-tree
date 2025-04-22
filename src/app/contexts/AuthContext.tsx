"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../config/firebase";

interface AuthState {
  user: User | { address: string } | null;
  isAuthenticated: boolean;
  authMethod: "wallet" | "google" | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [authMethod, setAuthMethod] = useState<AuthState["authMethod"]>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthMethod("google");
      } else if (!isWalletConnected) {
        // Only set to null if wallet isn't connected either
        setUser(null);
        setAuthMethod(null);
      }
      setLoading(false);
    });

    return () => unsubscribeFirebase();
  }, [isWalletConnected]);

  useEffect(() => {
    // Prioritize Firebase auth if both are somehow active
    if (isWalletConnected && authMethod !== "google") {
      setUser({ address: address! });
      setAuthMethod("wallet");
      setLoading(false); // Also set loading false here
    } else if (!isWalletConnected && authMethod === "wallet") {
      // Wallet disconnected, but Firebase might still be loading or logged out
      setUser(null);
      setAuthMethod(null);
      // setLoading(false); // Let Firebase listener handle final loading state
    }
  }, [address, isWalletConnected, authMethod]);

  const logout = async () => {
    setLoading(true);
    try {
      if (authMethod === "google") {
        await signOut(auth);
      } else if (authMethod === "wallet") {
        disconnectWallet();
      }
      setUser(null);
      setAuthMethod(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    authMethod,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
