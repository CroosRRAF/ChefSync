import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import React from "react";

// Base Modal Component
interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "",
  size = "md",
  showCloseButton = true,
}) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-6 w-6 p-0"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

// Confirmation Modal
interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  loading?: boolean;
  trigger?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  trigger,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirmation action failed:", error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
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
      default:
        return "default";
    }
  };

  const Modal = (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === "destructive" && "bg-red-600 hover:bg-red-700",
              variant === "warning" && "bg-yellow-600 hover:bg-yellow-700"
            )}
          >
            {loading ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center space-x-3">
              {getIcon()}
              <AlertDialogTitle>{title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                variant === "destructive" && "bg-red-600 hover:bg-red-700",
                variant === "warning" && "bg-yellow-600 hover:bg-yellow-700"
              )}
            >
              {loading ? "Processing..." : confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return Modal;
};

// Form Modal
interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  trigger?: React.ReactNode;
  hideFooter?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  size = "md",
  trigger,
  hideFooter = false,
}) => {
  const handleSubmit = async () => {
    if (onSubmit) {
      try {
        await onSubmit();
        onOpenChange(false);
      } catch (error) {
        console.error("Form submission failed:", error);
      }
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const content = (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
    >
      <ScrollArea className="max-h-[60vh]">{children}</ScrollArea>

      {!hideFooter && (
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          {onSubmit && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : submitText}
            </Button>
          )}
        </DialogFooter>
      )}
    </BaseModal>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return content;
};

// Detail Modal for viewing item details
interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, any>;
  fields?: Array<{
    key: string;
    label: string;
    render?: (value: any) => React.ReactNode;
  }>;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  }>;
  size?: "sm" | "md" | "lg" | "xl";
}

export const DetailModal: React.FC<DetailModalProps> = ({
  open,
  onOpenChange,
  title,
  data,
  fields = [],
  actions = [],
  size = "lg",
}) => {
  const defaultFields = Object.keys(data).map((key) => ({
    key,
    label:
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
  }));

  const displayFields = fields.length > 0 ? fields : defaultFields;

  const renderValue = (field: any, value: any) => {
    if (field.render) {
      return field.render(value);
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">N/A</span>;
    }

    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === "object") {
      return <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>;
    }

    return String(value);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size={size}
    >
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-4">
          {displayFields.map((field) => (
            <div key={field.key} className="grid grid-cols-3 gap-4">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {field.label}:
              </div>
              <div className="col-span-2">
                {renderValue(field, data[field.key])}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {actions.length > 0 && (
        <DialogFooter className="mt-6">
          <div className="flex space-x-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="flex items-center space-x-2"
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </DialogFooter>
      )}
    </BaseModal>
  );
};

// Quick Action Modals
interface QuickActionModalProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "warning";
  confirmText?: string;
  cancelText?: string;
}

export const DeleteModal: React.FC<QuickActionModalProps> = (props) => (
  <ConfirmModal
    {...props}
    variant="destructive"
    confirmText={props.confirmText || "Delete"}
    title={props.title || "Delete Item"}
    description={
      props.description ||
      "Are you sure you want to delete this item? This action cannot be undone."
    }
    open={false}
    onOpenChange={() => {}}
  />
);

export const SaveModal: React.FC<QuickActionModalProps> = (props) => (
  <ConfirmModal
    {...props}
    variant="default"
    confirmText={props.confirmText || "Save"}
    title={props.title || "Save Changes"}
    description={
      props.description || "Are you sure you want to save these changes?"
    }
    open={false}
    onOpenChange={() => {}}
  />
);

// Export ActionModal from separate file
export { ActionModal } from "./ActionModal";
