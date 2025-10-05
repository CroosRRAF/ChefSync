/**
 * Accessibility Utilities
 *
 * Provides utilities for improving accessibility, ARIA attributes,
 * keyboard navigation, and screen reader support.
 */

// ARIA attribute utilities
export interface AriaProps {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  hidden?: boolean;
  live?: "off" | "polite" | "assertive";
  busy?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  checked?: boolean;
  selected?: boolean;
  pressed?: boolean;
  orientation?: "horizontal" | "vertical";
  level?: number;
  setSize?: number;
  posInSet?: number;
}

export function generateAriaProps(
  props: AriaProps
): Record<string, string | boolean | number> {
  const ariaProps: Record<string, string | boolean | number> = {};

  if (props.label) ariaProps["aria-label"] = props.label;
  if (props.labelledBy) ariaProps["aria-labelledby"] = props.labelledBy;
  if (props.describedBy) ariaProps["aria-describedby"] = props.describedBy;
  if (props.expanded !== undefined) ariaProps["aria-expanded"] = props.expanded;
  if (props.hidden !== undefined) ariaProps["aria-hidden"] = props.hidden;
  if (props.live) ariaProps["aria-live"] = props.live;
  if (props.busy !== undefined) ariaProps["aria-busy"] = props.busy;
  if (props.disabled !== undefined) ariaProps["aria-disabled"] = props.disabled;
  if (props.required !== undefined) ariaProps["aria-required"] = props.required;
  if (props.invalid !== undefined) ariaProps["aria-invalid"] = props.invalid;
  if (props.checked !== undefined) ariaProps["aria-checked"] = props.checked;
  if (props.selected !== undefined) ariaProps["aria-selected"] = props.selected;
  if (props.pressed !== undefined) ariaProps["aria-pressed"] = props.pressed;
  if (props.orientation) ariaProps["aria-orientation"] = props.orientation;
  if (props.level) ariaProps["aria-level"] = props.level;
  if (props.setSize) ariaProps["aria-setsize"] = props.setSize;
  if (props.posInSet) ariaProps["aria-posinset"] = props.posInSet;

  return ariaProps;
}

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    "details",
    "summary",
    "iframe",
    "object",
    "embed",
    "area[href]",
    "audio[controls]",
    "video[controls]",
    "[contenteditable]",
  ].join(", ");

  static getFocusableElements(container: Element = document.body): Element[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  static getFirstFocusableElement(
    container: Element = document.body
  ): Element | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[0] || null;
  }

  static getLastFocusableElement(
    container: Element = document.body
  ): Element | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
  }

  static trapFocus(container: Element, event: KeyboardEvent) {
    if (event.key !== "Tab") return;

    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        event.preventDefault();
      }
    }
  }

  static restoreFocus(element: HTMLElement | null) {
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  }
}

// Keyboard navigation utilities
export interface KeyboardNavConfig {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onTab?: (event: KeyboardEvent) => void;
}

export function handleKeyboardNavigation(
  event: KeyboardEvent,
  config: KeyboardNavConfig
) {
  switch (event.key) {
    case "Enter":
      config.onEnter?.();
      break;
    case " ":
    case "Space":
      config.onSpace?.();
      event.preventDefault();
      break;
    case "Escape":
      config.onEscape?.();
      break;
    case "ArrowUp":
      config.onArrowUp?.();
      event.preventDefault();
      break;
    case "ArrowDown":
      config.onArrowDown?.();
      event.preventDefault();
      break;
    case "ArrowLeft":
      config.onArrowLeft?.();
      event.preventDefault();
      break;
    case "ArrowRight":
      config.onArrowRight?.();
      event.preventDefault();
      break;
    case "Home":
      config.onHome?.();
      event.preventDefault();
      break;
    case "End":
      config.onEnd?.();
      event.preventDefault();
      break;
    case "Tab":
      config.onTab?.(event);
      break;
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  static announce(
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  static createVisuallyHidden(text: string): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = "sr-only";
    span.textContent = text;
    return span;
  }

  static updateLiveRegion(element: Element, message: string) {
    element.textContent = message;
  }
}

// Color contrast utilities
export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  luminance: number;
}

export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;

  const sRGB = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function isAccessibleContrast(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA"
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === "AA" ? ratio >= 4.5 : ratio >= 7;
}

// Form accessibility utilities
export interface FormFieldAccessibility {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export function generateFormFieldProps(config: FormFieldAccessibility) {
  const props: Record<string, string | boolean> = {
    id: config.id,
    "aria-label": config.label,
  };

  if (config.required) {
    props["aria-required"] = true;
    props.required = true;
  }

  if (config.description) {
    const descriptionId = `${config.id}-description`;
    props["aria-describedby"] = descriptionId;
  }

  if (config.error) {
    const errorId = `${config.id}-error`;
    props["aria-describedby"] = props["aria-describedby"]
      ? `${props["aria-describedby"]} ${errorId}`
      : errorId;
    props["aria-invalid"] = true;
  }

  return props;
}

// Skip link utilities
export function createSkipLink(
  target: string,
  text: string = "Skip to main content"
): HTMLAnchorElement {
  const skipLink = document.createElement("a");
  skipLink.href = `#${target}`;
  skipLink.textContent = text;
  skipLink.className =
    "skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white";

  skipLink.addEventListener("click", (e) => {
    e.preventDefault();
    const targetElement = document.getElementById(target);
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView();
    }
  });

  return skipLink;
}

// Reduced motion utilities
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function respectMotionPreference(callback: () => void) {
  if (!prefersReducedMotion()) {
    callback();
  }
}

export default {
  generateAriaProps,
  FocusManager,
  handleKeyboardNavigation,
  ScreenReaderUtils,
  getContrastRatio,
  isAccessibleContrast,
  generateFormFieldProps,
  createSkipLink,
  prefersReducedMotion,
  respectMotionPreference,
};
