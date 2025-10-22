import React, { useState, useEffect } from 'react';

interface FoodImageProps {
  food: {
    food_id?: number;
    id?: number;
    name: string;
    optimized_image_url?: string;
    image_url?: string;
    primary_image?: string;
  };
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  enableLazyLoading?: boolean;
  onClick?: () => void;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  food,
  className = '',
  alt,
  width,
  height,
  enableLazyLoading = true,
  onClick
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Generate consistent fallback URLs based on food ID to prevent random changes
  const getFallbackUrls = () => {
    const foodId = food.food_id || food.id || 0;
    
    return [
      // Primary sources
      food.optimized_image_url,
      food.primary_image,
      food.image_url,
      
      // Consistent placeholder based on food ID (no random)
      `https://picsum.photos/${width || 400}/${height || 300}?seed=${foodId}`,
      
      // Static SVG fallback that doesn't require network
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 400}' height='${height || 300}' viewBox='0 0 ${width || 400} ${height || 300}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Cg fill='%239ca3af'%3E%3Cpath d='M${Math.floor((width || 400) / 2) - 20} ${Math.floor((height || 300) / 2) - 10}h40v20h-40z'/%3E%3Cpath d='M${Math.floor((width || 400) / 2) - 10} ${Math.floor((height || 300) / 2) - 20}h20v15h-20z'/%3E%3C/g%3E%3Ctext x='50%25' y='75%25' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='Arial'%3E${encodeURIComponent(food.name.substring(0, 10))}%3C/text%3E%3C/svg%3E`
    ].filter(Boolean);
  };

  // Initialize the image source
  useEffect(() => {
    const urls = getFallbackUrls();
    if (urls.length > 0) {
      setCurrentSrc(urls[0] as string);
      setFallbackIndex(0);
      setIsLoading(true);
      setHasError(false);
    }
  }, [food.optimized_image_url, food.image_url, food.primary_image, width, height]);

  // Handle image load error with systematic fallback
  const handleImageError = () => {
    const urls = getFallbackUrls();
    const nextIndex = fallbackIndex + 1;
    
    if (nextIndex < urls.length) {
      setFallbackIndex(nextIndex);
      setCurrentSrc(urls[nextIndex] as string);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Create loading placeholder that matches image dimensions
  const LoadingPlaceholder = () => (
    <div 
      className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
      style={{ width: width || '100%', height: height || '100%' }}
    >
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  // Show loading state
  if (isLoading && !hasError) {
    return (
      <div className="relative">
        <LoadingPlaceholder />
        <img
          src={currentSrc}
          alt={alt || food.name}
          className={`${className} absolute inset-0 opacity-0`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={enableLazyLoading ? "lazy" : "eager"}
          onClick={onClick}
        />
      </div>
    );
  }

  // Show final image or error state
  return (
    <img
      src={currentSrc}
      alt={alt || food.name}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading={enableLazyLoading ? "lazy" : "eager"}
      onClick={onClick}
      style={hasError ? { filter: 'grayscale(100%) opacity(50%)' } : undefined}
    />
  );
};

export default FoodImage;