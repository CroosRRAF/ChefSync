import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "none";
  hover?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

const gradientClasses = {
  blue: "from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40",
  purple:
    "from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40",
  green:
    "from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40",
  orange:
    "from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40",
  pink: "from-pink-500/10 to-rose-500/10 border-pink-500/20 hover:border-pink-500/40",
  cyan: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20 hover:border-cyan-500/40",
  none: "border-border",
};

/**
 * GlassCard Component
 *
 * Modern glassmorphism card with backdrop blur and gradient options
 * Perfect for 2025 trending UI designs
 *
 * @example
 * <GlassCard gradient="blue" hover animate>
 *   <h3>Card Title</h3>
 *   <p>Card content with glassmorphism effect</p>
 * </GlassCard>
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  gradient = "none",
  hover = true,
  animate = true,
  onClick,
}) => {
  const baseClasses = cn(
    // Glassmorphism effect
    "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80",
    "border rounded-2xl shadow-lg",
    // Gradient background
    gradient !== "none" && `bg-gradient-to-br ${gradientClasses[gradient]}`,
    gradient === "none" && "border-border",
    // Hover effects
    hover && "hover:shadow-xl hover:scale-[1.02]",
    // Transitions
    "transition-all duration-300 ease-in-out",
    // Padding
    "p-6",
    // Cursor
    onClick && "cursor-pointer",
    className
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={hover ? { scale: 1.02 } : {}}
        whileTap={onClick ? { scale: 0.98 } : {}}
        className={baseClasses}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default GlassCard;
