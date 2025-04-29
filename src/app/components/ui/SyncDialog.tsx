"use client";

import React from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (useLocalData: boolean) => void;
  onCancel: () => void;
}

export function SyncDialog({ open, onOpenChange, onConfirm, onCancel }: SyncDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          onCancel();
        }
        onOpenChange(isOpen);
      }}
      title="データ同期の確認"
      description={
        <>
          このデバイスとサーバーで異なるデータが見つかりました。
          <br />
          どちらのデータを使用しますか？
          <br />
          <span className="block text-xs text-text-secondary my-4">
            サーバー：クラウド上の保存データ
            <br />
            このデバイス：今お使いの端末のデータ
          </span>
        </>
      }
      actions={[
        <Button
          key="device"
          onClick={() => onConfirm(true)}
          variant="outline"
          size="md"
          className="w-[50%] text-nowrap"
        >
          このデバイス
        </Button>,
        <Button
          key="server"
          onClick={() => onConfirm(false)}
          variant="primary"
          size="md"
          className="w-[50%] text-nowrap"
        >
          サーバー
        </Button>,
      ]}
    />
  );
}
