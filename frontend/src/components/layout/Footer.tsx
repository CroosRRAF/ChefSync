import heroImage from "@/assets/images/hero/Gemini_Generated_Image_k5p5g8k5p5g8k5p5.png";
import logoImage from "@/assets/logo.png";
import logoSvg from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/context/ThemeContext";
import {
  ChefHat,
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface FooterProps {
  variant?: "default" | "minimal" | "dashboard";
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  variant = "default",
  className = "",
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    // Simulate newsletter subscription
    try {
      // Here you would typically make an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Newsletter subscription:", email);
      setEmail("");
      // You could show a toast notification here
    } catch (error) {
      console.error("Newsletter subscription failed:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Minimal footer for dashboard pages
  if (variant === "minimal") {
    return (
      <footer
        className={`border-t transition-all duration-300 backdrop-blur-md ${
          theme === "light"
            ? "bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white border-gray-200/50 dark:border-gray-700/50"
            : "bg-gray-900/80 text-white border-gray-700/50"
        } ${className}`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={logoImage}
                alt="ChefSync"
                className="h-8 w-8 rounded-lg shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = logoSvg;
                }}
              />
              <span
                className={`text-sm transition-colors duration-300 ${
                  theme === "light"
                    ? "text-gray-600 dark:text-gray-400"
                    : "text-gray-400"
                }`}
              >
                © 2024 ChefSync. All rights reserved.
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/about"
                className={`text-sm transition-colors duration-300 ${
                  theme === "light"
                    ? "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                    : "text-gray-400 hover:text-orange-400"
                }`}
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className={`text-sm transition-colors duration-300 ${
                  theme === "light"
                    ? "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                    : "text-gray-400 hover:text-orange-400"
                }`}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Dashboard footer for authenticated users
  if (variant === "dashboard") {
    return (
      <footer className={`mt-auto relative overflow-hidden ${className}`}>
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            theme === "light"
              ? "bg-gradient-to-r from-white/95 via-orange-50/90 to-white/95"
              : "bg-gradient-to-r from-gray-900/95 via-slate-900/90 to-gray-900/95"
          }`}
        />

        {/* Glass morphism overlay */}
        <div className="absolute inset-0 backdrop-blur-md" />
        <div
          className={`absolute inset-0 border-t transition-all duration-300 ${
            theme === "light" ? "border-orange-200/60" : "border-gray-700/60"
          }`}
        />

        <div
          className={`relative z-10 transition-all duration-300 ${
            theme === "light" ? "text-gray-900" : "text-white"
          }`}
        >
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <img
                    src={logoImage}
                    alt="ChefSync"
                    className="h-12 w-12 rounded-xl shadow-lg border-2 border-orange-200/40 dark:border-orange-300/30"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = logoSvg;
                    }}
                  />
                  <span
                    className={`font-semibold text-xl transition-colors duration-300 ${
                      theme === "light"
                        ? "text-gray-900 dark:text-white"
                        : "text-white"
                    }`}
                  >
                    ChefSync
                  </span>
                </div>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    theme === "light"
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-400"
                  }`}
                >
                  Making food delivery smarter
                </span>
              </div>

              <div
                className={`flex items-center space-x-6 text-sm transition-colors duration-300 ${
                  theme === "light"
                    ? "text-gray-600 dark:text-gray-400"
                    : "text-gray-400"
                }`}
              >
                <Link
                  to="/about"
                  className={`transition-colors duration-300 ${
                    theme === "light"
                      ? "hover:text-orange-600 dark:hover:text-orange-400"
                      : "hover:text-orange-400"
                  }`}
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className={`transition-colors duration-300 ${
                    theme === "light"
                      ? "hover:text-orange-600 dark:hover:text-orange-400"
                      : "hover:text-orange-400"
                  }`}
                >
                  Contact Us
                </Link>
                <span>© 2024 ChefSync</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Default full footer for public pages
  return (
    <footer className={`relative overflow-hidden ${className}`}>
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          theme === "light"
            ? "bg-gradient-to-br from-red-900/90 via-amber-900/85 to-yellow-900/90"
            : "bg-gradient-to-br from-gray-900/95 via-slate-900/90 to-black/95"
        }`}
      />

      {/* Glass morphism overlay */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      <div className="relative z-10 container mx-auto px-4 py-12 text-white">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex flex-col items-center lg:items-start space-y-3">
              <img
                src={logoImage}
                alt="ChefSync Logo"
                className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl shadow-2xl border-4 border-amber-200/40"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = logoSvg;
                }}
              />
              <span className="text-3xl lg:text-4xl font-bold text-white">
                ChefSync
              </span>
            </div>
            <p className="text-white/90 max-w-md text-center lg:text-left">
              Connecting food lovers with amazing local chefs. Experience
              authentic, home-cooked meals delivered fresh to your doorstep.
            </p>
            <div className="flex space-x-3 justify-center lg:justify-start">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 hover:text-white transition-all duration-300 transform hover:scale-110"
                onClick={() =>
                  window.open(
                    "https://www.facebook.com/share/1KUqDabNZB/?mibextid=wwXIfr",
                    "_blank"
                  )
                }
              >
                <Facebook size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 hover:text-white transition-all duration-300 transform hover:scale-110"
                onClick={() =>
                  window.open("https://x.com/srilanka?s=21", "_blank")
                }
              >
                <Twitter size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 hover:text-white transition-all duration-300 transform hover:scale-110"
                onClick={() =>
                  window.open(
                    "https://www.instagram.com/aajunek?igsh=dmhhazVtaHFsMDJ2",
                    "_blank"
                  )
                }
              >
                <Instagram size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 hover:text-white transition-all duration-300 transform hover:scale-110"
                onClick={() => window.open("https://youtube.com", "_blank")}
              >
                <Youtube size={20} />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <div className="space-y-2">
              <Link
                to="/"
                className="block text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300"
              >
                Home
              </Link>
              <Link
                to="/menu"
                className="block text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300"
              >
                Browse Menu
              </Link>
              <Link
                to="/about"
                className="block text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="block text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300"
              >
                Contact Us
              </Link>
              <Button
                variant="link"
                className="p-0 h-auto text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300"
                onClick={() => navigate("/auth/register")}
              >
                Become a Chef
              </Button>
            </div>
          </div>

          {/* Support & Legal */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Support</h3>
            <div className="space-y-2">
              <Button
                variant="link"
                className="p-0 h-auto text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300 justify-start"
                onClick={() => navigate("/help")}
              >
                Help Center
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300 justify-start"
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300 justify-start"
                onClick={() => navigate("/terms")}
              >
                Terms of Service
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300 justify-start"
                onClick={() => navigate("/refund")}
              >
                Refund Policy
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-white/80 hover:text-white transition-colors hover:translate-x-1 duration-300 justify-start"
                onClick={() => navigate("/faq")}
              >
                FAQ
              </Button>
            </div>
          </div>

          {/* Newsletter & Contact */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Stay Connected</h3>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <p className="text-sm text-white/80">
                Get updates on new chefs, special offers, and delicious recipes!
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-r-none border-r-0 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  />
                  <Button
                    type="submit"
                    disabled={isSubscribing}
                    className="rounded-l-none bg-white/20 hover:bg-white/30 text-white border border-white/20 hover:border-white/40"
                  >
                    {isSubscribing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div
                className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors cursor-pointer"
                onClick={() =>
                  window.open("mailto:chefsync7@gmail.com", "_self")
                }
              >
                <Mail size={16} />
                <span>chefsync7@gmail.com</span>
              </div>
              <div
                className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors cursor-pointer"
                onClick={() => window.open("tel:+94768035092", "_self")}
              >
                <Phone size={16} />
                <span>+94 76 803 5092</span>
              </div>
              <div
                className="flex items-start space-x-2 text-white/90 hover:text-white transition-colors cursor-pointer"
                onClick={() =>
                  window.open(
                    "https://maps.google.com/?q=412-196+Nallur-Oddumadam+Rd,+Jaffna",
                    "_blank"
                  )
                }
              >
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Near 412-196 Nallur-Oddumadam Rd
                  <br />
                  Jaffna, Sri Lanka
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-1 text-sm text-white/80">
              <span>© 2024 ChefSync. Made with</span>
              <Heart size={14} className="text-amber-300 animate-pulse" />
              <span>for food lovers everywhere.</span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-white/80">
                <ChefHat size={14} />
                <span>Trusted by 500+ chefs</span>
              </div>
              <div className="flex items-center space-x-1 text-white/80">
                <span>🌟 4.8/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
