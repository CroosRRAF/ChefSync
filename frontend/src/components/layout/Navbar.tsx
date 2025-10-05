import navbarLogo from "@/assets/images/hero/navbarlogo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Home,
  Info,
  LogOut,
  Menu,
  Moon,
  Phone,
  Search,
  ShoppingCart,
  Sun,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { cartSummary } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate("/auth/login");
    }
  };

  const getRoleBasedDashboard = () => {
    if (!user) return "/";

    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "cook":
        return "/cook/dashboard";
      case "delivery_agent":
        return "/delivery/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Menu", href: "/menu", icon: ChefHat },
    { label: "About", href: "/about", icon: Info },
    { label: "Contact", href: "/contact", icon: Phone },
  ];

  const isHomePage = location.pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? isHomePage
            ? `navbar-blur-light shadow-lg ${theme === "dark" ? "dark" : ""}`
            : "navbar-blur"
          : isHomePage
          ? `navbar-blur-heavy border-none shadow-none ${
              theme === "dark" ? "dark" : ""
            }`
          : "bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer group">
            <div className="relative">
              <img
                src={navbarLogo}
                alt="ChefSync"
                className="h-16 w-auto object-contain transform group-hover:scale-105 transition-all duration-300"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center space-x-2 text-sm font-medium transition-all duration-300 hover:text-orange-500 relative group ${
                  location.pathname === link.href
                    ? "text-orange-500 font-semibold"
                    : isHomePage
                    ? theme === "light"
                      ? "text-gray-900 hover:text-orange-600"
                      : "text-white/90 hover:text-orange-300"
                    : "text-gray-900 dark:text-gray-300 hover:text-orange-500"
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
                {location.pathname === link.href && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                )}
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`hidden sm:flex transition-all duration-300 ${
                isHomePage
                  ? theme === "light"
                    ? "hover:bg-white/20 text-gray-900"
                    : "hover:bg-white/20 text-white"
                  : theme === "light"
                  ? "hover:bg-orange-50 text-gray-900"
                  : "hover:bg-orange-900/20 text-gray-300"
              }`}
              onClick={() => navigate("/menu")}
            >
              <Search
                className={`h-4 w-4 transition-colors duration-300 ${
                  isHomePage
                    ? theme === "light"
                      ? "text-gray-900"
                      : "text-white"
                    : theme === "light"
                    ? "text-gray-900"
                    : "text-gray-300"
                }`}
              />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`hidden sm:flex transition-all duration-300 ${
                isHomePage
                  ? theme === "light"
                    ? "hover:bg-white/20 text-gray-900"
                    : "hover:bg-white/20 text-white"
                  : theme === "light"
                  ? "hover:bg-orange-50 text-gray-900"
                  : "hover:bg-orange-900/20 text-gray-300"
              }`}
            >
              {theme === "light" ? (
                <Moon
                  className={`h-4 w-4 transition-colors duration-300 ${
                    isHomePage ? "text-gray-900" : "text-gray-900"
                  }`}
                />
              ) : (
                <Sun
                  className={`h-4 w-4 transition-colors duration-300 ${
                    isHomePage ? "text-yellow-300" : "text-yellow-500"
                  }`}
                />
              )}
            </Button>

            {/* Cart Button */}
            {isAuthenticated && user?.role === "customer" && (
              <Button
                variant="ghost"
                size="sm"
                className={`relative transition-all duration-300 ${
                  isHomePage
                    ? "hover:bg-white/20 text-white"
                    : theme === "light"
                    ? "hover:bg-orange-50 text-gray-900"
                    : "hover:bg-orange-900/20 text-gray-300"
                }`}
                onClick={() => navigate("/customer/cart")}
              >
                <ShoppingCart
                  className={`h-4 w-4 transition-colors duration-300 ${
                    isHomePage
                      ? "text-white"
                      : theme === "light"
                      ? "text-gray-900"
                      : "text-gray-300"
                  }`}
                />
                {cartSummary && cartSummary.total_items > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {cartSummary.total_items}
                  </Badge>
                )}
              </Button>
            )}

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center space-x-1 transition-all duration-300 ${
                      isHomePage
                        ? "hover:bg-white/20 text-white"
                        : theme === "light"
                        ? "hover:bg-orange-50 text-gray-900"
                        : "hover:bg-orange-900/20 text-gray-300"
                    }`}
                    onClick={() => {
                      if (user?.role === "customer") {
                        navigate("/customer/dashboard");
                      }
                    }}
                  >
                    <User
                      className={`h-4 w-4 transition-colors duration-300 ${
                        isHomePage
                          ? "text-white"
                          : theme === "light"
                          ? "text-gray-900"
                          : "text-gray-300"
                      }`}
                    />
                    <span
                      className={`text-sm transition-colors duration-300 ${
                        isHomePage
                          ? "text-white"
                          : theme === "light"
                          ? "text-gray-900"
                          : "text-gray-300"
                      }`}
                    >
                      {user?.name}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-300 ${
                      isHomePage
                        ? "hover:bg-white/20 text-white"
                        : theme === "light"
                        ? "hover:bg-orange-50 text-gray-900"
                        : "hover:bg-orange-900/20 text-gray-300"
                    }`}
                    onClick={logout}
                  >
                    <LogOut
                      className={`h-4 w-4 transition-colors duration-300 ${
                        isHomePage
                          ? "text-white"
                          : theme === "light"
                          ? "text-gray-900"
                          : "text-gray-300"
                      }`}
                    />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-300 ${
                      isHomePage
                        ? theme === "light"
                          ? "hover:bg-white/20 text-gray-900 hover:text-gray-700"
                          : "hover:bg-white/20 text-white dark:text-gray-200 dark:hover:bg-white/15"
                        : theme === "light"
                        ? "hover:bg-orange-50 text-gray-900"
                        : "hover:bg-orange-900/20 text-gray-300"
                    }`}
                    onClick={() => navigate("/auth/login")}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth/register")}
                    className={`transition-colors duration-300 ${
                      isHomePage
                        ? theme === "light"
                          ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg"
                          : "bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white backdrop-blur-sm dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-100"
                        : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    }`}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`md:hidden transition-all duration-300 ${
                    isHomePage
                      ? theme === "light"
                        ? "hover:bg-white/20 text-gray-900"
                        : "hover:bg-white/20 text-white"
                      : theme === "light"
                      ? "hover:bg-orange-50 text-gray-900"
                      : "hover:bg-orange-900/20 text-gray-300"
                  }`}
                >
                  <Menu
                    className={`h-5 w-5 transition-colors duration-300 ${
                      isHomePage
                        ? theme === "light"
                          ? "text-gray-900"
                          : "text-white"
                        : theme === "light"
                        ? "text-gray-900"
                        : "text-gray-300"
                    }`}
                  />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <h2 className="sr-only">Mobile menu</h2>
                <p className="sr-only">
                  Navigation drawer with links and actions
                </p>
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center pb-6 border-b">
                    <img
                      src={navbarLogo}
                      alt="ChefSync"
                      className="h-12 w-auto object-contain"
                    />
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4 py-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          "text-base font-medium transition-colors hover:text-primary px-2 py-1",
                          location.pathname === link.href
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="mt-auto space-y-4 pt-6 border-t">
                    {isAuthenticated ? (
                      <>
                        <div
                          className="flex items-center space-x-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => {
                            if (user?.role === "customer") {
                              navigate("/customer/dashboard");
                            }
                          }}
                        >
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {user?.role?.replace("_", " ")}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate("/auth/login")}
                        >
                          Sign In
                        </Button>
                        <Button
                          className="w-full button-gradient-primary"
                          onClick={() => navigate("/auth/register")}
                        >
                          Get Started
                        </Button>
                      </>
                    )}

                    {/* Theme Toggle in Mobile */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={toggleTheme}
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="h-4 w-4 mr-2" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4 mr-2" />
                          Light Mode
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
