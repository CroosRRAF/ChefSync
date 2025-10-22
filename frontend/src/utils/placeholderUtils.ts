/**
 * Utility functions for handling placeholder images
 */

export const getPlaceholderImage = (width: number = 48, height: number = 48, text?: string): string => {
  // Use a local SVG fallback instead of external service
  const placeholderText = text || `${width}x${height}`;
  
  // Create SVG with proper encoding for Unicode characters
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="12">${placeholderText}</text>
    </svg>
  `;
  
  // Use encodeURIComponent instead of btoa for Unicode support
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
};

export const getFoodPlaceholder = (width: number = 48, height: number = 48): string => {
  return getPlaceholderImage(width, height, '🍽️');
};

export const getProfilePlaceholder = (width: number = 48, height: number = 48): string => {
  return getPlaceholderImage(width, height, '👤');
};

export const getAddressPlaceholder = (width: number = 48, height: number = 48): string => {
  return getPlaceholderImage(width, height, '📍');
};

// Fallback to a simple colored div if all else fails
export const getFallbackImage = (width: number = 48, height: number = 48): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="12">${width}x${height}</text>
    </svg>
  `)}`;
};
