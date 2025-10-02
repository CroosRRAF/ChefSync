// Mobile Responsiveness Testing Utilities for ChefSync Admin
// Tests responsive design across different device sizes and orientations

interface DeviceViewport {
  name: string;
  width: number;
  height: number;
  devicePixelRatio: number;
  userAgent: string;
  category: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

interface ResponsiveIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  device: string;
  description: string;
  element: string;
  suggestion: string;
  screenshot?: string;
}

interface ResponsiveTestResult {
  device: DeviceViewport;
  passed: boolean;
  issues: ResponsiveIssue[];
  score: number;
  timestamp: Date;
}

class ResponsiveTester {
  private commonDevices: DeviceViewport[] = [
    // Mobile Devices
    {
      name: 'iPhone 12 Pro',
      width: 390,
      height: 844,
      devicePixelRatio: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      category: 'mobile',
      orientation: 'portrait',
    },
    {
      name: 'iPhone 12 Pro Landscape',
      width: 844,
      height: 390,
      devicePixelRatio: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      category: 'mobile',
      orientation: 'landscape',
    },
    {
      name: 'Samsung Galaxy S21',
      width: 384,
      height: 854,
      devicePixelRatio: 2.75,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      category: 'mobile',
      orientation: 'portrait',
    },
    {
      name: 'Samsung Galaxy S21 Landscape',
      width: 854,
      height: 384,
      devicePixelRatio: 2.75,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      category: 'mobile',
      orientation: 'landscape',
    },
    
    // Tablet Devices
    {
      name: 'iPad Pro 11"',
      width: 834,
      height: 1194,
      devicePixelRatio: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      category: 'tablet',
      orientation: 'portrait',
    },
    {
      name: 'iPad Pro 11" Landscape',
      width: 1194,
      height: 834,
      devicePixelRatio: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      category: 'tablet',
      orientation: 'landscape',
    },
    {
      name: 'Samsung Galaxy Tab S7',
      width: 753,
      height: 1037,
      devicePixelRatio: 2.4,
      userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-T870) AppleWebKit/537.36',
      category: 'tablet',
      orientation: 'portrait',
    },
    
    // Desktop Devices
    {
      name: 'Desktop 1920x1080',
      width: 1920,
      height: 1080,
      devicePixelRatio: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      category: 'desktop',
      orientation: 'landscape',
    },
    {
      name: 'Desktop 1366x768',
      width: 1366,
      height: 768,
      devicePixelRatio: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      category: 'desktop',
      orientation: 'landscape',
    },
  ];

  private currentDevice: DeviceViewport | null = null;
  private originalViewport: { width: number; height: number } | null = null;

  constructor() {
    this.saveOriginalViewport();
  }

  // Save original viewport dimensions
  private saveOriginalViewport(): void {
    if (typeof window !== 'undefined') {
      this.originalViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
  }

  // Simulate device viewport
  async simulateDevice(device: DeviceViewport): Promise<void> {
    if (typeof window === 'undefined') return;

    this.currentDevice = device;

    // Set viewport dimensions
    if (window.visualViewport) {
      // Modern browsers with Visual Viewport API
      document.documentElement.style.width = `${device.width}px`;
      document.documentElement.style.height = `${device.height}px`;
    }

    // Set device pixel ratio
    if ('devicePixelRatio' in window) {
      // Can't actually change devicePixelRatio, but we can simulate it in CSS
      document.documentElement.style.setProperty('--device-pixel-ratio', device.devicePixelRatio.toString());
    }

    // Add device class for CSS targeting
    document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    document.body.classList.add(`${device.category}-device`);
    document.body.classList.add(`${device.orientation}-orientation`);

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Restore original viewport
  async restoreViewport(): Promise<void> {
    if (typeof window === 'undefined' || !this.originalViewport) return;

    // Remove device classes
    document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    document.body.classList.remove('portrait-orientation', 'landscape-orientation');

    // Reset styles
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';
    document.documentElement.style.removeProperty('--device-pixel-ratio');

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    this.currentDevice = null;
  }

  // Test responsive design on a specific device
  async testDevice(device: DeviceViewport): Promise<ResponsiveTestResult> {
    const issues: ResponsiveIssue[] = [];

    try {
      // Simulate device
      await this.simulateDevice(device);

      // Run responsive tests
      await this.testLayoutBreakpoints(device, issues);
      await this.testTextReadability(device, issues);
      await this.testTouchTargets(device, issues);
      await this.testScrolling(device, issues);
      await this.testNavigation(device, issues);
      await this.testImages(device, issues);
      await this.testForms(device, issues);

      // Calculate score
      const totalTests = 7;
      const failedTests = issues.filter(i => i.severity === 'error').length;
      const score = Math.max(0, Math.round(((totalTests - failedTests) / totalTests) * 100));

      return {
        device,
        passed: failedTests === 0,
        issues,
        score,
        timestamp: new Date(),
      };
    } finally {
      // Always restore viewport
      await this.restoreViewport();
    }
  }

  // Test all devices
  async testAllDevices(): Promise<ResponsiveTestResult[]> {
    const results: ResponsiveTestResult[] = [];

    for (const device of this.commonDevices) {
      const result = await this.testDevice(device);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Test layout breakpoints
  private async testLayoutBreakpoints(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    // Check if elements are properly sized for the viewport
    const elements = document.querySelectorAll('*');
    
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      
      // Check for horizontal overflow
      if (rect.width > device.width) {
        issues.push({
          id: `overflow-${issues.length}`,
          severity: 'error',
          device: device.name,
          description: `Element overflows viewport width (${rect.width}px > ${device.width}px)`,
          element: this.getElementSelector(element),
          suggestion: 'Use responsive units (%, vw, rem) or media queries to prevent overflow',
        });
      }

      // Check for elements that are too small on mobile
      if (device.category === 'mobile' && rect.width < 44 && rect.height < 44) {
        const isInteractive = element.matches('button, a, input, select, textarea, [onclick], [tabindex]');
        if (isInteractive) {
          issues.push({
            id: `touch-target-${issues.length}`,
            severity: 'warning',
            device: device.name,
            description: `Interactive element too small for touch (${rect.width}x${rect.height}px)`,
            element: this.getElementSelector(element),
            suggestion: 'Ensure touch targets are at least 44x44px for mobile devices',
          });
        }
      }
    });
  }

  // Test text readability
  private async testTextReadability(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
    
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      
      // Check minimum font size for mobile
      if (device.category === 'mobile' && fontSize < 16) {
        issues.push({
          id: `font-size-${issues.length}`,
          severity: 'warning',
          device: device.name,
          description: `Text too small for mobile (${fontSize}px)`,
          element: this.getElementSelector(element),
          suggestion: 'Use minimum 16px font size for mobile devices to ensure readability',
        });
      }

      // Check line height
      const lineHeight = parseFloat(styles.lineHeight);
      if (lineHeight && lineHeight < fontSize * 1.2) {
        issues.push({
          id: `line-height-${issues.length}`,
          severity: 'info',
          device: device.name,
          description: `Line height may be too tight (${lineHeight}px)`,
          element: this.getElementSelector(element),
          suggestion: 'Use line-height of at least 1.2 times the font size for better readability',
        });
      }
    });
  }

  // Test touch targets
  private async testTouchTargets(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    if (device.category !== 'mobile') return;

    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [tabindex]');
    
    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // Apple's recommended minimum touch target size

      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          id: `touch-target-size-${issues.length}`,
          severity: 'error',
          device: device.name,
          description: `Touch target too small (${rect.width}x${rect.height}px, minimum: ${minSize}x${minSize}px)`,
          element: this.getElementSelector(element),
          suggestion: `Increase touch target size to at least ${minSize}x${minSize}px with padding or min-width/min-height`,
        });
      }

      // Check spacing between touch targets
      const siblings = Array.from(element.parentElement?.children || [])
        .filter(el => el !== element && el.matches('button, a, input, select, textarea, [onclick], [tabindex]'));

      siblings.forEach((sibling) => {
        const siblingRect = sibling.getBoundingClientRect();
        const distance = Math.min(
          Math.abs(rect.right - siblingRect.left),
          Math.abs(rect.left - siblingRect.right),
          Math.abs(rect.bottom - siblingRect.top),
          Math.abs(rect.top - siblingRect.bottom)
        );

        if (distance < 8) {
          issues.push({
            id: `touch-spacing-${issues.length}`,
            severity: 'warning',
            device: device.name,
            description: `Touch targets too close together (${distance}px spacing)`,
            element: this.getElementSelector(element),
            suggestion: 'Ensure at least 8px spacing between touch targets',
          });
        }
      });
    });
  }

  // Test scrolling behavior
  private async testScrolling(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    // Check for horizontal scrolling
    if (document.documentElement.scrollWidth > device.width) {
      issues.push({
        id: 'horizontal-scroll',
        severity: 'error',
        device: device.name,
        description: `Page has horizontal scrolling (${document.documentElement.scrollWidth}px > ${device.width}px)`,
        element: 'document',
        suggestion: 'Ensure content fits within viewport width using responsive design',
      });
    }

    // Check for fixed elements that might interfere with scrolling
    const fixedElements = document.querySelectorAll('*');
    fixedElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      if (styles.position === 'fixed') {
        const rect = element.getBoundingClientRect();
        
        // Check if fixed element takes up too much screen space on mobile
        if (device.category === 'mobile' && rect.height > device.height * 0.3) {
          issues.push({
            id: `fixed-element-${issues.length}`,
            severity: 'warning',
            device: device.name,
            description: `Fixed element takes up too much screen space (${rect.height}px, ${((rect.height / device.height) * 100).toFixed(1)}% of viewport)`,
            element: this.getElementSelector(element),
            suggestion: 'Consider reducing size of fixed elements on mobile or making them collapsible',
          });
        }
      }
    });
  }

  // Test navigation usability
  private async testNavigation(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    // Check for mobile-friendly navigation
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    
    navElements.forEach((nav) => {
      const navItems = nav.querySelectorAll('a, button');
      
      if (device.category === 'mobile' && navItems.length > 5) {
        // Check if there's a hamburger menu or similar mobile pattern
        const hamburger = nav.querySelector('.hamburger, .menu-toggle, [aria-label*="menu"]');
        
        if (!hamburger) {
          issues.push({
            id: `mobile-nav-${issues.length}`,
            severity: 'warning',
            device: device.name,
            description: `Navigation has many items (${navItems.length}) but no mobile menu pattern detected`,
            element: this.getElementSelector(nav),
            suggestion: 'Consider implementing a hamburger menu or similar mobile navigation pattern',
          });
        }
      }
    });
  }

  // Test image responsiveness
  private async testImages(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    const images = document.querySelectorAll('img');
    
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      
      // Check for images that overflow viewport
      if (rect.width > device.width) {
        issues.push({
          id: `image-overflow-${issues.length}`,
          severity: 'error',
          device: device.name,
          description: `Image overflows viewport (${rect.width}px > ${device.width}px)`,
          element: this.getElementSelector(img),
          suggestion: 'Use max-width: 100% and height: auto for responsive images',
        });
      }

      // Check if image has responsive attributes
      const srcset = img.getAttribute('srcset');
      const sizes = img.getAttribute('sizes');
      
      if (!srcset && rect.width > 300) {
        issues.push({
          id: `image-srcset-${issues.length}`,
          severity: 'info',
          device: device.name,
          description: 'Large image without responsive srcset attribute',
          element: this.getElementSelector(img),
          suggestion: 'Consider using srcset and sizes attributes for responsive images',
        });
      }
    });
  }

  // Test form usability
  private async testForms(device: DeviceViewport, issues: ResponsiveIssue[]): Promise<void> {
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      
      // Check minimum size for form elements on mobile
      if (device.category === 'mobile' && rect.height < 44) {
        issues.push({
          id: `form-element-${issues.length}`,
          severity: 'warning',
          device: device.name,
          description: `Form element too small for mobile (${rect.height}px height)`,
          element: this.getElementSelector(element),
          suggestion: 'Ensure form elements are at least 44px tall for mobile devices',
        });
      }

      // Check for proper input types on mobile
      if (device.category === 'mobile' && element.tagName === 'INPUT') {
        const type = (element as HTMLInputElement).type;
        const inputMode = element.getAttribute('inputmode');
        
        if (type === 'text' && !inputMode) {
          const placeholder = element.getAttribute('placeholder')?.toLowerCase() || '';
          const name = element.getAttribute('name')?.toLowerCase() || '';
          
          if (placeholder.includes('email') || name.includes('email')) {
            issues.push({
              id: `input-type-${issues.length}`,
              severity: 'info',
              device: device.name,
              description: 'Email input should use type="email" for better mobile keyboard',
              element: this.getElementSelector(element),
              suggestion: 'Use type="email" or inputmode="email" for email inputs',
            });
          }
        }
      }
    });
  }

  // Helper method to get element selector
  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Get current device info
  getCurrentDevice(): DeviceViewport | null {
    return this.currentDevice;
  }

  // Get all supported devices
  getSupportedDevices(): DeviceViewport[] {
    return [...this.commonDevices];
  }

  // Check if current viewport matches a device
  detectCurrentDevice(): DeviceViewport | null {
    if (typeof window === 'undefined') return null;

    const width = window.innerWidth;
    const height = window.innerHeight;

    return this.commonDevices.find(device => 
      Math.abs(device.width - width) < 50 && 
      Math.abs(device.height - height) < 50
    ) || null;
  }
}

// Create singleton instance
export const responsiveTester = new ResponsiveTester();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).responsiveTester = responsiveTester;
}

export type { DeviceViewport, ResponsiveIssue, ResponsiveTestResult };
