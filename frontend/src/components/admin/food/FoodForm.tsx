import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchCuisines, fetchFoodCategories, createFood, updateFood } from '@/services/foodService';
import { Card, CardContent } from '@/components/ui/card';
import { Food, Cuisine, FoodCategory } from '@/types/food';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/shared/ImageUpload';

interface FoodFormProps {
  food?: Food | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const foodFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce.number().min(0.01, { message: 'Price must be greater than 0' }),
  original_price: z.coerce.number().optional(),
  category: z.string(),
  chef: z.string(),
  preparation_time: z.coerce.number().min(1, { message: 'Preparation time must be at least 1 minute' }),
  calories_per_serving: z.coerce.number().optional(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  spice_level: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
});

const FoodForm: React.FC<FoodFormProps> = ({ food, onSubmit, onCancel }) => {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<z.infer<typeof foodFormSchema>>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: {
      name: food?.name || '',
      description: food?.description || '',
      price: food?.price || 0,
      original_price: food?.original_price || 0,
      category: food?.category?.toString() || '',
      chef: food?.chef?.toString() || '',
      preparation_time: food?.preparation_time || 15,
      calories_per_serving: food?.calories_per_serving || 0,
      is_available: food?.is_available ?? true,
      is_featured: food?.is_featured ?? false,
      is_vegetarian: food?.is_vegetarian ?? false,
      is_vegan: food?.is_vegan ?? false,
      is_gluten_free: food?.is_gluten_free ?? false,
      spice_level: food?.spice_level || 'mild',
      ingredients: food?.ingredients || [],
      allergens: food?.allergens || [],
    },
  });

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      try {
        const cuisineData = await fetchCuisines({});
        setCuisines(cuisineData.results || []);
        
        const categoryData = await fetchFoodCategories({});
        setCategories(categoryData.results || []);
      } catch (error) {
        console.error('Error loading form data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  const handleFormSubmit = async (values: z.infer<typeof foodFormSchema>) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'ingredients' || key === 'allergens') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      // Add images
      images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      // Submit to API
      if (food?.id) {
        await updateFood(food.id, formData);
        toast({
          title: 'Success',
          description: 'Food item updated successfully',
        });
      } else {
        await createFood(formData);
        toast({
          title: 'Success',
          description: 'Food item created successfully',
        });
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save food item',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (files: File[]) => {
    setImages(files);
  };

  // Ingredients handling
  const [newIngredient, setNewIngredient] = useState('');
  const addIngredient = () => {
    if (newIngredient.trim()) {
      const currentIngredients = form.getValues('ingredients') || [];
      form.setValue('ingredients', [...currentIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };
  
  const removeIngredient = (index: number) => {
    const currentIngredients = form.getValues('ingredients') || [];
    form.setValue('ingredients', currentIngredients.filter((_, i) => i !== index));
  };

  // Allergens handling
  const [newAllergen, setNewAllergen] = useState('');
  const addAllergen = () => {
    if (newAllergen.trim()) {
      const currentAllergens = form.getValues('allergens') || [];
      form.setValue('allergens', [...currentAllergens, newAllergen.trim()]);
      setNewAllergen('');
    }
  };
  
  const removeAllergen = (index: number) => {
    const currentAllergens = form.getValues('allergens') || [];
    form.setValue('allergens', currentAllergens.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Food item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the food item" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="original_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price ($) (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty if there's no discount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name} ({category.cuisine_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preparation_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation Time (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Available</FormLabel>
                      <FormDescription>
                        Mark if this food item is currently available
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>
                        Mark if this food item should be featured
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="is_vegetarian"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Vegetarian</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_vegan"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Vegan</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_gluten_free"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Gluten Free</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calories_per_serving"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories Per Serving</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spice_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spice Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select spice level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="very_hot">Very Hot</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <div className="flex space-x-2">
                  <Input 
                    value={newIngredient} 
                    onChange={(e) => setNewIngredient(e.target.value)}
                    placeholder="Add ingredient"
                  />
                  <Button type="button" onClick={addIngredient}>Add</Button>
                </div>
                <div className="mt-2">
                  {form.getValues('ingredients')?.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between p-2 mb-1 bg-muted rounded">
                      <span>{ingredient}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeIngredient(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allergens</Label>
                <div className="flex space-x-2">
                  <Input 
                    value={newAllergen} 
                    onChange={(e) => setNewAllergen(e.target.value)}
                    placeholder="Add allergen"
                  />
                  <Button type="button" onClick={addAllergen}>Add</Button>
                </div>
                <div className="mt-2">
                  {form.getValues('allergens')?.map((allergen, index) => (
                    <div key={index} className="flex items-center justify-between p-2 mb-1 bg-muted rounded">
                      <span>{allergen}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeAllergen(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <ImageUpload 
                  onChange={handleImageUpload}
                  maxFiles={5}
                  accept="image/*"
                  defaultImages={food?.images?.map(img => img.image) || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Saving...' : food ? 'Update Food' : 'Create Food'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FoodForm;