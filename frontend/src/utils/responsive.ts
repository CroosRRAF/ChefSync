/**
 * Responsive Design Utilities
 *
 * Provides utilities for responsive design, breakpoint management,
 * and adaptive UI components.
 */

// Breakpoint definitions
export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Media query utilities
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  "2xl": `(min-width: ${breakpoints["2xl"]})`,
  // Max width queries
  "max-xs": `(max-width: calc(${breakpoints.sm} - 1px))`,
  "max-sm": `(max-width: calc(${breakpoints.md} - 1px))`,
  "max-md": `(max-width: calc(${breakpoints.lg} - 1px))`,
  "max-lg": `(max-width: calc(${breakpoints.xl} - 1px))`,
  "max-xl": `(max-width: calc(${breakpoints["2xl"]} - 1px))`,
} as const;

// Viewport utilities
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: "portrait" | "landscape";
  breakpoint: Breakpoint;
}

export function getViewportInfo(): ViewportInfo {
  if (typeof window === "undefined") {
    return {
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: "landscape",
      breakpoint: "lg",
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const orientation = width > height ? "landscape" : "portrait";

  let breakpoint: Breakpoint = "xs";
  if (width >= 1536) breakpoint = "2xl";
  else if (width >= 1280) breakpoint = "xl";
  else if (width >= 1024) breakpoint = "lg";
  else if (width >= 768) breakpoint = "md";
  else if (width >= 640) breakpoint = "sm";

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    orientation,
    breakpoint,
  };
}

// Responsive value utility
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

export function getResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  if (typeof value !== "object" || value === null) {
    return value as T;
  }

  const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  // Look for the closest breakpoint value
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (bp in value && value[bp] !== undefined) {
      return value[bp] as T;
    }
  }

  // Fallback to the first available value
  const firstKey = Object.keys(value)[0] as Breakpoint;
  return value[firstKey] as T;
}

// Grid system utilities
export interface GridConfig {
  columns: ResponsiveValue<number>;
  gap: ResponsiveValue<string>;
  maxWidth?: string;
}

export function generateGridClasses(
  config: GridConfig,
  breakpoint: Breakpoint
): string {
  const columns = getResponsiveValue(config.columns, breakpoint);
  const gap = getResponsiveValue(config.gap, breakpoint);

  return [
    `grid`,
    `grid-cols-${columns}`,
    `gap-${gap}`,
    config.maxWidth && `max-w-${config.maxWidth}`,
  ]
    .filter(Boolean)
    .join(" ");
}

// Container utilities
export interface ContainerConfig {
  maxWidth?: ResponsiveValue<string>;
  padding?: ResponsiveValue<string>;
  margin?: ResponsiveValue<string>;
}

export function generateContainerClasses(
  config: ContainerConfig,
  breakpoint: Breakpoint
): string {
  const maxWidth = config.maxWidth
    ? getResponsiveValue(config.maxWidth, breakpoint)
    : null;
  const padding = config.padding
    ? getResponsiveValue(config.padding, breakpoint)
    : null;
  const margin = config.margin
    ? getResponsiveValue(config.margin, breakpoint)
    : null;

  return [
    "container",
    "mx-auto",
    maxWidth && `max-w-${maxWidth}`,
    padding && `px-${padding}`,
    margin && `mx-${margin}`,
  ]
    .filter(Boolean)
    .join(" ");
}

// Typography utilities
export interface TypographyConfig {
  fontSize: ResponsiveValue<string>;
  lineHeight?: ResponsiveValue<string>;
  fontWeight?: ResponsiveValue<string>;
}

export function generateTypographyClasses(
  config: TypographyConfig,
  breakpoint: Breakpoint
): string {
  const fontSize = getResponsiveValue(config.fontSize, breakpoint);
  const lineHeight = config.lineHeight
    ? getResponsiveValue(config.lineHeight, breakpoint)
    : null;
  const fontWeight = config.fontWeight
    ? getResponsiveValue(config.fontWeight, breakpoint)
    : null;

  return [
    `text-${fontSize}`,
    lineHeight && `leading-${lineHeight}`,
    fontWeight && `font-${fontWeight}`,
  ]
    .filter(Boolean)
    .join(" ");
}

// Spacing utilities
export interface SpacingConfig {
  margin?: ResponsiveValue<string>;
  padding?: ResponsiveValue<string>;
  marginTop?: ResponsiveValue<string>;
  marginBottom?: ResponsiveValue<string>;
  marginLeft?: ResponsiveValue<string>;
  marginRight?: ResponsiveValue<string>;
  paddingTop?: ResponsiveValue<string>;
  paddingBottom?: ResponsiveValue<string>;
  paddingLeft?: ResponsiveValue<string>;
  paddingRight?: ResponsiveValue<string>;
}

export function generateSpacingClasses(
  config: SpacingConfig,
  breakpoint: Breakpoint
): string {
  const classes = [];

  if (config.margin)
    classes.push(`m-${getResponsiveValue(config.margin, breakpoint)}`);
  if (config.padding)
    classes.push(`p-${getResponsiveValue(config.padding, breakpoint)}`);
  if (config.marginTop)
    classes.push(`mt-${getResponsiveValue(config.marginTop, breakpoint)}`);
  if (config.marginBottom)
    classes.push(`mb-${getResponsiveValue(config.marginBottom, breakpoint)}`);
  if (config.marginLeft)
    classes.push(`ml-${getResponsiveValue(config.marginLeft, breakpoint)}`);
  if (config.marginRight)
    classes.push(`mr-${getResponsiveValue(config.marginRight, breakpoint)}`);
  if (config.paddingTop)
    classes.push(`pt-${getResponsiveValue(config.paddingTop, breakpoint)}`);
  if (config.paddingBottom)
    classes.push(`pb-${getResponsiveValue(config.paddingBottom, breakpoint)}`);
  if (config.paddingLeft)
    classes.push(`pl-${getResponsiveValue(config.paddingLeft, breakpoint)}`);
  if (config.paddingRight)
    classes.push(`pr-${getResponsiveValue(config.paddingRight, breakpoint)}`);

  return classes.join(" ");
}

// Device detection utilities
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isRetina: boolean;
  userAgent: string;
  platform: string;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      isRetina: false,
      userAgent: "",
      platform: "",
    };
  }

  const { width } = getViewportInfo();
  const userAgent = navigator.userAgent.toLowerCase();
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isRetina = window.devicePixelRatio > 1;

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isTouchDevice,
    isRetina,
    userAgent,
    platform: navigator.platform,
  };
}

// Responsive image utilities
export interface ResponsiveImageConfig {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  className?: string;
}

export function generateResponsiveImageProps(config: ResponsiveImageConfig) {
  return {
    src: config.src,
    srcSet: config.srcSet,
    sizes:
      config.sizes ||
      "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    alt: config.alt,
    width: config.width,
    height: config.height,
    loading: config.loading || "lazy",
    className: config.className,
  };
}

// CSS custom properties for responsive values
export function generateCSSCustomProperties(
  values: Record<string, ResponsiveValue<string>>
): string {
  const { breakpoint } = getViewportInfo();

  return Object.entries(values)
    .map(
      ([key, value]) => `--${key}: ${getResponsiveValue(value, breakpoint)};`
    )
    .join(" ");
}

export default {
  breakpoints,
  mediaQueries,
  getViewportInfo,
  getResponsiveValue,
  generateGridClasses,
  generateContainerClasses,
  generateTypographyClasses,
  generateSpacingClasses,
  getDeviceInfo,
  generateResponsiveImageProps,
  generateCSSCustomProperties,
};
