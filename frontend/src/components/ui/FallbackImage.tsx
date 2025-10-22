import React, { useState } from 'react';
import { getPlaceholderImage } from '../../utils/placeholders';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackSize?: 'small' | 'medium' | 'large' | 'card';
}

export const FallbackImage: React.FC<FallbackImageProps> = ({ 
  src, 
  alt, 
  fallbackSize = 'medium', 
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Use fallback if no src provided or if there was an error
  const imageSrc = (!src || hasError) ? getPlaceholderImage(fallbackSize) : src;

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      style={{
        ...props.style,
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }}
    />
  );
};

export default FallbackImage;