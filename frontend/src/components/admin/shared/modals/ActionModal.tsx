import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import React from "react";

interface ActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  action?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
  showIcon?: boolean;
}

const ActionModal: React.FC<ActionModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  action,
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showIcon = true,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    if (!showIcon) return null;

    switch (variant) {
      case "destructive":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive";
      case "warning":
        return "default";
      case "success":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {action && (
                <div className="text-sm text-gray-500 mt-1">
                  Action: {action}
                </div>
              )}
            </div>
          </div>
          <AlertDialogDescription className="mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === "destructive" &&
                "bg-red-600 hover:bg-red-700 text-white",
              variant === "warning" &&
                "bg-yellow-600 hover:bg-yellow-700 text-white",
              variant === "success" &&
                "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            {loading ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ActionModal };
