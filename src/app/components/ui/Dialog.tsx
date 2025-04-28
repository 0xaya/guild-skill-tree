"use client";

import React from "react";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  actions?: React.ReactNode[];
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  actions,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-[80%] max-w-[350px]">
        <h2 className="font-bold mb-3">{title}</h2>
        <p className="text-text-secondary mb-6">{description}</p>
        <div className="flex justify-end gap-2">
          {actions && actions.length > 0 ? (
            actions.map((action, idx) => <React.Fragment key={idx}>{action}</React.Fragment>)
          ) : (
            <>
              <Button onClick={() => onOpenChange(false)} variant="outline" className="text-sm">
                {cancelText || "キャンセル"}
              </Button>
              <Button onClick={onConfirm} variant="primary" className="text-sm">
                {confirmText || "OK"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
