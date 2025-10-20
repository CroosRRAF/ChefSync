/**
 * Utility function to generate SVG placeholder images
 */

export const generatePlaceholderImage = (width: number, height: number, text: string = 'No Image') => {
  // Use URL encoding instead of base64 to avoid btoa issues
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
    <rect width='${width}' height='${height}' fill='%23f3f4f6'/>
    <circle cx='${width/2}' cy='${height/2}' r='${Math.min(width, height)/6}' fill='%239ca3af'/>
    <text x='${width/2}' y='${height/2 + 6}' text-anchor='middle' fill='%23374151' font-size='14' font-family='Arial, sans-serif'>${text}</text>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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