/**
 * Centralized API Key Configuration
 * 
 * This module provides a single source of truth for all API keys used in the application.
 * It includes validation, error handling, and helpful error messages for missing keys.
 */

interface ApiKeysConfig {
  googleMaps: {
    key: string;
    isValid: boolean;
    error?: string;
  };
  googleAI: {
    key: string;
    isValid: boolean;
    error?: string;
  };
}

interface ApiKeyStatus {
  allValid: boolean;
  googleMapsValid: boolean;
  googleAIValid: boolean;
  errors: string[];
  warnings: string[];
}

class ApiKeyManager {
  private static instance: ApiKeyManager;
  private config: ApiKeysConfig;
  
  private constructor() {
    this.config = {
      googleMaps: this.validateGoogleMapsKey(),
      googleAI: this.validateGoogleAIKey(),
    };
    
    // Log configuration status on initialization
    this.logStatus();
  }

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Validate Google Maps API Key
   */
  private validateGoogleMapsKey(): ApiKeysConfig['googleMaps'] {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!key) {
      return {
        key: '',
        isValid: false,
        error: 'Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.',
      };
    }

    if (key === 'your_google_maps_api_key_here' || key.length < 20) {
      return {
        key: '',
        isValid: false,
        error: 'Invalid Google Maps API key. Please replace the placeholder with your actual API key.',
      };
    }

    return {
      key,
      isValid: true,
    };
  }

  /**
   * Validate Google AI API Key
   */
  private validateGoogleAIKey(): ApiKeysConfig['googleAI'] {
    const key = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    
    if (!key) {
      return {
        key: '',
        isValid: false,
        error: 'Google AI API key is missing. Please set VITE_GOOGLE_AI_API_KEY in your .env file.',
      };
    }

    if (key === 'your_google_ai_api_key_here' || key.length < 20) {
      return {
        key: '',
        isValid: false,
        error: 'Invalid Google AI API key. Please replace the placeholder with your actual API key.',
      };
    }

    return {
      key,
      isValid: true,
    };
  }

  /**
   * Get Google Maps API Key
   */
  getGoogleMapsKey(): string {
    if (!this.config.googleMaps.isValid) {
      console.error('🗺️ Google Maps Error:', this.config.googleMaps.error);
      throw new Error(this.config.googleMaps.error);
    }
    return this.config.googleMaps.key;
  }

  /**
   * Get Google AI API Key
   */
  getGoogleAIKey(): string {
    if (!this.config.googleAI.isValid) {
      console.error('🤖 Google AI Error:', this.config.googleAI.error);
      throw new Error(this.config.googleAI.error);
    }
    return this.config.googleAI.key;
  }

  /**
   * Check if Google Maps API key is valid
   */
  isGoogleMapsValid(): boolean {
    return this.config.googleMaps.isValid;
  }

  /**
   * Check if Google AI API key is valid
   */
  isGoogleAIValid(): boolean {
    return this.config.googleAI.isValid;
  }

  /**
   * Get comprehensive status of all API keys
   */
  getStatus(): ApiKeyStatus {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.config.googleMaps.isValid) {
      errors.push(this.config.googleMaps.error || 'Google Maps API key issue');
    }

    if (!this.config.googleAI.isValid) {
      warnings.push(this.config.googleAI.error || 'Google AI API key issue (optional)');
    }

    return {
      allValid: this.config.googleMaps.isValid && this.config.googleAI.isValid,
      googleMapsValid: this.config.googleMaps.isValid,
      googleAIValid: this.config.googleAI.isValid,
      errors,
      warnings,
    };
  }

  /**
   * Get setup instructions for missing keys
   */
  getSetupInstructions(): { googleMaps?: string; googleAI?: string } {
    const instructions: { googleMaps?: string; googleAI?: string } = {};

    if (!this.config.googleMaps.isValid) {
      instructions.googleMaps = `
To set up Google Maps API:
1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable billing (required for Maps API)
4. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
5. Go to Credentials > Create Credentials > API Key
6. Copy the API key
7. Add to .env file: VITE_GOOGLE_MAPS_API_KEY=your_key_here
8. Restart the development server
      `.trim();
    }

    if (!this.config.googleAI.isValid) {
      instructions.googleAI = `
To set up Google AI (Gemini) API:
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select or create a Google Cloud project
4. Copy the generated API key
5. Add to .env file: VITE_GOOGLE_AI_API_KEY=your_key_here
6. Restart the development server

Note: This is optional. The app will work with fallback responses if AI is not configured.
      `.trim();
    }

    return instructions;
  }

  /**
   * Log configuration status to console
   */
  private logStatus(): void {
    console.group('🔐 API Keys Configuration');
    
    console.log('Google Maps API:', 
      this.config.googleMaps.isValid 
        ? '✅ Configured' 
        : '❌ ' + this.config.googleMaps.error
    );
    
    console.log('Google AI API:', 
      this.config.googleAI.isValid 
        ? '✅ Configured' 
        : '⚠️ ' + this.config.googleAI.error
    );
    
    console.groupEnd();

    // Show setup instructions if needed
    const instructions = this.getSetupInstructions();
    if (Object.keys(instructions).length > 0) {
      console.group('📋 Setup Instructions');
      if (instructions.googleMaps) {
        console.log('Google Maps API Setup:\n', instructions.googleMaps);
      }
      if (instructions.googleAI) {
        console.log('Google AI API Setup:\n', instructions.googleAI);
      }
      console.groupEnd();
    }
  }

  /**
   * Refresh configuration (useful after environment changes)
   */
  refresh(): void {
    this.config = {
      googleMaps: this.validateGoogleMapsKey(),
      googleAI: this.validateGoogleAIKey(),
    };
    this.logStatus();
  }
}

// Export singleton instance
export const apiKeys = ApiKeyManager.getInstance();

// Export convenience functions
export const getGoogleMapsKey = () => apiKeys.getGoogleMapsKey();
export const getGoogleAIKey = () => apiKeys.getGoogleAIKey();
export const isGoogleMapsConfigured = () => apiKeys.isGoogleMapsValid();
export const isGoogleAIConfigured = () => apiKeys.isGoogleAIValid();
export const getApiKeyStatus = () => apiKeys.getStatus();
export const getSetupInstructions = () => apiKeys.getSetupInstructions();

// Default export
export default apiKeys;

