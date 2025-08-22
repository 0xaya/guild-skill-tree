"use client";

import React from "react";
import { Button } from "./Button";
import { CloseIcon } from './Icons';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  actions?: React.ReactNode[];
  className?: string;
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
  className,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        className={`relative bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-[80%] max-w-[350px] ${
          className || ''
        }`}
      >
        <button
          type="button"
          aria-label="閉じる"
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-2 text-primary hover:bg-primary/10 rounded-full p-2"
        >
          <CloseIcon size={22} />
        </button>
        <h2 className="font-bold mb-3">{title}</h2>
        <div className="text-text-secondary mb-6">{description}</div>
        <div className="flex justify-end gap-2">
          {actions && actions.length > 0 ? (
            actions.map((action, idx) => <React.Fragment key={idx}>{action}</React.Fragment>)
          ) : (
            <>
              <Button onClick={() => onOpenChange(false)} variant="outline" className="text-sm">
                {cancelText || 'キャンセル'}
              </Button>
              <Button onClick={onConfirm} variant="primary" className="text-sm">
                {confirmText || 'OK'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
