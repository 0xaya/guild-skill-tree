"use client";

import React from "react";
import { cn } from "../../utils/cn";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ children, text, position = "top", className }: TooltipProps) {
  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative group">
      {children}
      <span
        className={cn(
          "absolute bg-background-dark/90 text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
          positionStyles[position],
          className
        )}
      >
        {text}
      </span>
    </div>
  );
}
