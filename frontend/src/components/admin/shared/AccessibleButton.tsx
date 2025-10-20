import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, Loader2 } from "lucide-react";
import React, { forwardRef, useCallback } from "react";
import { useReducedMotion, useScreenReader } from "@/hooks/useAccessibility";

export interface AccessibleButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "red";
  
  // Accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaHaspopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  ariaPressed?: boolean;
  announceOnClick?: string;
  announceOnFocus?: string;
  
  // Keyboard navigation
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  
  // Screen reader support
  screenReaderOnly?: boolean;
}

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

const gradients = {
  blue: "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
  purple: "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700",
  green: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
  orange: "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700",
  pink: "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700",
  red: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      loadingText = "Loading...",
      icon: Icon,
      iconPosition = "left",
      gradient,
      children,
      disabled,
      onClick,
      onKeyDown,
      
      // Accessibility props
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaHaspopup,
      ariaPressed,
      announceOnClick,
      announceOnFocus,
      screenReaderOnly = false,
      
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { announce } = useScreenReader();

    // Handle click with announcements
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      if (announceOnClick) {
        announce(announceOnClick, "polite");
      }
      
      onClick?.(event);
    }, [loading, disabled, announceOnClick, announce, onClick]);

    // Handle focus with announcements
    const handleFocus = useCallback((event: React.FocusEvent<HTMLButtonElement>) => {
      if (announceOnFocus) {
        announce(announceOnFocus, "polite");
      }
      
      props.onFocus?.(event);
    }, [announceOnFocus, announce, props]);

    // Enhanced keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle Enter and Space keys
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick(event as any);
      }
      
      onKeyDown?.(event);
    }, [handleClick, onKeyDown]);

    // Build ARIA attributes
    const ariaAttributes = {
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-haspopup': ariaHaspopup,
      'aria-pressed': ariaPressed,
      'aria-busy': loading,
      'aria-disabled': disabled || loading,
    };

    // Remove undefined attributes
    Object.keys(ariaAttributes).forEach(key => {
      if (ariaAttributes[key as keyof typeof ariaAttributes] === undefined) {
        delete ariaAttributes[key as keyof typeof ariaAttributes];
      }
    });

    const buttonClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "relative overflow-hidden",
      
      // Screen reader only styles
      screenReaderOnly && "sr-only",
      
      // Variant styles
      gradient ? gradients[gradient] : variants[variant],
      sizes[size],
      
      // Loading state
      loading && "cursor-not-allowed",
      
      className
    );

    const buttonContent = (
      <>
        {/* Loading spinner */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-inherit"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText && (
              <span className="ml-2 text-sm">{loadingText}</span>
            )}
          </motion.div>
        )}

        {/* Button content */}
        <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {Icon && iconPosition === "left" && (
            <Icon className="h-4 w-4" aria-hidden="true" />
          )}
          
          {children && (
            <span>{children}</span>
          )}
          
          {Icon && iconPosition === "right" && (
            <Icon className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        {/* Focus indicator for high contrast mode */}
        <div 
          className="absolute inset-0 border-2 border-transparent focus-within:border-current opacity-0 focus-within:opacity-100 rounded-md pointer-events-none"
          aria-hidden="true"
        />
      </>
    );

    // Motion wrapper (respects reduced motion preference)
    const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;
    const motionProps = prefersReducedMotion ? {} : {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { duration: 0.1 },
    };

    return (
      <MotionWrapper {...motionProps}>
        <button
          ref={ref}
          className={buttonClasses}
          disabled={disabled || loading}
          onClick={handleClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          {...ariaAttributes}
          {...props}
        >
          {buttonContent}
        </button>
      </MotionWrapper>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

export default AccessibleButton;
