import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, MapPin, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

// Profile update schema with optional fields
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_no: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

type ProfileData = z.infer<typeof profileSchema>;

interface User {
  user_id: number;
  name: string;
  email: string;
  phone_no?: string;
  address?: string;
  role: string;
  email_verified: boolean;
}

const ProfileUpdateForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const { toast } = useToast();
  const { user: authUser, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  // Load user data on component mount
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      reset({
        name: authUser.name || '',
        phone_no: authUser.phone_no || '',
        address: authUser.address || '',
      });
    }
  }, [authUser, reset]);

  const apiCall = async (endpoint: string, data: any, method: string = 'POST') => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'An error occurred');
    }
    
    return result;
  };

  const onSubmit = async (data: ProfileData) => {
    setIsSaving(true);
    try {
      // Clean up empty strings to null
      const cleanData = {
        name: data.name,
        phone_no: data.phone_no?.trim() || null,
        address: data.address?.trim() || null,
      };

      const result = await apiCall('profile/update/', cleanData, 'PUT');
      
      // Update local user state
      if (updateUser && result.user) {
        updateUser(result.user);
      }
      
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
      
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // This would open a password change modal or navigate to password change page
    toast({
      title: "Password Change",
      description: "Password change functionality will be implemented separately.",
    });
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{user.name}</CardTitle>
          <CardDescription className="text-gray-600">
            {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </CardDescription>
          {user.email_verified && (
            <div className="flex items-center justify-center mt-2">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">Email Verified</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Profile Update Form */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information. All fields except name are optional.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  className="pl-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {errors.name.message}
                  </p>
                </div>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="pl-12 h-12 text-base border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
              <p className="text-sm text-gray-500">
                Email address cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            {/* Phone Number Field */}
            <div className="space-y-3">
              <Label htmlFor="phone_no" className="text-base font-medium text-gray-700">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="phone_no"
                  type="tel"
                  placeholder="Enter your phone number"
                  className="pl-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  {...register('phone_no')}
                />
              </div>
              {errors.phone_no && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {errors.phone_no.message}
                  </p>
                </div>
              )}
            </div>

            {/* Address Field */}
            <div className="space-y-3">
              <Label htmlFor="address" className="text-base font-medium text-gray-700">
                Address <span className="text-gray-400">(Optional)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  className="pl-12 pt-3 min-h-[100px] text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 resize-none"
                  {...register('address')}
                />
              </div>
              {errors.address && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {errors.address.message}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handlePasswordChange}
                className="flex-1 h-12 text-lg border-gray-300 hover:bg-gray-50"
              >
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and verification status.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Account Type</h4>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Email Status</h4>
              <div className="flex items-center">
                {user.email_verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-green-600 font-medium">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-amber-600 font-medium">Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Need help?</strong> If you need to change your email address or have other account issues, 
              please contact our support team.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileUpdateForm;
