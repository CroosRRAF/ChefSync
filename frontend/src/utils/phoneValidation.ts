/**
 * Phone number validation utilities for Sri Lankan phone numbers
 */

export interface PhoneValidationResult {
  isValid: boolean;
  type?: 'mobile' | 'landline';
  formatted?: string;
  error?: string;
}

/**
 * Validates Sri Lankan phone numbers
 * Accepts formats:
 * - Mobile: +94771234567, 94771234567, 0771234567, 077-123-4567, +94 77 123 4567
 * - Landline: +94112345678, 94112345678, 0112345678, 011-234-5678
 * 
 * @param phone - Phone number to validate
 * @returns PhoneValidationResult object with validation details
 */
export const validateSriLankanPhone = (phone: string): PhoneValidationResult => {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Check for valid Sri Lankan phone number format
  // Mobile: starts with 7, total 10 digits (with 0) or 9 digits (without 0)
  // Landline: starts with 1-6, 8-9, total 10 digits (with 0) or 9 digits (without 0)
  const phoneRegex = /^(?:\+94|94|0)?(?:7[0-9]|[1-9][0-9])[0-9]{7}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Invalid Sri Lankan phone number format'
    };
  }

  // Check if it's a mobile number (starts with 7)
  const mobileRegex = /^(?:\+94|94|0)?7[0-9]{8}$/;
  if (mobileRegex.test(cleanPhone)) {
    return {
      isValid: true,
      type: 'mobile',
      formatted: formatSriLankanPhone(cleanPhone)
    };
  }

  // Check if it's a landline (not starting with 7)
  const landlineRegex = /^(?:\+94|94|0)?[1-9][0-9]{8}$/;
  if (landlineRegex.test(cleanPhone)) {
    return {
      isValid: true,
      type: 'landline',
      formatted: formatSriLankanPhone(cleanPhone)
    };
  }

  return {
    isValid: false,
    error: 'Please provide a valid Sri Lankan mobile (07X XXX XXXX) or landline number'
  };
};

/**
 * Formats Sri Lankan phone number to standard format
 * @param phone - Phone number to format
 * @returns Formatted phone number (+94 XX XXX XXXX)
 */
export const formatSriLankanPhone = (phone: string): string => {
  // Remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Remove leading zeros or country code
  let digits = cleanPhone;
  if (digits.startsWith('+94')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('94')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  // Format based on length
  if (digits.length === 9) {
    // Mobile: +94 77 123 4567
    if (digits.startsWith('7')) {
      return `+94 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    }
    // Landline: +94 11 234 5678
    else {
      return `+94 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    }
  }
  
  return cleanPhone;
};

/**
 * Extracts clean phone number (removes formatting)
 * @param phone - Phone number to clean
 * @returns Clean phone number with country code
 */
export const cleanSriLankanPhone = (phone: string): string => {
  // Remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Ensure it has country code
  if (cleanPhone.startsWith('+94')) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('94')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.startsWith('0')) {
    return `+94${cleanPhone.substring(1)}`;
  } else {
    return `+94${cleanPhone}`;
  }
};

/**
 * Validates and returns error message if invalid
 * @param phone - Phone number to validate
 * @returns Error message or empty string if valid
 */
export const getPhoneValidationError = (phone: string): string => {
  const result = validateSriLankanPhone(phone);
  return result.error || '';
};

/**
 * Check if phone number is a Sri Lankan mobile number
 * @param phone - Phone number to check
 * @returns true if mobile, false otherwise
 */
export const isSriLankanMobile = (phone: string): boolean => {
  const result = validateSriLankanPhone(phone);
  return result.isValid && result.type === 'mobile';
};

/**
 * Check if phone number is a Sri Lankan landline number
 * @param phone - Phone number to check
 * @returns true if landline, false otherwise
 */
export const isSriLankanLandline = (phone: string): boolean => {
  const result = validateSriLankanPhone(phone);
  return result.isValid && result.type === 'landline';
};

