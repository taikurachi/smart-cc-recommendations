"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: string;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
}

export default function Button({
  children,
  color = "purple",
  variant = "solid",
  size = "sm",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed group w-fit";

  // Solid button styles
  const solidColorStyles = {
    purple:
      "bg-purple text-white hover:bg-purple-dark active:scale-[0.98] shadow-sm hover:shadow-md",
    green:
      "bg-green text-white hover:bg-green-dark active:scale-[0.98] shadow-sm hover:shadow-md",
    "light-green":
      "bg-light-green text-white hover:bg-light-green-dark active:scale-[0.98] shadow-sm hover:shadow-md",
    blue: "bg-blue text-white hover:bg-blue-dark active:scale-[0.98] shadow-sm hover:shadow-md",
    gray: "bg-gray",
    "gray-light": "bg-gray-light",
    red: "bg-red",
  };

  // Outline button styles
  const outlineColorStyles = {
    purple:
      "border-2 border-purple text-purple hover:bg-purple hover:text-white active:scale-[0.98]",
    green:
      "border-2 border-green text-green hover:bg-green hover:text-white active:scale-[0.98]",
    "light-green":
      "border-2 border-light-green text-light-green hover:bg-light-green hover:text-white active:scale-[0.98]",
    blue: "border-2 border-blue text-blue hover:bg-blue hover:text-white active:scale-[0.98]",
    gray: "border-2 border-gray",
    red: "border-2 border-red",
  };

  const sizeStyles = {
    sm: "px-3 py-[1px] text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const colorStyle =
    variant === "outline" ? outlineColorStyles[color] : solidColorStyles[color];

  const combinedClassName =
    `${baseStyles} ${colorStyle} ${sizeStyles[size]} ${className}`.trim();

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
