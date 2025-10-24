/**
 * Google Maps API Loader Utility
 * Handles loading and initialization of Google Maps JavaScript API
 */

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface GoogleMapsLoaderOptions {
  apiKey: string;
  libraries?: string[];
  language?: string;
  region?: string;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private callbacks: Array<() => void> = [];

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  /**
   * Load Google Maps API
   */
  async load(options: GoogleMapsLoaderOptions): Promise<void> {
    // If already loaded, resolve immediately
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.loadGoogleMapsScript(options);

    try {
      await this.loadPromise;
      this.isLoaded = true;
      this.isLoading = false;
      
      // Execute any queued callbacks
      this.callbacks.forEach(callback => callback());
      this.callbacks = [];
      
      return Promise.resolve();
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * Load the Google Maps script
   */
  private loadGoogleMapsScript(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        if (window.google?.maps) {
          resolve();
          return;
        }
        
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;

      // Build URL with parameters
      const params = new URLSearchParams({
        key: options.apiKey,
        libraries: (options.libraries || ['places', 'geometry']).join(','),
        callback: 'initGoogleMaps',
        loading: 'async',
        ...(options.language && { language: options.language }),
        ...(options.region && { region: options.region }),
      });

      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

      // Set up global callback
      window.initGoogleMaps = () => {
        if (window.google?.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps failed to initialize'));
        }
      };

      // Handle script load errors
      script.onerror = () => {
        document.head.removeChild(script);
        delete window.initGoogleMaps;
        reject(new Error('Failed to load Google Maps script'));
      };

      // Add script to head
      document.head.appendChild(script);
    });
  }

  /**
   * Check if Google Maps is loaded
   */
  isApiLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }

  /**
   * Wait for Google Maps to be ready
   */
  whenReady(callback: () => void): void {
    if (this.isApiLoaded()) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  /**
   * Get the Google Maps API key from environment variables
   */
  static getApiKey(): string {
    // Import centralized API key manager
    try {
      const { getGoogleMapsKey } = require('@/config/apiKeys');
      return getGoogleMapsKey();
    } catch (error) {
      // Fallback to direct environment variable access
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
      }
      return apiKey;
    }
  }
}

/**
 * Hook to use Google Maps API
 */
export const useGoogleMaps = () => {
  const loader = GoogleMapsLoader.getInstance();

  const loadGoogleMaps = async (options?: Partial<GoogleMapsLoaderOptions>) => {
    try {
      const apiKey = GoogleMapsLoader.getApiKey();
      await loader.load({
        apiKey,
        libraries: ['places', 'geometry'],
        language: 'en',
        region: 'LK', // Sri Lanka
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      throw error;
    }
  };

  return {
    loadGoogleMaps,
    isLoaded: loader.isApiLoaded(),
    whenReady: loader.whenReady.bind(loader),
  };
};

export default GoogleMapsLoader;