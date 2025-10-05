/**
 * Enhanced Theme and Animation System
 *
 * Provides comprehensive theming, animation utilities,
 * and visual consistency across the admin system.
 */

// Theme Configuration
export interface ThemeConfig {
  colors: {
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    secondary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
    gray: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: Record<string, [string, string]>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  breakpoints: Record<string, string>;
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      serif: ["Georgia", "serif"],
      mono: ["Menlo", "Monaco", "monospace"],
    },
    fontSize: {
      xs: ["0.75rem", "1rem"],
      sm: ["0.875rem", "1.25rem"],
      base: ["1rem", "1.5rem"],
      lg: ["1.125rem", "1.75rem"],
      xl: ["1.25rem", "1.75rem"],
      "2xl": ["1.5rem", "2rem"],
      "3xl": ["1.875rem", "2.25rem"],
      "4xl": ["2.25rem", "2.5rem"],
      "5xl": ["3rem", "1"],
      "6xl": ["3.75rem", "1"],
    },
    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    lineHeight: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
  },
  spacing: {
    px: "1px",
    0: "0",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  boxShadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};

// Animation presets
export const animations = {
  // Entrance animations
  entrance: {
    fadeIn: {
      keyframes: {
        "0%": { opacity: "0" },
        "100%": { opacity: "1" },
      },
      duration: "300ms",
      easing: "ease-out",
    },
    slideInUp: {
      keyframes: {
        "0%": {
          opacity: "0",
          transform: "translateY(20px)",
        },
        "100%": {
          opacity: "1",
          transform: "translateY(0)",
        },
      },
      duration: "300ms",
      easing: "ease-out",
    },
    slideInRight: {
      keyframes: {
        "0%": {
          opacity: "0",
          transform: "translateX(20px)",
        },
        "100%": {
          opacity: "1",
          transform: "translateX(0)",
        },
      },
      duration: "300ms",
      easing: "ease-out",
    },
    scaleIn: {
      keyframes: {
        "0%": {
          opacity: "0",
          transform: "scale(0.9)",
        },
        "100%": {
          opacity: "1",
          transform: "scale(1)",
        },
      },
      duration: "200ms",
      easing: "ease-out",
    },
  },

  // Exit animations
  exit: {
    fadeOut: {
      keyframes: {
        "0%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      duration: "200ms",
      easing: "ease-in",
    },
    slideOutDown: {
      keyframes: {
        "0%": {
          opacity: "1",
          transform: "translateY(0)",
        },
        "100%": {
          opacity: "0",
          transform: "translateY(20px)",
        },
      },
      duration: "200ms",
      easing: "ease-in",
    },
    scaleOut: {
      keyframes: {
        "0%": {
          opacity: "1",
          transform: "scale(1)",
        },
        "100%": {
          opacity: "0",
          transform: "scale(0.9)",
        },
      },
      duration: "200ms",
      easing: "ease-in",
    },
  },

  // Hover effects
  hover: {
    lift: {
      keyframes: {
        "0%": { transform: "translateY(0)" },
        "100%": { transform: "translateY(-2px)" },
      },
      duration: "200ms",
      easing: "ease-out",
    },
    scale: {
      keyframes: {
        "0%": { transform: "scale(1)" },
        "100%": { transform: "scale(1.05)" },
      },
      duration: "200ms",
      easing: "ease-out",
    },
    glow: {
      keyframes: {
        "0%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)" },
        "100%": { boxShadow: "0 0 0 8px rgba(59, 130, 246, 0)" },
      },
      duration: "600ms",
      easing: "ease-out",
    },
  },

  // Loading animations
  loading: {
    spin: {
      keyframes: {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
      },
      duration: "1000ms",
      easing: "linear",
      iterationCount: "infinite",
    },
    pulse: {
      keyframes: {
        "0%, 100%": { opacity: "1" },
        "50%": { opacity: "0.5" },
      },
      duration: "2000ms",
      easing: "ease-in-out",
      iterationCount: "infinite",
    },
    bounce: {
      keyframes: {
        "0%, 20%, 53%, 80%, 100%": { transform: "translate3d(0,0,0)" },
        "40%, 43%": { transform: "translate3d(0, -30px, 0)" },
        "70%": { transform: "translate3d(0, -15px, 0)" },
        "90%": { transform: "translate3d(0, -4px, 0)" },
      },
      duration: "1000ms",
      easing: "ease-in-out",
      iterationCount: "infinite",
    },
    wave: {
      keyframes: {
        "0%, 60%, 100%": { transform: "initial" },
        "30%": { transform: "translateY(-15px)" },
      },
      duration: "600ms",
      easing: "ease-in-out",
      iterationCount: "infinite",
    },
  },
};

// Transition utilities
export const transitions = {
  none: "none",
  all: "all 150ms ease-in-out",
  colors:
    "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out",
  opacity: "opacity 150ms ease-in-out",
  shadow: "box-shadow 150ms ease-in-out",
  transform: "transform 150ms ease-in-out",
  fast: "all 100ms ease-in-out",
  slow: "all 300ms ease-in-out",
};

// Animation utilities
export class AnimationManager {
  private static appliedAnimations = new Map<Element, string[]>();

  static apply(
    element: Element,
    animationType: string,
    config?: Partial<CSSStyleDeclaration>
  ) {
    if (!element) return;

    const animationId = `anim-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store applied animation
    const current = this.appliedAnimations.get(element) || [];
    current.push(animationId);
    this.appliedAnimations.set(element, current);

    // Apply animation styles
    const animationStyles = this.getAnimationStyles(animationType);
    Object.assign(element.style, animationStyles, config);

    return animationId;
  }

  static remove(element: Element, animationId?: string) {
    if (!element) return;

    if (animationId) {
      const current = this.appliedAnimations.get(element) || [];
      const filtered = current.filter((id) => id !== animationId);
      this.appliedAnimations.set(element, filtered);
    } else {
      this.appliedAnimations.delete(element);
    }

    // Reset animation styles
    element.style.animation = "";
    element.style.transition = "";
  }

  private static getAnimationStyles(
    animationType: string
  ): Partial<CSSStyleDeclaration> {
    // Map animation types to CSS animation strings
    const animationMap: Record<string, string> = {
      fadeIn: "fadeIn 300ms ease-out",
      slideInUp: "slideInUp 300ms ease-out",
      slideInRight: "slideInRight 300ms ease-out",
      scaleIn: "scaleIn 200ms ease-out",
      fadeOut: "fadeOut 200ms ease-in",
      slideOutDown: "slideOutDown 200ms ease-in",
      scaleOut: "scaleOut 200ms ease-in",
      spin: "spin 1000ms linear infinite",
      pulse: "pulse 2000ms ease-in-out infinite",
      bounce: "bounce 1000ms ease-in-out infinite",
    };

    return {
      animation: animationMap[animationType] || "",
    };
  }
}

// CSS-in-JS utilities
export function generateCSS(theme: ThemeConfig): string {
  return `
    /* Keyframes */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
      40%, 43% { transform: translate3d(0, -30px, 0); }
      70% { transform: translate3d(0, -15px, 0); }
      90% { transform: translate3d(0, -4px, 0); }
    }

    /* CSS Custom Properties */
    :root {
      --primary-50: ${theme.colors.primary["50"]};
      --primary-100: ${theme.colors.primary["100"]};
      --primary-500: ${theme.colors.primary["500"]};
      --primary-600: ${theme.colors.primary["600"]};
      --primary-700: ${theme.colors.primary["700"]};

      --gray-50: ${theme.colors.gray["50"]};
      --gray-100: ${theme.colors.gray["100"]};
      --gray-200: ${theme.colors.gray["200"]};
      --gray-300: ${theme.colors.gray["300"]};
      --gray-400: ${theme.colors.gray["400"]};
      --gray-500: ${theme.colors.gray["500"]};
      --gray-600: ${theme.colors.gray["600"]};
      --gray-700: ${theme.colors.gray["700"]};
      --gray-800: ${theme.colors.gray["800"]};
      --gray-900: ${theme.colors.gray["900"]};

      --success: ${theme.colors.success};
      --warning: ${theme.colors.warning};
      --error: ${theme.colors.error};
      --info: ${theme.colors.info};

      --font-sans: ${theme.typography.fontFamily.sans.join(", ")};
      --border-radius: ${theme.borderRadius.DEFAULT};
      --border-radius-lg: ${theme.borderRadius.lg};

      --shadow-sm: ${theme.boxShadow.sm};
      --shadow: ${theme.boxShadow.DEFAULT};
      --shadow-lg: ${theme.boxShadow.lg};
    }

    /* Utility Classes */
    .animate-fadeIn { animation: fadeIn 300ms ease-out; }
    .animate-slideInUp { animation: slideInUp 300ms ease-out; }
    .animate-slideInRight { animation: slideInRight 300ms ease-out; }
    .animate-scaleIn { animation: scaleIn 200ms ease-out; }
    .animate-spin { animation: spin 1000ms linear infinite; }
    .animate-pulse { animation: pulse 2000ms ease-in-out infinite; }
    .animate-bounce { animation: bounce 1000ms ease-in-out infinite; }

    .transition-all { transition: all 150ms ease-in-out; }
    .transition-colors { transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out; }
    .transition-opacity { transition: opacity 150ms ease-in-out; }
    .transition-transform { transition: transform 150ms ease-in-out; }

    .hover\\:scale-105:hover { transform: scale(1.05); }
    .hover\\:shadow-lg:hover { box-shadow: var(--shadow-lg); }
    .hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .focus\\:not-sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `;
}

// Theme context utilities
export interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  isDark: boolean;
  toggleDarkMode: () => void;
}

export function createThemeContext(): ThemeContextType {
  let currentTheme = { ...defaultTheme };
  let isDark = false;

  return {
    theme: currentTheme,
    updateTheme: (updates: Partial<ThemeConfig>) => {
      currentTheme = { ...currentTheme, ...updates };
    },
    isDark,
    toggleDarkMode: () => {
      isDark = !isDark;
      document.documentElement.classList.toggle("dark", isDark);
    },
  };
}

export default {
  defaultTheme,
  animations,
  transitions,
  AnimationManager,
  generateCSS,
  createThemeContext,
};
