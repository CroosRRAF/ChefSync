/**
 * Utility functions for handling API responses safely
 */

/**
 * Safely parse JSON from a Response object
 * Handles cases where the response is not valid JSON (e.g., HTML error pages, empty responses)
 * 
 * @param response - The Response object from fetch
 * @returns Promise<any> - Parsed JSON data
 * @throws Error - When response cannot be parsed as JSON
 */
export const safeJsonParse = async (response: Response): Promise<any> => {
  try {
    const text = await response.text();
    
    // Check if response is empty
    if (!text.trim()) {
      throw new Error('Empty response from server');
    }
    
    // Attempt to parse as JSON
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error(`Response status: ${response.status}`);
    console.error(`Response headers:`, response.headers);
    
    // Re-throw with more context
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON response from server (${response.status})`);
    }
    
    throw error;
  }
};

/**
 * Handle API response with proper error handling
 * 
 * @param response - The Response object from fetch
 * @param options - Configuration options
 * @returns Promise<any> - Parsed response data or throws error
 */
export const handleApiResponse = async (
  response: Response, 
  options?: { 
    successMessage?: string;
    errorPrefix?: string;
  }
): Promise<any> => {
  if (response.ok) {
    try {
      const data = await safeJsonParse(response);
      return data;
    } catch (error) {
      console.error('Error parsing successful response:', error);
      throw new Error('Server returned invalid response format');
    }
  } else {
    // Handle error responses
    let errorMessage = `Request failed (${response.status})`;
    
    try {
      const errorData = await safeJsonParse(response);
      
      // Try to extract meaningful error message
      if (typeof errorData === 'object' && errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          // Handle validation errors
          const errors: string[] = [];
          for (const [field, fieldErrors] of Object.entries(errorData)) {
            if (Array.isArray(fieldErrors)) {
              errors.push(`${field}: ${fieldErrors.join(', ')}`);
            } else if (typeof fieldErrors === 'string') {
              errors.push(`${field}: ${fieldErrors}`);
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join('; ');
          }
        }
      }
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
      // Keep the default error message
    }
    
    const finalMessage = options?.errorPrefix 
      ? `${options.errorPrefix}: ${errorMessage}` 
      : errorMessage;
      
    throw new Error(finalMessage);
  }
};

/**
 * Create a fetch wrapper with better error handling
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<any> - Parsed response data
 */
export const safeFetch = async (url: string, options?: RequestInit): Promise<any> => {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    
    // Re-throw with network context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw error;
  }
};