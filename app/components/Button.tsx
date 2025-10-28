"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "sm",
  showArrow = true,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed group w-fit";

  const variantStyles = {
    primary:
      "bg-purple text-white hover:bg-purple-dark active:scale-[0.98] shadow-sm hover:shadow-md",
    secondary:
      "bg-green text-white hover:bg-green-dark active:scale-[0.98] shadow-sm hover:shadow-md",
    outline:
      "border-2 border-purple text-purple hover:bg-purple hover:text-white active:scale-[0.98]",
  };

  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const combinedClassName =
    `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

  return (
    <button className={combinedClassName} {...props}>
      <span>{children}</span>
      {showArrow && (
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </button>
  );
}
