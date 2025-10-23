// Browser Compatibility Checker for ChefSync Admin
// Ensures optimal experience across all supported browsers

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  supported: boolean;
  warnings: string[];
  features: BrowserFeatureSupport;
}

interface BrowserFeatureSupport {
  serviceWorker: boolean;
  webGL: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webWorkers: boolean;
  css3: boolean;
  es6: boolean;
  fetch: boolean;
  promises: boolean;
  modules: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  performanceObserver: boolean;
}

class BrowserCompatibilityChecker {
  private browserInfo: BrowserInfo | null = null;
  private minVersions = {
    chrome: 90,
    firefox: 88,
    safari: 14,
    edge: 90,
    opera: 76,
  };

  constructor() {
    this.detectBrowser();
    this.checkCompatibility();
  }

  // Detect browser information
  private detectBrowser(): void {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    const warnings: string[] = [];

    let name = 'Unknown';
    let version = '0';
    let engine = 'Unknown';

    // Chrome
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : '0';
      engine = 'Blink';
    }
    // Firefox
    else if (ua.includes('Firefox')) {
      name = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : '0';
      engine = 'Gecko';
    }
    // Safari
    else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : '0';
      engine = 'WebKit';
    }
    // Edge
    else if (ua.includes('Edg')) {
      name = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      version = match ? match[1] : '0';
      engine = 'Blink';
    }
    // Opera
    else if (ua.includes('OPR')) {
      name = 'Opera';
      const match = ua.match(/OPR\/(\d+)/);
      version = match ? match[1] : '0';
      engine = 'Blink';
    }

    // Check if browser version is supported
    const versionNum = parseInt(version);
    const minVersion = this.minVersions[name.toLowerCase() as keyof typeof this.minVersions];
    const supported = minVersion ? versionNum >= minVersion : false;

    if (!supported && minVersion) {
      warnings.push(`Your ${name} version (${version}) is outdated. Please update to version ${minVersion} or higher for the best experience.`);
    }

    // Check for mobile browsers
    if (ua.includes('Mobile') || ua.includes('Android')) {
      warnings.push('Mobile browser detected. Some features may have limited functionality.');
    }

    this.browserInfo = {
      name,
      version,
      engine,
      supported,
      warnings,
      features: this.checkFeatureSupport(),
    };
  }

  // Check feature support
  private checkFeatureSupport(): BrowserFeatureSupport {
    if (typeof window === 'undefined') {
      return {
        serviceWorker: false,
        webGL: false,
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        webWorkers: false,
        css3: false,
        es6: false,
        fetch: false,
        promises: false,
        modules: false,
        intersectionObserver: false,
        resizeObserver: false,
        performanceObserver: false,
      };
    }

    return {
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.checkWebGL(),
      localStorage: this.checkStorage('localStorage'),
      sessionStorage: this.checkStorage('sessionStorage'),
      indexedDB: 'indexedDB' in window,
      webWorkers: 'Worker' in window,
      css3: this.checkCSS3Support(),
      es6: this.checkES6Support(),
      fetch: 'fetch' in window,
      promises: 'Promise' in window,
      modules: 'noModule' in HTMLScriptElement.prototype,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
    };
  }

  // Check WebGL support
  private checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  // Check storage support
  private checkStorage(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Check CSS3 support
  private checkCSS3Support(): boolean {
    const element = document.createElement('div');
    const properties = [
      'transform',
      'transition',
      'borderRadius',
      'boxShadow',
      'flexbox',
      'grid',
    ];

    return properties.some(prop => {
      return prop in element.style || 
             `webkit${prop.charAt(0).toUpperCase() + prop.slice(1)}` in element.style ||
             `moz${prop.charAt(0).toUpperCase() + prop.slice(1)}` in element.style;
    });
  }

  // Check ES6 support
  private checkES6Support(): boolean {
    try {
      // Test arrow functions, const/let, template literals
      eval('const test = () => `ES6 ${true}`;');
      return true;
    } catch {
      return false;
    }
  }

  // Check overall compatibility
  private checkCompatibility(): void {
    if (!this.browserInfo) return;

    const { features, warnings } = this.browserInfo;
    const criticalFeatures = [
      'localStorage',
      'fetch',
      'promises',
      'es6',
    ];

    const missingCritical = criticalFeatures.filter(feature => 
      !features[feature as keyof BrowserFeatureSupport]
    );

    if (missingCritical.length > 0) {
      warnings.push(`Critical features not supported: ${missingCritical.join(', ')}`);
      this.browserInfo.supported = false;
    }

    // Log compatibility status
    if (this.browserInfo.supported) {
      console.log('✅ Browser compatibility check passed');
    } else {
      console.warn('⚠️ Browser compatibility issues detected:', warnings);
    }
  }

  // Get browser information
  getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo;
  }

  // Check if browser is supported
  isSupported(): boolean {
    return this.browserInfo?.supported ?? false;
  }

  // Get compatibility warnings
  getWarnings(): string[] {
    return this.browserInfo?.warnings ?? [];
  }

  // Get feature support details
  getFeatureSupport(): BrowserFeatureSupport | null {
    return this.browserInfo?.features ?? null;
  }

  // Display compatibility warning to user
  showCompatibilityWarning(): void {
    if (!this.browserInfo || this.browserInfo.supported) return;

    const warnings = this.getWarnings();
    if (warnings.length === 0) return;

    // Create warning modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 p-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Browser Compatibility Warning
            </h3>
          </div>
        </div>
        <div class="mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Your browser may not fully support all features of ChefSync Admin:
          </p>
          <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            ${warnings.map(warning => `<li>• ${warning}</li>`).join('')}
          </ul>
        </div>
        <div class="flex justify-end space-x-3">
          <button id="dismiss-warning" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Continue Anyway
          </button>
          <button id="update-browser" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            Update Browser
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle button clicks
    modal.querySelector('#dismiss-warning')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#update-browser')?.addEventListener('click', () => {
      window.open('https://browsehappy.com/', '_blank');
    });
  }

  // Run comprehensive browser tests
  runBrowserTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    return new Promise((resolve) => {
      const tests = [
        { name: 'Local Storage', test: () => this.testLocalStorage() },
        { name: 'Session Storage', test: () => this.testSessionStorage() },
        { name: 'Fetch API', test: () => this.testFetchAPI() },
        { name: 'Service Workers', test: () => this.testServiceWorkers() },
        { name: 'CSS Grid', test: () => this.testCSSGrid() },
        { name: 'CSS Flexbox', test: () => this.testCSSFlexbox() },
        { name: 'ES6 Features', test: () => this.testES6Features() },
        { name: 'Performance API', test: () => this.testPerformanceAPI() },
        { name: 'Intersection Observer', test: () => this.testIntersectionObserver() },
        { name: 'Resize Observer', test: () => this.testResizeObserver() },
      ];

      const results: any[] = [];
      let passed = 0;
      let failed = 0;

      tests.forEach(({ name, test }) => {
        try {
          const result = test();
          if (result) {
            passed++;
            results.push({ name, status: 'passed', error: null });
          } else {
            failed++;
            results.push({ name, status: 'failed', error: 'Test returned false' });
          }
        } catch (error) {
          failed++;
          results.push({ name, status: 'failed', error: error.message });
        }
      });

      resolve({ passed, failed, results });
    });
  }

  // Individual test methods
  private testLocalStorage(): boolean {
    return this.checkStorage('localStorage');
  }

  private testSessionStorage(): boolean {
    return this.checkStorage('sessionStorage');
  }

  private testFetchAPI(): boolean {
    return 'fetch' in window;
  }

  private testServiceWorkers(): boolean {
    return 'serviceWorker' in navigator;
  }

  private testCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }

  private testCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }

  private testES6Features(): boolean {
    return this.checkES6Support();
  }

  private testPerformanceAPI(): boolean {
    return 'performance' in window && 'now' in performance;
  }

  private testIntersectionObserver(): boolean {
    return 'IntersectionObserver' in window;
  }

  private testResizeObserver(): boolean {
    return 'ResizeObserver' in window;
  }
}

// Create singleton instance
export const browserCompatibility = new BrowserCompatibilityChecker();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).browserCompatibility = browserCompatibility;
}

// Auto-show warning for unsupported browsers
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      browserCompatibility.showCompatibilityWarning();
    }, 1000);
  });
}
