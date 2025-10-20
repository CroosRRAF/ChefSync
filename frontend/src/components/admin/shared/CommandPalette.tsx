import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  User,
  Users,
  Utensils,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  action?: () => void;
  keywords: string[];
  group: string;
}

/**
 * CommandPalette Component
 *
 * Modern command palette (Cmd+K / Ctrl+K) for quick navigation and actions
 * Inspired by Linear, Raycast, and VS Code
 *
 * @example
 * <CommandPalette />
 */
export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Command items
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      keywords: ["dashboard", "home", "overview"],
      group: "Navigation",
    },
    {
      id: "nav-analytics",
      label: "Go to Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      keywords: ["analytics", "reports", "stats", "charts"],
      group: "Navigation",
    },
    {
      id: "nav-users",
      label: "Go to User Management",
      icon: Users,
      href: "/admin/manage-user",
      keywords: ["users", "customers", "manage", "people"],
      group: "Navigation",
    },
    {
      id: "nav-food",
      label: "Go to Food Management",
      icon: Utensils,
      href: "/admin/food-menu-management",
      keywords: ["food", "menu", "items", "dishes"],
      group: "Navigation",
    },
    {
      id: "nav-communication",
      label: "Go to Communication",
      icon: MessageSquare,
      href: "/admin/communication",
      keywords: ["communication", "messages", "notifications", "alerts"],
      group: "Navigation",
    },
    {
      id: "nav-feedback",
      label: "Go to Feedback Management",
      icon: MessageSquare,
      href: "/admin/feedback-management",
      keywords: ["feedback", "complaints", "suggestions", "reviews"],
      group: "Navigation",
    },
    {
      id: "nav-reports",
      label: "Go to Reports",
      icon: FileText,
      href: "/admin/reports",
      keywords: ["reports", "export", "data", "download"],
      group: "Navigation",
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: Settings,
      href: "/admin/settings",
      keywords: ["settings", "config", "preferences"],
      group: "Navigation",
    },
    {
      id: "nav-profile",
      label: "Go to Profile",
      icon: User,
      href: "/admin/profile",
      keywords: ["profile", "account", "user"],
      group: "Navigation",
    },

    // Quick Actions
    {
      id: "action-refresh",
      label: "Refresh Dashboard Data",
      icon: LayoutDashboard,
      action: () => window.location.reload(),
      keywords: ["refresh", "reload", "update"],
      group: "Actions",
    },
  ];

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (command: CommandItem) => {
    setOpen(false);
    if (command.href) {
      navigate(command.href);
    } else if (command.action) {
      command.action();
    }
  };

  // Group commands
  const groupedCommands = commands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = [];
    }
    acc[command.group].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {Object.entries(groupedCommands).map(([group, items], index) => (
            <React.Fragment key={group}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((command) => (
                  <CommandItem
                    key={command.id}
                    onSelect={() => handleSelect(command)}
                    className="cursor-pointer"
                  >
                    <command.icon className="mr-2 h-4 w-4" />
                    <span>{command.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

// Fix import for Search icon
import { Search } from "lucide-react";

export default CommandPalette;
