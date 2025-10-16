import { AlertTriangle, CheckCircle, HelpCircle, Info } from "lucide-react";
import React from "react";

interface HelpTooltipProps {
  content: string;
  title?: string;
  type?: "info" | "warning" | "success" | "error";
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  children?: React.ReactNode;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  type = "info",
  position = "top",
  className = "",
  children,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default: // top
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsVisible(true);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: position === "top" ? rect.top : rect.bottom,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center cursor-help"
      >
        {children || (
          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
        )}
      </div>

      {isVisible && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onMouseEnter={() => setIsVisible(false)}
          />

          {/* Tooltip */}
          <div
            className={`fixed z-50 p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl max-w-xs w-full pointer-events-none ${getPositionClasses()}`}
            style={{
              left:
                position === "left" || position === "right"
                  ? tooltipPosition.x
                  : undefined,
              top:
                position === "top" || position === "bottom"
                  ? tooltipPosition.y
                  : undefined,
              transform:
                position === "top" || position === "bottom"
                  ? "translateX(-50%)"
                  : position === "left"
                  ? "translate(-100%, -50%)"
                  : "translateY(-50%)",
            }}
          >
            <div className="flex items-start gap-2">
              {getIcon()}
              <div className="flex-1">
                {title && (
                  <div className="font-semibold text-sm mb-1">{title}</div>
                )}
                <div className="text-sm leading-relaxed">{content}</div>
              </div>
            </div>

            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${
                position === "top"
                  ? "top-full left-1/2 -translate-x-1/2 -mt-1"
                  : position === "bottom"
                  ? "bottom-full left-1/2 -translate-x-1/2 -mb-1"
                  : position === "left"
                  ? "left-full top-1/2 -translate-y-1/2 -ml-1"
                  : "right-full top-1/2 -translate-y-1/2 -mr-1"
              }`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default HelpTooltip;
