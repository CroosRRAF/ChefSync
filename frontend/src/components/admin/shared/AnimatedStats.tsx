import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import React, { useEffect } from "react";
import { GlassCard } from "./GlassCard";

export interface AnimatedStatsProps {
  value: number;
  label: string;
  icon: LucideIcon;
  trend?: number;
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "cyan";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  loading?: boolean;
  className?: string;
  subtitle?: string;
}

/**
 * AnimatedStats Component
 *
 * Displays animated statistics with trends and gradients
 * Numbers animate from 0 to target value on mount and updates
 *
 * @example
 * <AnimatedStats
 *   value={1250}
 *   label="Total Users"
 *   icon={Users}
 *   trend={12.5}
 *   gradient="blue"
 *   prefix=""
 *   suffix=""
 * />
 */
export const AnimatedStats: React.FC<AnimatedStatsProps> = ({
  value,
  label,
  icon: Icon,
  trend,
  gradient = "blue",
  prefix = "",
  suffix = "",
  decimals = 0,
  loading = false,
  className,
  subtitle,
}) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    if (!loading) {
      motionValue.set(value);
    }
  }, [value, loading, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [springValue]);

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toFixed(decimals);
  };

  const gradientIconClasses = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-red-500",
    pink: "from-pink-500 to-rose-500",
    cyan: "from-cyan-500 to-blue-500",
  };

  const trendColor = trend
    ? trend >= 0
      ? "text-green-500"
      : "text-red-500"
    : "";
  const TrendIcon = trend && trend >= 0 ? ArrowUpRight : ArrowDownRight;

  if (loading) {
    return (
      <GlassCard gradient={gradient} hover={false} animate={false}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-xl" />
            <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard gradient={gradient} className={cn("group relative", className)}>
      {/* Header with icon and trend */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-xl",
            "bg-gradient-to-br",
            gradientIconClasses[gradient],
            "shadow-lg group-hover:shadow-xl",
            "transition-shadow duration-300"
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>

        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full",
              "bg-white/50 dark:bg-slate-800/50",
              "backdrop-blur-sm"
            )}
          >
            <TrendIcon className={cn("h-4 w-4", trendColor)} />
            <span className={cn("text-sm font-semibold", trendColor)}>
              {Math.abs(trend).toFixed(1)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Value */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-2"
      >
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
          {prefix}
          {formatValue(displayValue)}
          {suffix}
        </h3>
      </motion.div>

      {/* Label */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Decorative gradient overlay */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
          "bg-gradient-to-br",
          gradientIconClasses[gradient],
          "group-hover:opacity-30 transition-opacity duration-300",
          "pointer-events-none"
        )}
      />
    </GlassCard>
  );
};

export default AnimatedStats;
