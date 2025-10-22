/**
 * Enhanced error handling and logging utilities
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  
  static logError(code: string, message: string, details?: any): void {
    const error: AppError = {
      code,
      message,
      details,
      timestamp: new Date()
    };
    
    this.errors.push(error);
    console.error(`[${code}] ${message}`, details);
    
    // Keep only last 50 errors to prevent memory leaks
    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }
  
  static getErrors(): AppError[] {
    return [...this.errors];
  }
  
  static clearErrors(): void {
    this.errors = [];
  }
  
  // Geolocation specific error handling
  static handleGeolocationError(error: GeolocationPositionError): string {
    let userMessage = 'Unable to access location services.';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        userMessage = 'Location access denied. Please enable location permissions in your browser settings.';
        this.logError('GEOLOCATION_PERMISSION_DENIED', userMessage, error);
        break;
      case error.POSITION_UNAVAILABLE:
        userMessage = 'Location information is unavailable. Please check your GPS or network connection.';
        this.logError('GEOLOCATION_UNAVAILABLE', userMessage, error);
        break;
      case error.TIMEOUT:
        userMessage = 'Location request timed out. Please try again.';
        this.logError('GEOLOCATION_TIMEOUT', userMessage, error);
        break;
      default:
        userMessage = 'An unknown location error occurred.';
        this.logError('GEOLOCATION_UNKNOWN', userMessage, error);
        break;
    }
    
    return userMessage;
  }
  
  // Network error handling
  static handleNetworkError(error: any, context: string): string {
    const message = `Network error in ${context}`;
    this.logError('NETWORK_ERROR', message, error);
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  // Image loading error handling
  static handleImageError(src: string, context: string): void {
    this.logError('IMAGE_LOAD_ERROR', `Failed to load image: ${src}`, { context });
  }
}

export default ErrorHandler;