"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { syncUserData, resolveSyncConflict } from "../utils/syncUtils";
import { SyncDialog } from "../components/ui/SyncDialog";
import { saveGlobalState } from "../utils/storageUtils";

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

// 同期完了イベントを発火する関数
const dispatchSyncCompleteEvent = (data: any) => {
  window.dispatchEvent(new CustomEvent("syncComplete", { detail: data }));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthState["authMethod"]>(null);
  const [loading, setLoading] = useState(true);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncData, setSyncData] = useState<{ localData: any; serverData: any } | null>(null);
  const { address, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();

  const saveUserData = async (user: User | { address: string }, method: "wallet" | "google" | "twitter") => {
    try {
      const uid = "address" in user ? user.address : user.uid;
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

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
        await setDoc(userRef, newUserData);
        setUserData(newUserData);
      } else {
        // 既存ユーザーの場合
        const existingData = userDoc.data() as UserData;
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

  const handleSyncConflict = async (useLocalData: boolean) => {
    if (!user || !syncData) return;

    try {
      const uid = "address" in user ? user.address : user.uid;
      const resolvedData = await resolveSyncConflict(uid, useLocalData, syncData.localData, syncData.serverData);
      setUserData(prev => (prev ? { ...prev, globalState: resolvedData } : null));

      // 同期完了イベントを発火
      dispatchSyncCompleteEvent(resolvedData);
    } catch (error) {
      console.error("Failed to resolve sync conflict:", error);
    } finally {
      setShowSyncDialog(false);
      setSyncData(null);
    }
  };

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const providerId = firebaseUser.providerData[0]?.providerId;
        const method = providerId === "google.com" ? "google" : "twitter";
        setAuthMethod(method);
        await saveUserData(firebaseUser, method);

        // データ同期の実行
        try {
          const syncResult = await syncUserData(firebaseUser.uid);

          if (syncResult.type === "conflict") {
            setSyncData({ localData: syncResult.localData, serverData: syncResult.serverData });
            setShowSyncDialog(true);
          } else if (syncResult.type === "server-to-local") {
            setUserData(prev => (prev ? { ...prev, globalState: syncResult.data } : null));
            saveGlobalState(syncResult.data);
            dispatchSyncCompleteEvent(syncResult.data);
          } else if (syncResult.type === "local-to-server" || syncResult.type === "synced") {
            setUserData(prev => (prev ? { ...prev, globalState: syncResult.data } : null));
          }
        } catch (error) {
          console.error("Failed to sync data:", error);
        }
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
    if (isWalletConnected && authMethod !== "google" && authMethod !== "twitter") {
      const walletUser = { address: address! };
      setUser(walletUser);
      setAuthMethod("wallet");
      saveUserData(walletUser, "wallet");

      // データ同期の実行
      const syncData = async () => {
        try {
          const syncResult = await syncUserData(address!);

          if (syncResult.type === "conflict") {
            setSyncData({ localData: syncResult.localData, serverData: syncResult.serverData });
            setShowSyncDialog(true);
          } else if (syncResult.type === "server-to-local") {
            setUserData(prev => (prev ? { ...prev, globalState: syncResult.data } : null));
            saveGlobalState(syncResult.data);
            dispatchSyncCompleteEvent(syncResult.data);
          } else if (syncResult.type === "local-to-server" || syncResult.type === "synced") {
            setUserData(prev => (prev ? { ...prev, globalState: syncResult.data } : null));
          }
        } catch (error) {
          console.error("Failed to sync data:", error);
        }
      };

      syncData();
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <SyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        onConfirm={handleSyncConflict}
        onCancel={logout}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
