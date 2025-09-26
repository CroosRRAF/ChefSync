/**
 * Utility function to generate SVG placeholder images
 */

export const generatePlaceholderImage = (width: number, height: number, text: string = 'No Image') => {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#F3F4F6"/>
  <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/6}" fill="#9CA9B0"/>
  <text x="${width/2}" y="${height/2 + Math.min(width, height)/4}" text-anchor="middle" fill="#677480" font-size="${Math.min(width, height)/8}" font-family="Arial, sans-serif">${text}</text>
</svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const PLACEHOLDER_IMAGES = {
  small: generatePlaceholderImage(48, 48),
  medium: generatePlaceholderImage(80, 80),
  large: generatePlaceholderImage(128, 128),
  card: generatePlaceholderImage(300, 200),
};

export const getPlaceholderImage = (size: 'small' | 'medium' | 'large' | 'card' = 'medium') => {
  return PLACEHOLDER_IMAGES[size];
};