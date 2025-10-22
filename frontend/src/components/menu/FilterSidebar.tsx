import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterOptions, MenuFilters, UserLocation } from '@/services/enhancedMenuService';

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  currentFilters: MenuFilters;
  onFilterChange: (filters: Partial<MenuFilters>) => void;
  userLocation?: UserLocation | null;
  className?: string;
  onClose?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterOptions,
  currentFilters,
  onFilterChange,
  userLocation,
  className = '',
  onClose
}) => {
  const handlePriceRangeChange = (value: number[]) => {
    onFilterChange({
      min_price: value[0],
      max_price: value[1],
    });
  };

  const handleCuisineChange = (cuisineId: number, checked: boolean) => {
    const currentCuisines = currentFilters.cuisines || [];
    const newCuisines = checked
      ? [...currentCuisines, cuisineId]
      : currentCuisines.filter(id => id !== cuisineId);
    
    onFilterChange({ cuisines: newCuisines });
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const currentCategories = currentFilters.categories || [];
    const newCategories = checked
      ? [...currentCategories, categoryId]
      : currentCategories.filter(id => id !== categoryId);
    
    onFilterChange({ categories: newCategories });
  };

  const handleDietaryChange = (dietary: string, checked: boolean) => {
    const currentDietary = currentFilters.dietary || [];
    const newDietary = checked
      ? [...currentDietary, dietary]
      : currentDietary.filter(d => d !== dietary);
    
    onFilterChange({ dietary: newDietary });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ rating_min: rating });
  };

  const clearAllFilters = () => {
    onFilterChange({
      min_price: undefined,
      max_price: undefined,
      cuisines: [],
      categories: [],
      dietary: [],
      rating_min: undefined,
      chef_ids: [],
    });
  };

  const priceRange = filterOptions.price_range;
  const currentMinPrice = currentFilters.min_price ?? priceRange.min;
  const currentMaxPrice = currentFilters.max_price ?? priceRange.max;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {/* Filter Header with Clear All */}
        <div className="flex justify-between items-center py-2">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 text-xs"
          >
            Clear All
          </Button>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Price Range
              <Badge variant="outline" className="text-xs">
                ₹{currentMinPrice} - ₹{currentMaxPrice}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-2">
              <Slider
                value={[currentMinPrice, currentMaxPrice]}
                onValueChange={handlePriceRangeChange}
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: ₹{priceRange.min}</span>
              <span>Max: ₹{priceRange.max}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Dietary Preferences
              {currentFilters.dietary && currentFilters.dietary.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  {currentFilters.dietary.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filterOptions.dietary_options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 py-1">
                <Checkbox
                  id={option.value}
                  checked={currentFilters.dietary?.includes(option.value) || false}
                  onCheckedChange={(checked) => 
                    handleDietaryChange(option.value, checked as boolean)
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer flex-1">
                  {option.label}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Cuisines
              {currentFilters.cuisines && currentFilters.cuisines.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  {currentFilters.cuisines.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {filterOptions.cuisines.map((cuisine) => (
              <div key={cuisine.id} className="flex items-center space-x-3 py-1 hover:bg-gray-50 rounded px-1">
                <Checkbox
                  id={`cuisine-${cuisine.id}`}
                  checked={currentFilters.cuisines?.includes(cuisine.id) || false}
                  onCheckedChange={(checked) => 
                    handleCuisineChange(cuisine.id, checked as boolean)
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor={`cuisine-${cuisine.id}`} className="text-sm font-medium cursor-pointer flex-1 truncate">
                  {cuisine.name}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Categories
              {currentFilters.categories && currentFilters.categories.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                  {currentFilters.categories.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {filterOptions.categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-3 py-1 hover:bg-gray-50 rounded px-1">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={currentFilters.categories?.includes(category.id) || false}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category.id, checked as boolean)
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm font-medium cursor-pointer flex-1">
                  <div className="truncate">
                    {category.name}
                    <span className="text-xs text-gray-500 ml-1 block">
                      {category.cuisine_name}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Minimum Rating
              {currentFilters.rating_min && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  {currentFilters.rating_min}+ ⭐
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3 py-1 hover:bg-gray-50 rounded px-1">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={currentFilters.rating_min === rating}
                  onCheckedChange={(checked) => 
                    checked ? handleRatingChange(rating) : handleRatingChange(0)
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor={`rating-${rating}`} className="text-sm font-medium cursor-pointer flex items-center gap-1">
                  {rating}+ 
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-xs text-gray-500">& above</span>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Sort By
              {currentFilters.sort_by && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                  {filterOptions.sort_options.find(opt => opt.value === currentFilters.sort_by)?.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filterOptions.sort_options.map((option) => (
              <Button
                key={option.value}
                variant={currentFilters.sort_by === option.value ? "default" : "outline"}
                size="sm"
                className={`w-full justify-start text-sm ${
                  currentFilters.sort_by === option.value 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onFilterChange({ sort_by: option.value as any })}
              >
                {option.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {userLocation && (
          <Card className="bg-green-50">
            <CardContent className="pt-4">
              <div className="text-sm">
                <h4 className="font-medium text-green-900 mb-2">Delivery Location</h4>
                <p className="text-green-700 text-xs">
                  {userLocation.address}
                </p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  Distance-based pricing enabled
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {onClose && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t p-4 shadow-lg">
          <div className="flex gap-3">
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
              size="sm"
            >
              Clear All
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-md"
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-500">
              {(() => {
                const activeFilters = Object.entries(currentFilters).filter(([key, value]) => {
                  if (Array.isArray(value)) return value.length > 0;
                  return value !== undefined && value !== null && value !== '';
                }).length;
                return activeFilters > 0 ? `${activeFilters} filter${activeFilters > 1 ? 's' : ''} active` : 'No active filters';
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;