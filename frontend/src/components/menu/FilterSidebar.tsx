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
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterOptions,
  currentFilters,
  onFilterChange,
  userLocation,
  className = ''
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
    <div className={`space-y-6 p-4 ${className}`}>
      {/* Clear Filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Price Range</CardTitle>
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
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{currentMinPrice}</span>
            <span>₹{currentMaxPrice}</span>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Dietary Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filterOptions.dietary_options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={currentFilters.dietary?.includes(option.value) || false}
                onCheckedChange={(checked) => 
                  handleDietaryChange(option.value, checked as boolean)
                }
              />
              <Label htmlFor={option.value} className="text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cuisines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cuisines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-48 overflow-y-auto">
          {filterOptions.cuisines.map((cuisine) => (
            <div key={cuisine.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine.id}`}
                checked={currentFilters.cuisines?.includes(cuisine.id) || false}
                onCheckedChange={(checked) => 
                  handleCuisineChange(cuisine.id, checked as boolean)
                }
              />
              <Label htmlFor={`cuisine-${cuisine.id}`} className="text-sm flex-1">
                {cuisine.name}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-48 overflow-y-auto">
          {filterOptions.categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={currentFilters.categories?.includes(category.id) || false}
                onCheckedChange={(checked) => 
                  handleCategoryChange(category.id, checked as boolean)
                }
              />
              <Label htmlFor={`category-${category.id}`} className="text-sm flex-1">
                {category.name}
                <span className="text-xs text-gray-500 ml-1">
                  ({category.cuisine_name})
                </span>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rating Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Minimum Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={currentFilters.rating_min === rating}
                onCheckedChange={(checked) => 
                  checked ? handleRatingChange(rating) : handleRatingChange(0)
                }
              />
              <Label htmlFor={`rating-${rating}`} className="text-sm flex items-center">
                {rating}+ ⭐
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sort Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sort By</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filterOptions.sort_options.map((option) => (
            <Button
              key={option.value}
              variant={currentFilters.sort_by === option.value ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onFilterChange({ sort_by: option.value as any })}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Location Info */}
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
  );
};

export default FilterSidebar;