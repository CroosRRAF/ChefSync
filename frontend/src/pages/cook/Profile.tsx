import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useUserStore } from '@/store/userStore';
import { 
  ChefHat, 
  Save, 
  Camera, 
  Star, 
  Award, 
  Clock, 
  Users, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  CheckCircle,
  Utensils,
  Thermometer,
  Zap
} from 'lucide-react';

const CookProfile: React.FC = () => {
  const { user } = useAuth();
  const { updateUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: 'Passionate chef with 8+ years of experience in Italian and Mediterranean cuisine. Specializing in fresh pasta, wood-fired pizzas, and seasonal dishes.',
    specialties: ['Italian Cuisine', 'Mediterranean', 'Pasta Making', 'Wood-fired Cooking'],
    experience: '8 years',
    rating: 4.8,
    totalOrders: 1247,
    kitchenEquipment: ['Oven', 'Stove', 'Grill', 'Pasta Machine', 'Wood-fired Oven'],
    certifications: ['Food Safety Certified', 'Culinary Arts Diploma', 'Italian Cuisine Specialist'],
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Here you would typically call an API to update the user profile
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chef Profile</h1>
              <p className="text-gray-600 mt-2">Manage your professional kitchen profile</p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border-none shadow-md">
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <Avatar className="h-32 w-32 mx-auto ring-4 ring-orange-500/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-orange-500 text-white font-bold text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-xl mt-4">{user.name}</CardTitle>
                <CardDescription className="text-orange-600 font-medium">Kitchen Master</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{formData.rating}</span>
                  <span className="text-gray-500">(4.8/5.0)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{formData.totalOrders}</p>
                    <p className="text-sm text-gray-600">Orders</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{formData.experience}</p>
                    <p className="text-sm text-gray-600">Experience</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-orange-600" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{cert}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-orange-600">98%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>Your personal and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Kitchen Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Culinary Specialties */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                  <span>Culinary Specialties</span>
                </CardTitle>
                <CardDescription>Your areas of expertise and cooking styles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-4">
                    <Label htmlFor="new-specialty">Add Specialty</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="new-specialty"
                        placeholder="e.g., French Cuisine"
                        className="flex-1"
                      />
                      <Button size="sm">Add</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kitchen Equipment */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  <span>Kitchen Equipment</span>
                </CardTitle>
                <CardDescription>Available cooking equipment and tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.kitchenEquipment.map((equipment, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">{equipment}</span>
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-4">
                    <Label htmlFor="new-equipment">Add Equipment</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="new-equipment"
                        placeholder="e.g., Sous Vide Machine"
                        className="flex-1"
                      />
                      <Button size="sm">Add</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Schedule */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Working Schedule</span>
                </CardTitle>
                <CardDescription>Your preferred working hours and availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={formData.workingHours.start}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={formData.workingHours.end}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day.toLowerCase()}
                          checked={formData.workingHours.days.includes(day)}
                          disabled={!isEditing}
                          className="rounded"
                        />
                        <Label htmlFor={day.toLowerCase()} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <Card className="border-none shadow-md bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Save Changes</h3>
                      <p className="text-sm text-gray-600">Update your profile information</p>
                    </div>
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookProfile;
