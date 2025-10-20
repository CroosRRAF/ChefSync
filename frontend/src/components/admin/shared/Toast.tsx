import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Loader2 
} from "lucide-react";
import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === "loading" ? 0 : 5000),
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-remove toast after duration (unless it's loading)
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return addToast({ type: "success", title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ type: "error", title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ type: "warning", title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ type: "info", title, description });
  }, [addToast]);

  const loading = useCallback((title: string, description?: string) => {
    return addToast({ type: "loading", title, description, duration: 0 });
  }, [addToast]);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    updateToast,
    success,
    error,
    warning,
    info,
    loading,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastComponentProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    loading: Loader2,
  };

  const colors = {
    success: "from-green-500 to-emerald-600 border-green-500/20",
    error: "from-red-500 to-rose-600 border-red-500/20",
    warning: "from-orange-500 to-amber-600 border-orange-500/20",
    info: "from-blue-500 to-cyan-600 border-blue-500/20",
    loading: "from-gray-500 to-slate-600 border-gray-500/20",
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-lg",
        "backdrop-blur-xl bg-white/90 dark:bg-gray-900/90",
        "p-4 min-w-[320px]",
        colors[toast.type]
      )}
    >
      {/* Gradient background */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-10",
          colors[toast.type]
        )} 
      />

      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon 
            className={cn(
              "h-5 w-5",
              toast.type === "loading" && "animate-spin",
              toast.type === "success" && "text-green-600",
              toast.type === "error" && "text-red-600",
              toast.type === "warning" && "text-orange-600",
              toast.type === "info" && "text-blue-600",
              toast.type === "loading" && "text-gray-600"
            )} 
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {toast.type !== "loading" && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-current to-current opacity-30"
        />
      )}
    </motion.div>
  );
};

export default ToastProvider;
