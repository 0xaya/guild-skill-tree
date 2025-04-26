import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon, PencilIcon, PlusIcon } from "./Icons";

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
  keepOpenOnSelect?: (value: string) => boolean;
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
  keepOpenOnSelect,
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

  const handleOptionClick = (option: { value: string; label: string }) => {
    onChange(option.value);
    if (!keepOpenOnSelect?.(option.value)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={selectRef}>
      {label && <label className="block text-xs text-text-muted mb-1">{label}</label>}
      <button
        type="button"
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} w-full text-left flex items-center justify-between`}
        onClick={() => setIsOpen(!isOpen)}
        title={selectedLabel}
      >
        <span className="truncate flex-1">{selectedLabel}</span>
        <ChevronDownIcon
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""} ml-2 flex-shrink-0`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg z-10">
          {options.map((option, index) => (
            <React.Fragment key={option.value}>
              {option.value === "add-new" && <div className="h-px bg-primary/30 mx-3" />}
              <div className="flex items-center justify-between px-3 py-2 text-sm text-primary hover:bg-primary/20">
                <button
                  type="button"
                  className={`flex-1 text-left truncate ${option.value === value ? "text-primary font-bold" : ""}`}
                  onClick={() => handleOptionClick(option)}
                  title={option.label}
                >
                  {option.label}
                </button>
                <div className="flex items-center gap-2">
                  {option.value === value && <CheckIcon size={16} className="text-primary" />}
                  {option.value === "add-new" && (
                    <button
                      type="button"
                      className="p-1 hover:bg-primary/20 rounded-lg"
                      onClick={e => {
                        e.stopPropagation();
                        handleOptionClick(option);
                      }}
                    >
                      <PlusIcon size={16} className="text-primary" />
                    </button>
                  )}
                  {onEdit && option.value !== "add-new" && (
                    <button
                      type="button"
                      className="p-1 hover:bg-primary/20 rounded-lg"
                      onClick={e => {
                        e.stopPropagation();
                        onEdit(option.value);
                        setIsOpen(false);
                      }}
                    >
                      <PencilIcon size={14} className="text-primary" />
                    </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
