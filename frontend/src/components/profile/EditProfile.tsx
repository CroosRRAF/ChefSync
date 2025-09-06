import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/utils/fetcher';
import { User, Mail, Phone, MapPin, AlertCircle, Loader2, Save } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_no: z.string().optional(),
  role: z.enum(['customer', 'admin', 'cook', 'delivery_agent'], {
    required_error: 'Please select a role',
  }),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditProfileProps {
  onClose: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUser } = useUserStore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone_no: user?.phone_no || '',
      role: user?.role || 'customer',
      address: user?.address || '',
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const updatedUser = await authAPI.updateProfile(values);
      updateUser(updatedUser);
      
      toast({ 
        title: 'Profile updated successfully!', 
        description: 'Your profile information has been updated.' 
      });
      
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      setError('root', { type: 'manual', message: errorMessage });
      toast({ 
        variant: 'destructive', 
        title: 'Profile update failed', 
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Edit Profile</span>
          </CardTitle>
          <CardDescription>Update your profile information and role</CardDescription>
        </CardHeader>

        <CardContent>
          {errors.root && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="John Doe" className="pl-10" {...register('name')} />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register('email')} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select onValueChange={(value) => setValue('role', value as any)} defaultValue={user?.role || 'customer'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer - Order food</SelectItem>
                  <SelectItem value="cook">Cook - Prepare food</SelectItem>
                  <SelectItem value="delivery_agent">Delivery Agent - Deliver food</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" placeholder="+1 555 123 4567" className="pl-10" {...register('phone_no')} />
              </div>
              {errors.phone_no && <p className="text-sm text-destructive">{errors.phone_no.message}</p>}
            </div>

            {selectedRole === 'cook' && (
              <div className="space-y-2">
                <Label htmlFor="address">Kitchen Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    placeholder="Enter your kitchen location" 
                    className="pl-10" 
                    {...register('address')} 
                  />
                </div>
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
            )}

            {selectedRole === 'delivery_agent' && (
              <div className="space-y-2">
                <Label htmlFor="address">Service Area</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    placeholder="Enter your service area" 
                    className="pl-10" 
                    {...register('address')} 
                  />
                </div>
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
            )}

            {selectedRole === 'customer' && (
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    placeholder="Enter your address" 
                    className="pl-10" 
                    {...register('address')} 
                  />
                </div>
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
