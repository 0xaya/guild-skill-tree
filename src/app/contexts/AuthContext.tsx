"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { syncUserData, resolveSyncConflict, flushPendingUpdates } from "../../utils/syncUtils";
import { SyncDialog } from "../components/ui/SyncDialog";
import { saveGlobalState } from "../utils/storageUtils";
import { verifyMessage } from "ethers";

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
  deleteAccount: () => Promise<void>;
  clearUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// 同期完了イベントを発火する関数
const dispatchSyncCompleteEvent = (data: any) => {
  window.dispatchEvent(new CustomEvent("syncComplete", { detail: data }));
};

// 状態リセットイベントを発火する関数
const dispatchResetStateEvent = () => {
  window.dispatchEvent(new CustomEvent("reset-state"));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthState["authMethod"]>(null);
  const [loading, setLoading] = useState(true);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncData, setSyncData] = useState<{ localData: any; serverData: any } | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const { address, isConnected: isWalletConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // 署名メッセージを検証する関数
  const verifySignature = async (address: string, signature: string) => {
    try {
      const message = `Sign this message to verify your ownership of the address: ${address}`;
      const recoveredAddress = await verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Failed to verify signature:", error);
      return false;
    }
  };

  // アドレス変更時の処理
  const handleWalletChange = useCallback(async () => {
    if (isSigning) return;

    try {
      setIsSigning(true);
      setLoading(true);
      const wasLoggedOut = localStorage.getItem("wasLoggedOut") === "true";

      // ウォレット切り替え時は必ずローカルストレージをクリア
      localStorage.removeItem("guild-skill-tree-simulator-state");
      if (wasLoggedOut) {
        localStorage.removeItem("wasLoggedOut");
      }

      // 署名を要求
      const message = `Sign this message to verify your ownership of the address: ${address}`;
      const signature = await signMessageAsync({ message });

      // 署名を検証
      const isValid = await verifySignature(address!, signature);
      if (!isValid) {
        throw new Error("Invalid signature");
      }

      // ユーザーデータの保存と同期
      const walletUser = { address: address! };
      await saveUserData(walletUser, "wallet");

      // データ同期の実行
      const result = await syncUserData(address!);
      console.log("Sync result:", result);

      // 状態を一括で更新
      if (result.type === "local-to-server" || result.type === "synced") {
        setUser(walletUser);
        setAuthMethod("wallet");
        setUserData(prev => (prev ? { ...prev, globalState: result.data } : null));
      } else if (result.type === "server-to-local") {
        setUser(walletUser);
        setAuthMethod("wallet");
        setUserData(prev => (prev ? { ...prev, globalState: result.data } : null));
        saveGlobalState(result.data);
        dispatchSyncCompleteEvent(result.data);
      } else if (result.type === "conflict" && "localData" in result && "serverData" in result) {
        setSyncData({ localData: result.localData, serverData: result.serverData });
        setShowSyncDialog(true);
      }
    } catch (error) {
      console.error("Failed to handle wallet change:", error);
      // エラー時は状態をクリア
      setUser(null);
      setUserData(null);
      setAuthMethod(null);
      // ウォレットを切断
      disconnectWallet();
    } finally {
      setLoading(false);
      setIsSigning(false);
    }
  }, [address, signMessageAsync, disconnectWallet]);

  // ウォレット切断時の処理
  const handleWalletDisconnect = useCallback(async () => {
    try {
      // 保留中の更新を保存
      if (user) {
        const uid = "address" in user ? user.address : user.uid;
        await flushPendingUpdates();
      }
      // 状態をクリア
      setUser(null);
      setUserData(null);
      setAuthMethod(null);

      // ローカルストレージをクリア
      localStorage.removeItem("guild-skill-tree-simulator-state");
      localStorage.setItem("wasLoggedOut", "true");

      // 状態リセットイベントを発火
      dispatchResetStateEvent();
    } catch (error) {
      console.error("Failed to handle wallet disconnect:", error);
    }
  }, [user]);

  // ウォレット接続状態の監視
  useEffect(() => {
    if (isWalletConnected && !user && authMethod !== "google" && authMethod !== "twitter") {
      handleWalletChange();
    } else if (!isWalletConnected && authMethod === "wallet") {
      handleWalletDisconnect();
    }
  }, [isWalletConnected, authMethod, handleWalletChange, handleWalletDisconnect]);

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
          const wasLoggedOut = localStorage.getItem("wasLoggedOut") === "true";
          const result = await syncUserData(firebaseUser.uid);
          console.log("Sync result:", result);

          if (result.type === "conflict" && "localData" in result && "serverData" in result) {
            setSyncData({ localData: result.localData, serverData: result.serverData });
          }

          // ログアウト状態をクリア
          localStorage.removeItem("wasLoggedOut");
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

  const clearUserData = async () => {
    try {
      // LocalStorageをクリア
      localStorage.removeItem("guild-skill-tree-simulator-state");
      // 状態リセットイベントを発火
      dispatchResetStateEvent();
      // 状態をクリア
      setUser(null);
      setUserData(null);
      setAuthMethod(null);
    } catch (error) {
      console.error("Failed to clear user data:", error);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log("AuthContext: logout started");

      // 保留中の更新を保存
      if (user) {
        const uid = "address" in user ? user.address : user.uid;
        await flushPendingUpdates();
      }

      // 認証関連の処理を実行
      if (authMethod === "google" || authMethod === "twitter") {
        await signOut(auth);
      } else if (authMethod === "wallet") {
        disconnectWallet();
      }

      // データをクリア
      await clearUserData();

      // ログアウト状態を記録
      localStorage.setItem("wasLoggedOut", "true");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // 同期確認ダイアログのキャンセル時の処理
  const handleSyncCancel = () => {
    setShowSyncDialog(false);
    setSyncData(null);
    if (authMethod === "google" || authMethod === "twitter") {
      signOut(auth);
    } else if (authMethod === "wallet") {
      disconnectWallet();
    }
    setUser(null);
    setUserData(null);
    setAuthMethod(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      const uid = "address" in user ? user.address : user.uid;
      const userRef = doc(db, "users", uid);
      await deleteDoc(userRef);

      if (authMethod === "google" || authMethod === "twitter") {
        await signOut(auth);
      } else if (authMethod === "wallet") {
        disconnectWallet();
      }

      // データをクリア
      await clearUserData();
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
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
    deleteAccount,
    clearUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <SyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        onConfirm={handleSyncConflict}
        onCancel={handleSyncCancel}
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
