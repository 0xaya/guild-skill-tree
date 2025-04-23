"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authMethod: "wallet" | "google" | "twitter";
  walletAddress: string | null;
  createdAt: any;
  updatedAt: any;
}

interface AuthState {
  user: User | { address: string } | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  authMethod: "wallet" | "google" | "twitter" | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthState["authMethod"]>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();

  const saveUserData = async (user: User | { address: string }, method: "wallet" | "google" | "twitter") => {
    console.log("saveUserData called with:", { user, method });
    try {
      const uid = "address" in user ? user.address : user.uid;
      console.log("User ID:", uid);
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      console.log("Document exists:", userDoc.exists());

      if (!userDoc.exists()) {
        // 新規ユーザーの場合
        const newUserData: UserData = {
          uid,
          email: "email" in user ? user.email || null : null,
          displayName: "displayName" in user ? user.displayName || null : null,
          photoURL: "photoURL" in user ? user.photoURL || null : null,
          authMethod: method,
          walletAddress: "address" in user ? user.address : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        console.log("Saving new user data:", newUserData);
        await setDoc(userRef, newUserData);
        console.log("User data saved successfully");
        setUserData(newUserData);
      } else {
        // 既存ユーザーの場合
        const existingData = userDoc.data() as UserData;
        console.log("Existing user data:", existingData);
        setUserData(existingData);
      }
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    try {
      const uid = "address" in user ? user.address : user.uid;
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setUserData(prev => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error("Failed to update user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, async firebaseUser => {
      console.log("Firebase auth state changed:", firebaseUser);
      if (firebaseUser) {
        setUser(firebaseUser);
        const providerId = firebaseUser.providerData[0]?.providerId;
        const method = providerId === "google.com" ? "google" : "twitter";
        setAuthMethod(method);
        await saveUserData(firebaseUser, method);
      } else if (!isWalletConnected) {
        setUser(null);
        setUserData(null);
        setAuthMethod(null);
      }
      setLoading(false);
    });

    return () => unsubscribeFirebase();
  }, [isWalletConnected]);

  useEffect(() => {
    console.log("Wallet connection state changed:", { isWalletConnected, address, authMethod });
    if (isWalletConnected && authMethod !== "google" && authMethod !== "twitter") {
      const walletUser = { address: address! };
      setUser(walletUser);
      setAuthMethod("wallet");
      saveUserData(walletUser, "wallet");
      setLoading(false);
    } else if (!isWalletConnected && authMethod === "wallet") {
      setUser(null);
      setUserData(null);
      setAuthMethod(null);
    }
  }, [address, isWalletConnected, authMethod]);

  const logout = async () => {
    setLoading(true);
    try {
      if (authMethod === "google" || authMethod === "twitter") {
        await signOut(auth);
      } else if (authMethod === "wallet") {
        disconnectWallet();
      }
      setUser(null);
      setUserData(null);
      setAuthMethod(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userData,
    isAuthenticated: !!user,
    authMethod,
    loading,
    logout,
    updateUserData,
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
