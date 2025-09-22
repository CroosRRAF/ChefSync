/**
 * Utility functions for formatting and handling numbers safely
 */

/**
 * Safely formats a number as currency with fallback for invalid values
 * @param value - The value to format (can be number, string, null, undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency symbol (default: '$')
 * @param fallback - Fallback text for invalid values (default: 'N/A')
 * @returns Formatted currency string or fallback
 */
export function formatCurrency(
  value: any,
  decimals: number = 2,
  currency: string = '$',
  fallback: string = 'N/A'
): string {
  // Convert to number safely
  const numValue = toSafeNumber(value);

  // Check if conversion resulted in a valid number
  if (numValue === null) {
    return fallback;
  }

  try {
    return `${currency}${numValue.toFixed(decimals)}`;
  } catch (error) {
    console.warn('Error formatting currency:', error);
    return fallback;
  }
}

/**
 * Safely converts any value to a number or returns null if invalid
 * @param value - The value to convert
 * @returns Number or null if invalid
 */
export function toSafeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim());
    return isNaN(parsed) ? null : parsed;
  }

  // Try to convert other types
  const converted = Number(value);
  return isNaN(converted) ? null : converted;
}

/**
 * Safely formats a number with specified decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places
 * @param fallback - Fallback for invalid values
 * @returns Formatted number string or fallback
 */
export function formatNumber(
  value: any,
  decimals: number = 2,
  fallback: string = 'N/A'
): string {
  const numValue = toSafeNumber(value);

  if (numValue === null) {
    return fallback;
  }

  try {
    return numValue.toFixed(decimals);
  } catch (error) {
    console.warn('Error formatting number:', error);
    return fallback;
  }
}

/**
 * Type guard to check if a value is a valid number
 * @param value - The value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return toSafeNumber(value) !== null;
}