import { cn } from "@/lib/utils";
import React, { useEffect } from "react";
import { useSkipLinks } from "@/hooks/useAccessibility";

interface SkipLink {
  id: string;
  label: string;
  target: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultSkipLinks: SkipLink[] = [
  { id: "main-content", label: "Skip to main content", target: "#main-content" },
  { id: "navigation", label: "Skip to navigation", target: "#navigation" },
  { id: "search", label: "Skip to search", target: "#search" },
  { id: "footer", label: "Skip to footer", target: "#footer" },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className,
}) => {
  const { skipTo, addSkipLink, removeSkipLink } = useSkipLinks();

  // Register skip links
  useEffect(() => {
    links.forEach(link => {
      addSkipLink(link.id, link.label, link.target);
    });

    return () => {
      links.forEach(link => {
        removeSkipLink(link.id);
      });
    };
  }, [links, addSkipLink, removeSkipLink]);

  const handleSkipClick = (event: React.MouseEvent, target: string) => {
    event.preventDefault();
    skipTo(target);
  };

  return (
    <nav
      className={cn(
        "skip-links fixed top-0 left-0 z-[9999]",
        "transform -translate-y-full focus-within:translate-y-0",
        "transition-transform duration-200 ease-in-out",
        className
      )}
      aria-label="Skip navigation links"
    >
      <ul className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-br-lg shadow-lg">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.target}
              onClick={(e) => handleSkipClick(e, link.target)}
              className={cn(
                "block px-4 py-2 text-sm font-medium",
                "text-gray-900 dark:text-gray-100",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus:bg-blue-50 dark:focus:bg-blue-900/20",
                "focus:text-blue-600 dark:focus:text-blue-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                "transition-colors duration-150",
                "first:rounded-tr-lg last:rounded-br-lg"
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Hook to register skip link targets
export const useSkipLinkTarget = (id: string, ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = ref.current;
    if (element && !element.id) {
      element.id = id;
    }
  }, [id, ref]);
};

// Higher-order component to add skip link target
export function withSkipLinkTarget<P extends object>(
  Component: React.ComponentType<P>,
  targetId: string
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const internalRef = React.useRef<HTMLElement>(null);
    const targetRef = ref || internalRef;

    useSkipLinkTarget(targetId, targetRef as React.RefObject<HTMLElement>);

    return <Component {...props} ref={targetRef} />;
  });

  WrappedComponent.displayName = `withSkipLinkTarget(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default SkipLinks;
