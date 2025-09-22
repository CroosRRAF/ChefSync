import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Cuisine } from '@/types/food';
import ImageUpload from '@/components/shared/ImageUpload';
import { createCuisine, updateCuisine } from '@/services/foodService';

interface CuisineFormProps {
  cuisine?: Cuisine | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const cuisineFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
});

const CuisineForm: React.FC<CuisineFormProps> = ({ cuisine, onSubmit, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const form = useForm<z.infer<typeof cuisineFormSchema>>({
    resolver: zodResolver(cuisineFormSchema),
    defaultValues: {
      name: cuisine?.name || '',
      description: cuisine?.description || '',
      is_active: cuisine?.is_active ?? true,
      sort_order: cuisine?.sort_order || 0,
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof cuisineFormSchema>) => {
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
      if (cuisine?.id) {
        await updateCuisine(cuisine.id, formData);
        toast({
          title: 'Success',
          description: 'Cuisine updated successfully',
        });
      } else {
        await createCuisine(formData);
        toast({
          title: 'Success',
          description: 'Cuisine created successfully',
        });
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cuisine',
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
                <Input placeholder="Cuisine name" {...field} />
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
                  placeholder="Describe the cuisine (optional)" 
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
                  Mark if this cuisine is currently active
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
            <FormLabel className="mb-2 block">Cuisine Image</FormLabel>
            <ImageUpload 
              onChange={handleImageUpload}
              maxFiles={1}
              accept="image/*"
              defaultImages={cuisine?.image ? [cuisine.image] : []}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Saving...' : cuisine ? 'Update Cuisine' : 'Create Cuisine'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CuisineForm;