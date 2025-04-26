import React from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  fullWidth?: boolean;
  isIconOnly?: boolean;
}

const baseStyles = "inline-flex items-center justify-center transition-colors rounded-lg";
const iconOnlyStyles = "h-10 p-2 text-base";

const variantStyles = {
  primary: "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30",
  secondary: "bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30",
  outline: "bg-transparent hover:bg-primary/10 text-primary border border-primary/50",
};

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  isIconOnly = false,
  className = "",
  ...props
}) => {
  const buttonStyles = cn(
    baseStyles,
    variantStyles[variant],
    isIconOnly ? iconOnlyStyles : sizeStyles[size],
    fullWidth && "w-full",
    className
  );

  return (
    <button className={buttonStyles} {...props}>
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};
