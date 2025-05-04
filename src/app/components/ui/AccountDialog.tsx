"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { PencilIcon, CloseIcon } from "./Icons";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string | null;
  userData: { displayName: string | null } | null;
  authMethod: "wallet" | "google" | "twitter" | null;
  onUpdateDisplayName: (newName: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isDeleting?: boolean;
}

export function AccountDialog({
  open,
  onOpenChange,
  displayName,
  userData,
  authMethod,
  onUpdateDisplayName,
  onDeleteAccount,
  isDeleting = false,
}: AccountDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(displayName || "");

  useEffect(() => {
    if (userData?.displayName) {
      setNewDisplayName(userData.displayName);
    }
  }, [userData]);

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) return;
    try {
      setIsUpdating(true);
      await onUpdateDisplayName(newDisplayName);
      setIsEditing(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update display name:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDeleteAccount();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const getAuthMethodText = (method: string | null) => {
    switch (method) {
      case "wallet":
        return "ウォレット";
      case "google":
        return "Google";
      case "twitter":
        return "X";
      default:
        return "不明";
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={
          <div className="flex items-center justify-between">
            <span className="text-primary">アカウント情報</span>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-2 right-2 p-1.5 hover:bg-primary/10 rounded-full transition-colors"
              aria-label="閉じる"
            >
              <CloseIcon size={24} className="text-primary" />
            </button>
          </div>
        }
        description={
          <>
            <div className="text-text-secondary mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={e => setNewDisplayName(e.target.value)}
                        className="w-full px-2 py-1 bg-background-dark border border-primary/50 rounded"
                        placeholder="ユーザー名を入力"
                      />
                    ) : (
                      <span className="text-text-primary">
                        ユーザー名: {userData?.displayName || displayName || "未設定"}
                      </span>
                    )}
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="ml-2">
                      <PencilIcon size={16} />
                    </Button>
                  ) : (
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setNewDisplayName(userData?.displayName || displayName || "");
                        }}
                        disabled={isUpdating}
                      >
                        キャンセル
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleUpdateDisplayName} disabled={isUpdating}>
                        {isUpdating ? "更新中..." : "保存"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-text-secondary">ログイン方法: {getAuthMethodText(authMethod)}</div>
              </div>
            </div>
          </>
        }
        actions={[
          <Button
            key="delete"
            onClick={handleDeleteClick}
            variant="primary"
            size="md"
            className={`w-full ${isEditing ? "hidden" : ""}`}
            disabled={isDeleting}
          >
            {isDeleting ? "削除中..." : "アカウントを削除"}
          </Button>,
        ]}
      />

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="アカウント削除の確認"
        description={
          <div className="space-y-4">
            <p>アカウントを削除すると、以下のデータが完全に削除されます：</p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>キャラクターデータ</li>
              <li>スキルツリーの設定</li>
              <li>その他のアカウント関連情報</li>
            </ul>
            <p className="text-text-secondary">この操作は取り消すことができません。</p>
          </div>
        }
        actions={[
          <Button
            key="confirm"
            onClick={handleDeleteConfirm}
            variant="primary"
            size="md"
            className="w-full whitespace-nowrap"
            disabled={isDeleting}
          >
            {isDeleting ? "削除中..." : "アカウントを削除"}
          </Button>,
          <Button
            key="cancel"
            onClick={() => setShowDeleteConfirm(false)}
            variant="outline"
            size="md"
            className="w-full"
          >
            キャンセル
          </Button>,
        ]}
      />
    </>
  );
}
 