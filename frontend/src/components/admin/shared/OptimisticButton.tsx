import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Loader2, X, LucideIcon } from "lucide-react";
import React, { useState, useCallback } from "react";
import { GradientButton, GradientButtonProps } from "./GradientButton";

export interface OptimisticButtonProps extends Omit<GradientButtonProps, "onClick"> {
  onClick: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  optimisticText?: string;
  successIcon?: LucideIcon;
  errorIcon?: LucideIcon;
  resetDelay?: number;
  showFeedback?: boolean;
}

type ButtonState = "idle" | "loading" | "success" | "error";

export const OptimisticButton: React.FC<OptimisticButtonProps> = ({
  onClick,
  children,
  successMessage = "Success!",
  errorMessage = "Failed",
  optimisticText,
  successIcon: SuccessIcon = Check,
  errorIcon: ErrorIcon = X,
  resetDelay = 2000,
  showFeedback = true,
  disabled,
  className,
  ...props
}) => {
  const [state, setState] = useState<ButtonState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  const handleClick = useCallback(async () => {
    if (state === "loading") return;

    try {
      setState("loading");
      if (optimisticText) {
        setFeedbackMessage(optimisticText);
      }

      await onClick();

      setState("success");
      if (showFeedback) {
        setFeedbackMessage(successMessage);
      }

      // Reset to idle after delay
      setTimeout(() => {
        setState("idle");
        setFeedbackMessage("");
      }, resetDelay);

    } catch (error) {
      setState("error");
      if (showFeedback) {
        setFeedbackMessage(errorMessage);
      }

      // Reset to idle after delay
      setTimeout(() => {
        setState("idle");
        setFeedbackMessage("");
      }, resetDelay);
    }
  }, [onClick, optimisticText, successMessage, errorMessage, showFeedback, resetDelay, state]);

  const getButtonContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {feedbackMessage || children}
          </div>
        );
      
      case "success":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <SuccessIcon className="h-4 w-4" />
            {showFeedback ? feedbackMessage : children}
          </motion.div>
        );
      
      case "error":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <ErrorIcon className="h-4 w-4" />
            {showFeedback ? feedbackMessage : children}
          </motion.div>
        );
      
      default:
        return children;
    }
  };

  const getButtonProps = () => {
    const baseProps = {
      ...props,
      disabled: disabled || state === "loading",
      onClick: handleClick,
      className: cn(
        "transition-all duration-200",
        state === "success" && "bg-green-500 hover:bg-green-600 border-green-500",
        state === "error" && "bg-red-500 hover:bg-red-600 border-red-500",
        className
      ),
    };

    // Override gradient for success/error states
    if (state === "success") {
      return { ...baseProps, gradient: "green" as const };
    }
    if (state === "error") {
      return { ...baseProps, gradient: "red" as const };
    }

    return baseProps;
  };

  return (
    <GradientButton {...getButtonProps()}>
      {getButtonContent()}
    </GradientButton>
  );
};

export default OptimisticButton;
