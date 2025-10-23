import React, { useState } from 'react';
import { getOptimizedImageUrl, createImageErrorHandler } from '../../utils/imageUtils';

interface OptimizedFoodImageProps {
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
  disableLazyLoading?: boolean;
  onClick?: () => void;
}

export const OptimizedFoodImage: React.FC<OptimizedFoodImageProps> = ({
  food,
  className = '',
  alt,
  width = 400,
  height = 300,
  disableLazyLoading = false,
  onClick
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = createImageErrorHandler(food, width, height, () => {
    setHasError(true);
    setIsLoading(false);
  });

  return (
    <div className="relative">
      {/* Loading placeholder - shows until image loads */}
      {isLoading && (
        <div 
          className={`${className} bg-gray-200 animate-pulse flex items-center justify-center absolute inset-0 z-10`}
          style={{ width, height }}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={getOptimizedImageUrl(food, width, height)}
        alt={alt || food.name}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        // Disable lazy loading for above-the-fold images to prevent intervention
        loading={disableLazyLoading ? "eager" : "lazy"}
        // Add decoding attribute to improve performance
        decoding="async"
        // Add fetchpriority for critical images
        {...(disableLazyLoading && { fetchpriority: "high" as any })}
      />
    </div>
  );
};

export default OptimizedFoodImage;