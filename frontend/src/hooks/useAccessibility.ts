import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for managing focus trap within a component
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  items: any[],
  onSelect?: (item: any, index: number) => void,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
  } = {}
) {
  const { loop = true, orientation = 'vertical', disabled = false } = options;
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || items.length === 0) return;

    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev + 1;
          return next >= items.length ? (loop ? 0 : prev) : next;
        });
        break;

      case prevKey:
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev - 1;
          return next < 0 ? (loop ? items.length - 1 : prev) : next;
        });
        break;

      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;

      case 'Enter':
      case ' ':
        if (activeIndex >= 0 && onSelect) {
          e.preventDefault();
          onSelect(items[activeIndex], activeIndex);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setActiveIndex(-1);
        break;
    }
  }, [items, activeIndex, onSelect, loop, orientation, disabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
    activeIndex,
    setActiveIndex,
  };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);

    // Create a live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
      setAnnouncements(prev => prev.filter(a => a !== message));
    }, 1000);
  }, []);

  return { announce, announcements };
}

/**
 * Hook for managing ARIA attributes
 */
export function useAriaAttributes(
  initialAttributes: Record<string, string | boolean | number> = {}
) {
  const [attributes, setAttributes] = useState(initialAttributes);

  const updateAttribute = useCallback((key: string, value: string | boolean | number) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeAttribute = useCallback((key: string) => {
    setAttributes(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getAriaProps = useCallback(() => {
    const ariaProps: Record<string, any> = {};
    
    Object.entries(attributes).forEach(([key, value]) => {
      const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
      ariaProps[ariaKey] = value;
    });

    return ariaProps;
  }, [attributes]);

  return {
    attributes,
    updateAttribute,
    removeAttribute,
    getAriaProps,
  };
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for color contrast and theme preferences
 */
export function useColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  return {
    colorScheme,
    setColorScheme,
    prefersHighContrast,
  };
}

/**
 * Hook for skip links navigation
 */
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLElement>(null);
  const [skipLinks, setSkipLinks] = useState<Array<{
    id: string;
    label: string;
    target: string;
  }>>([]);

  const addSkipLink = useCallback((id: string, label: string, target: string) => {
    setSkipLinks(prev => [...prev.filter(link => link.id !== id), { id, label, target }]);
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  const skipTo = useCallback((target: string) => {
    const element = document.querySelector(target) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return {
    skipLinksRef,
    skipLinks,
    addSkipLink,
    removeSkipLink,
    skipTo,
  };
}

/**
 * Hook for form accessibility
 */
export function useFormAccessibility(formId: string) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const { [fieldName]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const setFieldTouched = useCallback((fieldName: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = errors[fieldName] && touched[fieldName];
    
    return {
      'aria-describedby': hasError ? `${formId}-${fieldName}-error` : undefined,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-required': 'true',
    };
  }, [errors, touched, formId]);

  const getErrorProps = useCallback((fieldName: string) => {
    const hasError = errors[fieldName] && touched[fieldName];
    
    return {
      id: `${formId}-${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite',
      style: { display: hasError ? 'block' : 'none' },
    };
  }, [errors, touched, formId]);

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    getFieldProps,
    getErrorProps,
  };
}

export default {
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReader,
  useAriaAttributes,
  useReducedMotion,
  useColorScheme,
  useSkipLinks,
  useFormAccessibility,
};
