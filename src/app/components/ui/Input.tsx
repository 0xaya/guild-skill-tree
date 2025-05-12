import React from "react";
import { cn } from "../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: "primary" | "outline";
  inputSize?: "sm" | "md" | "lg";
  className?: string;
}

const baseStyles = "w-full rounded-lg transition-colors text-white placeholder-white/50";

const variantStyles = {
  primary: "bg-primary/20 hover:bg-primary/30 border-[0.15rem] border-primary/30",
  secondary: "bg-secondary/20 hover:bg-secondary/30 border-[0.15rem] border-secondary/30",
  outline: "bg-transparent hover:bg-primary/10 border-[0.15rem] border-primary/50",
};

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = "primary",
  inputSize = "md",
  className = "",
  ...props
}) => {
  return (
    <div className="relative">
      {label && <label className="block text-xs text-text-muted mb-1">{label}</label>}
      <input
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[inputSize]} ${className} focus:outline-none focus:ring-2 focus:ring-primary/50`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
