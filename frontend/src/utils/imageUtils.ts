interface FoodItem {
  food_id?: number;
  id?: number;
  name: string;
  optimized_image_url?: string;
  image_url?: string;
  primary_image?: string;
}

// Get consistent placeholder that doesn't change on refresh
export const getFoodPlaceholder = (foodId?: number, width: number = 400, height: number = 300): string => {
  // Use food ID as seed for consistent placeholders
  const seed = foodId || 1;
  return `https://picsum.photos/${width}/${height}?seed=${seed}`;
};

// Generate static SVG placeholder as ultimate fallback
export const getStaticFoodPlaceholder = (
  foodName: string = 'Food', 
  width: number = 400, 
  height: number = 300
): string => {
  const encodedName = encodeURIComponent(foodName.substring(0, 10));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Cg fill='%239ca3af'%3E%3Cpath d='M${Math.floor(width / 2) - 20} ${Math.floor(height / 2) - 10}h40v20h-40z'/%3E%3Cpath d='M${Math.floor(width / 2) - 10} ${Math.floor(height / 2) - 20}h20v15h-20z'/%3E%3C/g%3E%3Ctext x='50%25' y='75%25' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='Arial'%3E${encodedName}%3C/text%3E%3C/svg%3E`;
};

export const getChefPlaceholder = (chefId?: number): string => {
  const seed = chefId || 1;
  return `https://ui-avatars.com/api/?name=Chef&size=64&background=f97316&color=ffffff&bold=true&seed=${seed}`;
};

// Get optimized image URL with consistent fallback
export const getOptimizedImageUrl = (
  food: FoodItem, 
  width: number = 400, 
  height: number = 300
): string => {
  // Priority order: optimized_image_url -> primary_image -> image_url -> consistent placeholder
  const primaryUrl = food.optimized_image_url || food.primary_image || food.image_url;
  
  if (primaryUrl) {
    // If it's already a full URL, use it directly
    if (primaryUrl.startsWith('http')) {
      return primaryUrl;
    }
    
    // If it's a relative path, construct proper URL
    if (primaryUrl.includes('cloudinary.com') || primaryUrl.includes('/upload/')) {
      return primaryUrl;
    }
    
    // For other relative paths, assume they're in cloudinary
    const cleanPath = primaryUrl.replace(/^\/+/, '');
    if (cleanPath) {
      return `https://res.cloudinary.com/dqbl2r4ct/image/upload/f_auto,q_auto,w_${width},h_${height},c_fill/${cleanPath}`;
    }
  }
  
  // Fallback to consistent placeholder
  const foodId = food.food_id || food.id;
  return getFoodPlaceholder(foodId, width, height);
};

// Create fallback chain for systematic error handling
export const createImageFallbackChain = (
  food: FoodItem,
  width: number = 400,
  height: number = 300
): string[] => {
  const foodId = food.food_id || food.id || 0;
  
  return [
    food.optimized_image_url,
    food.primary_image,
    food.image_url,
    getFoodPlaceholder(foodId, width, height),
    getStaticFoodPlaceholder(food.name, width, height)
  ].filter(Boolean) as string[];
};

// Enhanced error handler that cycles through fallbacks
export const createImageErrorHandler = (
  food: FoodItem,
  width: number = 400,
  height: number = 300,
  onFallbackChange?: (newUrl: string) => void
) => {
  const fallbackChain = createImageFallbackChain(food, width, height);
  let currentIndex = 0;
  
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    currentIndex++;
    
    if (currentIndex < fallbackChain.length) {
      const nextUrl = fallbackChain[currentIndex];
      target.src = nextUrl;
      onFallbackChange?.(nextUrl);
    } else {
      // All fallbacks failed, use static SVG
      const staticSvg = getStaticFoodPlaceholder(food.name, width, height);
      target.src = staticSvg;
      onFallbackChange?.(staticSvg);
      console.warn(`All image fallbacks failed for ${food.name}`);
    }
  };
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = getFoodPlaceholder();
};

export const handleChefImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = getChefPlaceholder();
};