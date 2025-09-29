import { ChevronRight, Home } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
}

const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // Generate breadcrumb items from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/admin/dashboard" },
    ];

    // Convert path segments to breadcrumb items
    if (pathSegments.length > 1) {
      pathSegments.slice(1).forEach((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 2).join("/")}`;
        const label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        breadcrumbs.push({ label, href });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index === 0 && <Home size={16} className="mr-2" />}

          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link
              to={item.href}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                index === breadcrumbItems.length - 1
                  ? "text-gray-900 dark:text-white font-medium"
                  : ""
              }
            >
              {item.label}
            </span>
          )}

          {index < breadcrumbItems.length - 1 && (
            <ChevronRight size={16} className="mx-2 text-gray-400" />
          )}
        </div>
      ))}
    </nav>
  );
};

export default AdminBreadcrumb;
