"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { signInWithPopup, GoogleAuthProvider, TwitterAuthProvider } from "firebase/auth";
import { auth } from "../config/firebase";
import { LogoutIcon, GoogleIcon, XIcon, SignInIcon, PencilIcon } from "./ui/Icons";
import { useIsMobile } from "../hooks/useIsMobile";
import { AccountDialog } from "./ui/AccountDialog";
import { useRouter } from "next/navigation";

interface UserWithId {
  id: string;
  address?: string;
}

export function AuthButton() {
  const { user, userData, isAuthenticated, authMethod, logout, loading, deleteAccount, updateUserData, clearUserData } =
    useAuth();
  const [showSignInMenu, setShowSignInMenu] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      await clearUserData();
      setShowAccountDialog(false);
      setShowLogoutMenu(false);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setError("アカウントの削除に失敗しました。もう一度お試しください。");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateDisplayName = async (newName: string) => {
    try {
      await updateUserData({ displayName: newName });
    } catch (error) {
      console.error("Failed to update display name:", error);
      setError(error instanceof Error ? error.message : "ユーザー名の更新に失敗しました");
      throw error;
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

    // FirestoreのdisplayNameを優先
    if (userData?.displayName) {
      return userData.displayName;
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
        isIconOnly={isMobile && isAuthenticated}
      >
        {isAuthenticated ? (
          authMethod === "google" ? (
            <GoogleIcon className="flex-shrink-0" />
          ) : (
            <XIcon size={16} className="flex-shrink-0" />
          )
        ) : (
          <SignInIcon />
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
            <div className="px-4 py-2 text-sm text-text-primary border-b border-primary/20 flex items-center justify-between">
              <span>{getDisplayIdentifier()}</span>
              <button
                onClick={() => {
                  setShowAccountDialog(true);
                  setShowLogoutMenu(false);
                }}
                className="p-1 hover:bg-primary/10 rounded"
              >
                <PencilIcon size={14} />
              </button>
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

      {/* Account Dialog */}
      {isAuthenticated && (
        <AccountDialog
          open={showAccountDialog}
          onOpenChange={setShowAccountDialog}
          displayName={getDisplayIdentifier()}
          userData={userData}
          authMethod={authMethod}
          onUpdateDisplayName={handleUpdateDisplayName}
          onDeleteAccount={handleDeleteAccount}
          isDeleting={isDeleting}
        />
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
