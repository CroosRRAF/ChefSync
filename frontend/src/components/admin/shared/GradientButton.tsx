import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";
import React from "react";

export interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "red";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  variant?: "solid" | "outline" | "ghost";
}

const gradientClasses = {
  blue: {
    solid:
      "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10",
    ghost: "text-blue-500 hover:bg-blue-500/10",
  },
  purple: {
    solid:
      "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    outline:
      "border-2 border-purple-500 text-purple-500 hover:bg-purple-500/10",
    ghost: "text-purple-500 hover:bg-purple-500/10",
  },
  green: {
    solid:
      "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
    outline: "border-2 border-green-500 text-green-500 hover:bg-green-500/10",
    ghost: "text-green-500 hover:bg-green-500/10",
  },
  orange: {
    solid:
      "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
    outline:
      "border-2 border-orange-500 text-orange-500 hover:bg-orange-500/10",
    ghost: "text-orange-500 hover:bg-orange-500/10",
  },
  pink: {
    solid:
      "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600",
    outline: "border-2 border-pink-500 text-pink-500 hover:bg-pink-500/10",
    ghost: "text-pink-500 hover:bg-pink-500/10",
  },
  red: {
    solid:
      "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600",
    outline: "border-2 border-red-500 text-red-500 hover:bg-red-500/10",
    ghost: "text-red-500 hover:bg-red-500/10",
  },
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

/**
 * GradientButton Component
 *
 * Modern gradient button with animations and hover effects
 * Supports multiple variants and sizes
 *
 * @example
 * <GradientButton
 *   gradient="blue"
 *   icon={Plus}
 *   onClick={handleClick}
 *   loading={isLoading}
 * >
 *   Create New
 * </GradientButton>
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  gradient = "blue",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  variant = "solid",
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base styles
        "relative group overflow-hidden",
        "font-semibold rounded-xl",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Gradient styles
        gradientClasses[gradient][variant],
        // Size
        sizeClasses[size],
        // Width
        fullWidth && "w-full",
        // Text color for solid variant
        variant === "solid" && "text-white",
        // Disabled state
        isDisabled && "transform-none hover:scale-100",
        className
      )}
    >
      {/* Ripple effect overlay */}
      {variant === "solid" && (
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-r",
            gradient === "blue" && "from-cyan-500 to-blue-500",
            gradient === "purple" && "from-pink-500 to-purple-500",
            gradient === "green" && "from-emerald-500 to-green-500",
            gradient === "orange" && "from-red-500 to-orange-500",
            gradient === "pink" && "from-rose-500 to-pink-500",
            gradient === "red" && "from-rose-500 to-red-500",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-300"
          )}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && Icon && iconPosition === "left" && (
          <Icon className="h-4 w-4" />
        )}
        {children}
        {!loading && Icon && iconPosition === "right" && (
          <Icon className="h-4 w-4" />
        )}
      </span>

      {/* Shine effect */}
      {!isDisabled && variant === "solid" && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </motion.button>
  );
};

export default GradientButton;
