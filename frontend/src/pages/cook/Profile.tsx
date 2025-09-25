import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Trash2,
  ChefHat,
  Clock,
  Star,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService, CookProfileResponse } from "@/services/userService";

// Types for profile data
interface UserProfile {
  specialty_cuisine?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  available_hours?: string;
  service_location?: string;
  bio?: string;
  rating_average?: number;
  total_reviews?: number;
}

interface UserData {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  address?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  // Cook profile fields directly from backend serializer
  specialty_cuisine?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  available_hours?: string;
  service_location?: string;
  bio?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Notification Component
const Notification: React.FC<NotificationState & { onClose: () => void }> = ({
  show,
  message,
  type,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in max-w-md`}>
      <div className="flex items-start justify-between">
        <span className="text-sm leading-relaxed pr-2">{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
};

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<CookProfileResponse | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  // Combined profile data (user + cook profile)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    address: "",
    specialty_cuisine: "",
    experience_level: "beginner" as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    available_hours: "",
    service_location: "",
    bio: ""
  });

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
  };

  // Hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await userService.getUserProfile();
        setProfileData(profile);
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          username: profile.username || "",
          address: profile.address || "",
          specialty_cuisine: profile.specialty_cuisine || "",
          experience_level: profile.experience_level || "beginner",
          available_hours: profile.available_hours || "",
          service_location: profile.service_location || "",
          bio: profile.bio || ""
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        showNotification('Failed to load profile data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await userService.updateUserProfile(formData);
      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Profile update failed:', error);
      showNotification('Failed to update profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        username: profileData.username || "",
        address: profileData.address || "",
        specialty_cuisine: profileData.specialty_cuisine || "",
        experience_level: profileData.experience_level || "beginner",
        available_hours: profileData.available_hours || "",
        service_location: profileData.service_location || "",
        bio: profileData.bio || ""
      });
    }
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await userService.deleteUserAccount();
      showNotification('Account deleted successfully.', 'success');
      // Redirect to login or handle logout
    } catch (error) {
      console.error('Account deletion failed:', error);
      showNotification('Failed to delete account. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🍽️ Profile Management</h1>
          <p className="text-muted-foreground mt-1">
            Review, update, or delete your account. Keep your information accurate so customers and the system can connect with you seamlessly.
          </p>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
          disabled={loading}
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="chef-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar || "/chef-avatar.jpg"} alt="Chef Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profileData?.name ? profileData.name.charAt(0).toUpperCase() : "CH"}
                </AvatarFallback>
              </Avatar>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Full Name"
                  className="text-center font-semibold"
                />
                <Input
                  value={formData.username || ""}
                  onChange={(e) => handleFormChange("username", e.target.value)}
                  placeholder="Username"
                  className="text-center text-sm"
                />
              </div>
            ) : (
              <div>
                <CardTitle className="text-xl">{profileData?.name || "Chef"}</CardTitle>
                <p className="text-sm text-muted-foreground">@{profileData?.username || "username"}</p>
              </div>
            )}
            <div className="flex justify-center mb-2 mt-2">
              <Badge variant="secondary" className="capitalize">
                {user?.role === 'cook' ? '👨‍🍳 Cook' : user?.role || 'cook'}
              </Badge>
            </div>
            {profileData?.specialty_cuisine && (
              <div className="flex justify-center mb-2">
                <Badge variant="outline" className="text-xs">
                  🍳 {profileData.specialty_cuisine}
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>
                {profileData?.rating_average ? 
                  `${profileData.rating_average.toFixed(1)} rating • ${profileData.total_reviews || 0} reviews` :
                  "No reviews yet"
                }
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{profileData?.email || "No email"}</span>
            </div>
            
            {/* Phone */}
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  placeholder="Phone number"
                  className="text-sm h-8"
                />
              ) : (
                <span>{profileData?.phone || "No phone"}</span>
              )}
            </div>
            
            {/* Experience Level */}
            <div className="flex items-center gap-3 text-sm">
              <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Select
                  value={formData.experience_level}
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') => 
                    handleFormChange("experience_level", value)
                  }
                >
                  <SelectTrigger className="text-sm h-8">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="capitalize">{profileData?.experience_level || "beginner"}</span>
              )}
            </div>
            
            {/* Available Hours */}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={formData.available_hours || ""}
                  onChange={(e) => handleFormChange("available_hours", e.target.value)}
                  placeholder="Available hours"
                  className="text-sm h-8"
                />
              ) : (
                <span>{profileData?.available_hours || "Not specified"}</span>
              )}
            </div>
            
            {/* Service Location */}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={formData.service_location || ""}
                  onChange={(e) => handleFormChange("service_location", e.target.value)}
                  placeholder="Service location"
                  className="text-sm h-8"
                />
              ) : (
                <span>{profileData?.service_location || "Not specified"}</span>
              )}
            </div>
            
            {/* Join Date */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
            </div>

            {/* Bio Section */}
            {(isEditing || profileData?.bio) && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">About Me</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.bio || ""}
                    onChange={(e) => handleFormChange("bio", e.target.value)}
                    placeholder="Tell customers about yourself..."
                    className="text-sm min-h-[60px] resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{profileData?.bio || "No bio available"}</p>
                )}
              </div>
            )}
          </CardContent>
          
          {/* Action Buttons for Profile Card */}
          {isEditing && (
            <div className="px-6 pb-6">
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 h-8 text-sm"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1 h-8 text-sm"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="chef-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Basic Information 📝
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name 📝</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address 📧</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    placeholder="Email cannot be changed"
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number 📱</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username 👤</Label>
                  <Input
                    id="username"
                    value={formData.username || ""}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address 🏠</Label>
                <Textarea
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleFormChange("address", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cook Details Card */}
          <Card className="chef-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                Cook Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty_cuisine">Specialty Cuisine 🍳</Label>
                  {isEditing ? (
                    <Select
                      value={formData.specialty_cuisine || ""}
                      onValueChange={(value) => handleFormChange("specialty_cuisine", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <SelectItem value="Sri Lankan">Sri Lankan</SelectItem>
                        <SelectItem value="Pastry">Pastry</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.specialty_cuisine || "Not specified"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level 🎓</Label>
                  {isEditing ? (
                    <Select
                      value={formData.experience_level}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') => 
                        handleFormChange("experience_level", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.experience_level}
                      disabled
                      className="bg-muted capitalize"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="available_hours">Available Hours ⏰</Label>
                  <Input
                    id="available_hours"
                    value={formData.available_hours || ""}
                    onChange={(e) => handleFormChange("available_hours", e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Mon-Fri 9AM-6PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_location">Service Location 📍</Label>
                  <Input
                    id="service_location"
                    value={formData.service_location || ""}
                    onChange={(e) => handleFormChange("service_location", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Where you provide services"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio / About Me ✍️</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={(e) => handleFormChange("bio", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell customers about yourself"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-between items-center pt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account ❌
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={loading}
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel ↩️
                </Button>
                <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes ✅'}
                </Button>
              </div>
            </div>
          )}

          {/* Helper Note */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📌 <strong>Helper note:</strong> Your data is securely stored. You can update or delete your account anytime. 
              Deleting your account is permanent and cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
