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
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { FoodCategory, Cuisine } from '@/types/food';
import ImageUpload from '@/components/shared/ImageUpload';
import { fetchCuisines, createFoodCategory, updateFoodCategory } from '@/services/foodService';

interface CategoryFormProps {
  category?: FoodCategory | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
  cuisine: z.string(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
});

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [image, setImage] = useState<File | null>(null);

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      cuisine: category?.cuisine?.toString() || '',
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order || 0,
    },
  });

  useEffect(() => {
    const loadCuisines = async () => {
      setLoading(true);
      try {
        const data = await fetchCuisines({});
        setCuisines(data.results || []);
      } catch (error) {
        console.error('Error loading cuisines:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cuisines',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCuisines();
  }, []);

  const handleFormSubmit = async (values: z.infer<typeof categoryFormSchema>) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Add image if provided
      if (image) {
        formData.append('image', image);
      }

      // Submit to API
      if (category?.id) {
        await updateFoodCategory(category.id, formData);
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        await createFoodCategory(formData);
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      setImage(files[0]);
    }
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cuisine"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuisine</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cuisine" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cuisines.map((cuisine) => (
                    <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
                      {cuisine.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the category (optional)" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Determines the display order (lower numbers appear first)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Mark if this category is currently active
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

        <Card>
          <CardContent className="pt-6">
            <FormLabel className="mb-2 block">Category Image</FormLabel>
            <ImageUpload 
              onChange={handleImageUpload}
              maxFiles={1}
              accept="image/*"
              defaultImages={category?.image ? [category.image] : []}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;