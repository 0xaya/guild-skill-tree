"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { syncUserData, resolveSyncConflict, flushPendingUpdates } from "../../utils/syncUtils";
import { SyncDialog } from "../components/ui/SyncDialog";
import { saveGlobalState } from "../utils/storageUtils";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authMethod: "google" | "twitter";
  createdAt: any;
  updatedAt: any;
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  authMethod: "google" | "twitter" | null;
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

  const saveUserData = async (user: User, method: "google" | "twitter") => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // 新規ユーザーの場合
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email || null,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          authMethod: method,
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
      const userRef = doc(db, "users", user.uid);
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
      const resolvedData = await resolveSyncConflict(user.uid, useLocalData, syncData.localData, syncData.serverData);
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
      try {
        if (firebaseUser) {
          const providerId = firebaseUser.providerData[0]?.providerId;
          const method = providerId === "google.com" ? "google" : "twitter";
          setUser(firebaseUser);
          setAuthMethod(method);
          await saveUserData(firebaseUser, method);

          // データ同期の実行
          try {
            const wasLoggedOut = localStorage.getItem("wasLoggedOut") === "true";
            const result = await syncUserData(firebaseUser.uid);
            console.log("Sync result:", result);

            if (result.type === "local-to-server" || result.type === "synced") {
              setUserData(prev => (prev ? { ...prev, globalState: result.data } : null));
            } else if (result.type === "server-to-local") {
              setUserData(prev => (prev ? { ...prev, globalState: result.data } : null));
              saveGlobalState(result.data);
              dispatchSyncCompleteEvent(result.data);
            } else if (result.type === "conflict" && "localData" in result && "serverData" in result) {
              setSyncData({ localData: result.localData, serverData: result.serverData });
              setShowSyncDialog(true);
            }

            // ログアウト状態をクリア
            localStorage.removeItem("wasLoggedOut");
          } catch (error) {
            console.error("Failed to sync data:", error);
          }
        } else {
          setUser(null);
          setUserData(null);
          setAuthMethod(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeFirebase();
  }, []);

  const clearUserData = async () => {
    try {
      // 状態リセットイベントを発火
      dispatchResetStateEvent();
      // LocalStorageをクリア
      localStorage.removeItem("guild-skill-tree-simulator-state");
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
        await flushPendingUpdates();
      }

      // 認証関連の処理を実行
      await signOut(auth);

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
    signOut(auth);
    setUser(null);
    setUserData(null);
    setAuthMethod(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);

      // 先にデータをクリア
      await clearUserData();

      // その後でFirestoreのドキュメントを削除
      await deleteDoc(userRef);

      // 最後に認証状態をクリア
      await signOut(auth);
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
