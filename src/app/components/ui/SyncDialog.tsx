"use client";

import React from "react";
import { Button } from "./Button";

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (useLocalData: boolean) => void;
}

export function SyncDialog({ open, onOpenChange, onConfirm }: SyncDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64">
        <h2 className="text-sm font-bold mb-3">データの同期</h2>
        <p className="text-text-secondary mb-6">
          このデバイスとサーバーで異なるデータが見つかりました。 どちらのデータを使用しますか？
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onConfirm(false)} variant="outline" className="text-sm">
            サーバーのデータを使用
          </Button>
          <Button onClick={() => onConfirm(true)} variant="primary" className="text-sm">
            このデバイスのデータを使用
          </Button>
        </div>
      </div>
    </div>
  );
}
