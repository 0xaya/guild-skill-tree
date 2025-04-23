import React, { useState, useRef, useEffect } from "react";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  error?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onEdit?: (value: string) => void;
}

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};

export function Select({
  value,
  onChange,
  options,
  label,
  error,
  variant = "primary",
  size = "md",
  className = "",
  onEdit,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setSelectedLabel(selectedOption?.label || "");
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const baseStyles = "inline-flex items-center justify-center transition-colors rounded-lg";
  const variantStyles = {
    primary: "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30",
    secondary: "bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30",
    outline: "bg-transparent hover:bg-primary/10 text-primary border border-primary/50",
  };

  return (
    <div className="relative" ref={selectRef}>
      {label && <label className="block text-xs text-text-muted mb-1">{label}</label>}
      <button
        type="button"
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} w-full text-left flex items-center justify-between`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg z-10">
          {options.map(option => (
            <div
              key={option.value}
              className="flex items-center justify-between px-3 py-2 text-sm text-primary hover:bg-primary/20"
            >
              <button
                type="button"
                className={`flex-1 text-left ${option.value === value ? "text-primary" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
              <div className="flex items-center gap-2">
                {option.value === value && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {onEdit && (
                  <button
                    type="button"
                    className="p-1 hover:bg-primary/20 rounded"
                    onClick={e => {
                      e.stopPropagation();
                      onEdit(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
