import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { customerService, type CustomerProfile } from '@/services/customerService';
import { 
  User, 
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
  ShoppingCart,
  Heart,
  Gift,
  CreditCard,
  Bell,
  Shield,
  Settings,
  ArrowLeft,
  Home,
  LayoutDashboard,
  Plus,
  Trash2,
  Check,
  X,
  Building,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: any;
  }
}

const CustomerProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    latitude: '',
    longitude: '',
    is_default: false,
    contact_name: '',
    mobile_number: '',
    alternate_mobile: '',
    delivery_instructions: '',
    gate_code: '',
    best_time_to_deliver: '',
    building_type: '',
    floor_number: ''
  });
  const [stats, setStats] = useState({
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    total_spent: 0,
    average_order_value: 0
  });
  const navigate = useNavigate();
  
  // Fetch profile data and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [profileData, customerStats] = await Promise.all([
          customerService.getProfile(),
          customerService.getCustomerStats()
        ]);
        setProfile(profileData);
        setStats(customerStats);
        console.log('Profile loaded:', profileData);
        console.log('Stats loaded:', customerStats);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default profile and stats on error
        setProfile({
          user_id: parseInt(user.id),
          name: user.name,
          email: user.email,
          phone_no: user.phone || '',
          address: user.address || '',
          role: user.role,
          role_display: user.role,
          profile_image: user.avatar || null,
          email_verified: user.isEmailVerified,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          profile_data: null
        });
        setStats({
          total_orders: 0,
          completed_orders: 0,
          pending_orders: 0,
          total_spent: 0,
          average_order_value: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => console.error('Failed to load Google Maps API');
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        setSelectedLocation(location);
        
        // Update form data with coordinates
        setAddressFormData(prev => ({
          ...prev,
          latitude: location.lat.toString(),
          longitude: location.lng.toString()
        }));

        // Reverse geocode to get address details
        reverseGeocode(location);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please enter address manually.');
      }
    );
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = (location: {lat: number, lng: number}) => {
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0];
        const addressComponents = address.address_components;
        
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let postalCode = '';
        let country = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) route = component.long_name;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.long_name;
          if (types.includes('postal_code')) postalCode = component.long_name;
          if (types.includes('country')) country = component.long_name;
        });

        setAddressFormData(prev => ({
          ...prev,
          address_line1: `${streetNumber} ${route}`.trim(),
          city: city,
          state: state,
          pincode: postalCode,
          country: country || 'India'
        }));
      }
    });
  };

  // Fetch addresses function
  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const response = await fetch('/api/users/addresses/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch addresses:', response.status);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setAddressLoading(false);
    }
  };

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone_no || '',
        address: profile.address || '',
        bio: 'Food enthusiast who loves exploring new cuisines and supporting local restaurants. Always looking for the next great meal!',
        preferences: {
          cuisine: ['Italian', 'Mexican', 'Asian', 'Mediterranean'],
          dietary: ['No restrictions'],
          spiceLevel: 'Medium',
          deliveryTime: '30-45 minutes'
        },
        loyaltyPoints: 1250,
        memberSince: new Date(profile.created_at).getFullYear(),
        favoriteRestaurants: ['Mario\'s Italian', 'Spice Garden', 'Sushi Zen'],
        paymentMethods: [
          { type: 'Credit Card', last4: '**** 1234', isDefault: true },
          { type: 'PayPal', email: profile.email, isDefault: false }
        ],
        notifications: {
          orderUpdates: true,
          promotions: true,
          newRestaurants: false,
          deliveryAlerts: true
        }
      });
    }
  }, [profile]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: 'Food enthusiast who loves exploring new cuisines and supporting local restaurants. Always looking for the next great meal!',
    preferences: {
      cuisine: ['Italian', 'Mexican', 'Asian', 'Mediterranean'],
      dietary: ['No restrictions'],
      spiceLevel: 'Medium',
      deliveryTime: '30-45 minutes'
    },
    loyaltyPoints: 1250,
    memberSince: new Date(user?.createdAt || Date.now()).getFullYear(),
    favoriteRestaurants: ['Mario\'s Italian', 'Spice Garden', 'Sushi Zen'],
    paymentMethods: [
      { type: 'Credit Card', last4: '**** 1234', isDefault: true },
      { type: 'PayPal', email: user?.email, isDefault: false }
    ],
    notifications: {
      orderUpdates: true,
      promotions: true,
      newRestaurants: false,
      deliveryAlerts: true
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, any>),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare the data for API call
      const updateData = {
        name: formData.name,
        phone_no: formData.phone,
        address: formData.address
      };
      
      console.log('Updating profile with data:', updateData);
      
      const updatedProfile = await customerService.updateProfile(updateData);
      
      // Update local profile state
      setProfile(updatedProfile);
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
      console.log('Profile updated:', updatedProfile);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to update profile. Please try again.';
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Address management functions
  const handleAddressInputChange = (field: string, value: string | boolean) => {
    setAddressFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAddress 
        ? `/api/users/addresses/${editingAddress.id}/`
        : '/api/users/addresses/';
      
      const method = editingAddress ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressFormData),
      });

      if (response.ok) {
        await fetchAddresses();
        setShowAddressForm(false);
        setEditingAddress(null);
        resetAddressForm();
        alert(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save address'}`);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressFormData({
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      latitude: address.latitude?.toString() || '',
      longitude: address.longitude?.toString() || '',
      is_default: address.is_default,
      contact_name: address.contact_name || '',
      mobile_number: address.mobile_number || '',
      alternate_mobile: address.alternate_mobile || '',
      delivery_instructions: address.delivery_instructions || '',
      gate_code: address.gate_code || '',
      best_time_to_deliver: address.best_time_to_deliver || '',
      building_type: address.building_type || '',
      floor_number: address.floor_number || ''
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const response = await fetch(`/api/users/addresses/${addressId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        await fetchAddresses();
        alert('Address deleted successfully!');
      } else {
        alert('Failed to delete address. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };

  const resetAddressForm = () => {
    setAddressFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      latitude: '',
      longitude: '',
      is_default: false,
      contact_name: '',
      mobile_number: '',
      alternate_mobile: '',
      delivery_instructions: '',
      gate_code: '',
      best_time_to_deliver: '',
      building_type: '',
      floor_number: ''
    });
  };

  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home') || lowerLabel.includes('house')) return <Home className="h-4 w-4" />;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return <Building className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  // Initialize map with location selection
  const initializeMap = (mapElement: HTMLDivElement) => {
    if (!window.google || !window.google.maps) return;

    const defaultLocation = selectedLocation || currentLocation || { lat: 6.9271, lng: 79.8612 }; // Default to Colombo, Sri Lanka

    const map = new window.google.maps.Map(mapElement, {
      zoom: 15,
      center: defaultLocation,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP
    });

    const marker = new window.google.maps.Marker({
      position: defaultLocation,
      map: map,
      draggable: true,
      title: 'Drag to select location'
    });

    // Update location when marker is dragged
    marker.addListener('dragend', (event: any) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(newLocation);
      setAddressFormData(prev => ({
        ...prev,
        latitude: newLocation.lat.toString(),
        longitude: newLocation.lng.toString()
      }));
      reverseGeocode(newLocation);
    });

    // Update location when map is clicked
    map.addListener('click', (event: any) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      marker.setPosition(newLocation);
      setSelectedLocation(newLocation);
      setAddressFormData(prev => ({
        ...prev,
        latitude: newLocation.lat.toString(),
        longitude: newLocation.lng.toString()
      }));
      reverseGeocode(newLocation);
    });
  };

  // Use selected location from map
  const useSelectedLocation = () => {
    if (selectedLocation) {
      setAddressFormData(prev => ({
        ...prev,
        latitude: selectedLocation.lat.toString(),
        longitude: selectedLocation.lng.toString()
      }));
      reverseGeocode(selectedLocation);
      setShowMap(false);
    }
  };

  // Address search functionality
  const handleAddressSearch = (query: string) => {
    if (!query.trim() || !window.google || !window.google.maps) return;

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: query,
        types: ['address'],
        componentRestrictions: { country: 'lk' } // Restrict to Sri Lanka
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          // For now, just show the first prediction
          if (predictions.length > 0) {
            const placeId = predictions[0].place_id;
            getPlaceDetails(placeId);
          }
        }
      }
    );
  };

  // Get place details from place ID
  const getPlaceDetails = (placeId: string) => {
    if (!window.google || !window.google.maps) return;

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'address_components']
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const location = {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0
          };
          
          setSelectedLocation(location);
          setAddressFormData(prev => ({
            ...prev,
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
            address_line1: place.formatted_address || '',
            label: place.name || 'Selected Address'
          }));
          
          // Parse address components
          if (place.address_components) {
            let city = '';
            let state = '';
            let postalCode = '';
            let country = '';

            place.address_components.forEach(component => {
              const types = component.types;
              if (types.includes('locality')) city = component.long_name;
              if (types.includes('administrative_area_level_1')) state = component.long_name;
              if (types.includes('postal_code')) postalCode = component.long_name;
              if (types.includes('country')) country = component.long_name;
            });

            setAddressFormData(prev => ({
              ...prev,
              city: city,
              state: state,
              pincode: postalCode,
              country: country || 'Sri Lanka'
            }));
          }
        }
      }
    );
  };

  // Profile image upload handler
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await fetch('/api/auth/profile/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile.user);
        alert('Profile image updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to update profile image'}`);
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to update profile image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 50) return { level: 'Diamond', color: 'bg-purple-500', progress: 100 };
    if (orderCount >= 25) return { level: 'Gold', color: 'bg-yellow-500', progress: (orderCount - 25) / 25 * 100 };
    if (orderCount >= 10) return { level: 'Silver', color: 'bg-gray-400', progress: (orderCount - 10) / 15 * 100 };
    return { level: 'Bronze', color: 'bg-orange-400', progress: orderCount / 10 * 100 };
  };

  const customerLevel = getCustomerLevel(stats.completed_orders);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer/dashboard')}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account and preferences</p>
            </div>
            {activeTab === 'profile' && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Profile Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border-none shadow-md">
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <Avatar className="h-32 w-32 mx-auto ring-4 ring-blue-500/20">
                    <AvatarImage src={profile?.profile_image_url || profile?.profile_image || user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-blue-500 text-white font-bold text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
                      onClick={() => document.getElementById('profile-image-upload')?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfileImageUpload}
                  />
                </div>
                <CardTitle className="text-xl mt-4">{user.name}</CardTitle>
                <CardDescription className="text-blue-600 font-medium">Food Lover</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Badge className={`${customerLevel.color} text-white px-3 py-1`}>
                    {customerLevel.level} Member
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.total_orders}</p>
                    <p className="text-sm text-gray-600">Orders</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">LKR {Math.round(stats.total_spent)}</p>
                    <p className="text-sm text-gray-600">Spent</p>
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
                      Member since {formData.memberSince}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Points */}
            <Card className="border-none shadow-md bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Loyalty Points</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{formData.loyaltyPoints}</p>
                  <p className="text-yellow-100 text-sm mb-4">Points Available</p>
                  <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-yellow-50">
                    Redeem Points
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span>Order Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="text-sm font-medium">{stats.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{stats.completed_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium">
                      {stats.total_orders > 0 ? Math.round((stats.completed_orders / stats.total_orders) * 100) : 0}%
                    </span>
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
                  <User className="h-5 w-5 text-blue-600" />
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
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
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

            {/* Food Preferences */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <span>Food Preferences</span>
                </CardTitle>
                <CardDescription>Your culinary preferences and dietary requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Favorite Cuisines</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferences.cuisine.map((cuisine, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions</Label>
                    <Input
                      id="dietary"
                      value={formData.preferences.dietary.join(', ')}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spice-level">Spice Level</Label>
                    <select
                      id="spice-level"
                      value={formData.preferences.spiceLevel}
                      onChange={(e) => handleNestedInputChange('preferences', 'spiceLevel', e.target.value)}
                      disabled={!isEditing}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Hot">Hot</option>
                      <option value="Extra Hot">Extra Hot</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Restaurants */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  <span>Favorite Restaurants</span>
                </CardTitle>
                <CardDescription>Your go-to restaurants and dining spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.favoriteRestaurants.map((restaurant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Star className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium">{restaurant}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Menu
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment Methods</span>
                </CardTitle>
                <CardDescription>Your saved payment options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{method.type}</p>
                          <p className="text-sm text-gray-500">
                            {method.type === 'Credit Card' ? method.last4 : method.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Default
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order-updates">Order Updates</Label>
                      <p className="text-sm text-gray-500">Get notified about order status changes</p>
                    </div>
                    <input
                      type="checkbox"
                      id="order-updates"
                      checked={formData.notifications.orderUpdates}
                      onChange={(e) => handleNestedInputChange('notifications', 'orderUpdates', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promotions">Promotions & Offers</Label>
                      <p className="text-sm text-gray-500">Receive special deals and discounts</p>
                    </div>
                    <input
                      type="checkbox"
                      id="promotions"
                      checked={formData.notifications.promotions}
                      onChange={(e) => handleNestedInputChange('notifications', 'promotions', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-restaurants">New Restaurants</Label>
                      <p className="text-sm text-gray-500">Be notified when new restaurants join</p>
                    </div>
                    <input
                      type="checkbox"
                      id="new-restaurants"
                      checked={formData.notifications.newRestaurants}
                      onChange={(e) => handleNestedInputChange('notifications', 'newRestaurants', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="delivery-alerts">Delivery Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when your order is out for delivery</p>
                    </div>
                    <input
                      type="checkbox"
                      id="delivery-alerts"
                      checked={formData.notifications.deliveryAlerts}
                      onChange={(e) => handleNestedInputChange('notifications', 'deliveryAlerts', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Save Changes</h3>
                      <p className="text-sm text-gray-600">Update your profile information</p>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
        )}

        {/* Address Management Section - Always Visible */}
        <div className="mt-8">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>My Addresses</span>
              </CardTitle>
              <CardDescription>Manage your delivery addresses for easy ordering</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Address Button */}
              <div className="mb-6">
                <Button
                  onClick={() => {
                    setShowAddressForm(true);
                    setEditingAddress(null);
                    resetAddressForm();
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </div>

              {/* Address List */}
              {addressLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(addresses) && addresses.map((address) => (
                    <Card key={address.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getAddressIcon(address.label)}
                            <CardTitle className="text-lg">{address.label}</CardTitle>
                          </div>
                          {address.is_default && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">{address.address_line1}</p>
                          {address.address_line2 && (
                            <p className="text-sm text-gray-600">{address.address_line2}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.pincode}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAddress(address)}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {Array.isArray(addresses) && addresses.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                      <p className="text-gray-600 mb-4">Add your first delivery address to get started</p>
                      <Button
                        onClick={() => {
                          setShowAddressForm(true);
                          setEditingAddress(null);
                          resetAddressForm();
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>


            {/* Add/Edit Address Form Modal */}
            {showAddressForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{editingAddress ? 'Edit Address' : 'Add New Address'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                          resetAddressForm();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      {editingAddress ? 'Update your address information' : 'Add a new delivery address'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      {/* Basic Address Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="label">Address Label</Label>
                          <Input
                            id="label"
                            value={addressFormData.label}
                            onChange={(e) => handleAddressInputChange('label', e.target.value)}
                            placeholder="e.g., Home, Work, Office"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={addressFormData.pincode}
                            onChange={(e) => handleAddressInputChange('pincode', e.target.value)}
                            placeholder="123456"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address_line1">Address Line 1</Label>
                        <Input
                          id="address_line1"
                          value={addressFormData.address_line1}
                          onChange={(e) => handleAddressInputChange('address_line1', e.target.value)}
                          placeholder="Street address, building name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                        <Input
                          id="address_line2"
                          value={addressFormData.address_line2}
                          onChange={(e) => handleAddressInputChange('address_line2', e.target.value)}
                          placeholder="Apartment, floor, etc."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={addressFormData.city}
                            onChange={(e) => handleAddressInputChange('city', e.target.value)}
                            placeholder="City"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={addressFormData.state}
                            onChange={(e) => handleAddressInputChange('state', e.target.value)}
                            placeholder="State"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          value={addressFormData.landmark}
                          onChange={(e) => handleAddressInputChange('landmark', e.target.value)}
                          placeholder="Nearby landmark"
                        />
                      </div>

                      {/* Address Selection */}
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Select Address</h3>
                        <div className="space-y-4">
                          {/* Search Address */}
                          <div>
                            <Label htmlFor="address_search">Search Address</Label>
                            <Input
                              id="address_search"
                              placeholder="Type address to search..."
                              onChange={(e) => handleAddressSearch(e.target.value)}
                            />
                          </div>
                          
                          {/* Address Selection Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={getCurrentLocation}
                              disabled={!navigator.geolocation}
                              className="flex items-center space-x-2"
                            >
                              <Navigation className="h-4 w-4" />
                              <span>Current Location</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowMap(true)}
                              disabled={!mapLoaded}
                              className="flex items-center space-x-2"
                            >
                              <MapPin className="h-4 w-4" />
                              <span>Choose on Map</span>
                            </Button>
                          </div>
                          
                          {/* Selected Address Display */}
                          {addressFormData.address_line1 && (
                            <div className="bg-blue-50 p-3 rounded-md">
                              <p className="text-sm font-medium text-blue-900">Selected Address:</p>
                              <p className="text-sm text-blue-700">{addressFormData.address_line1}</p>
                              {addressFormData.city && (
                                <p className="text-sm text-blue-600">{addressFormData.city}, {addressFormData.state} {addressFormData.pincode}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>


                      {/* Default Address */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={addressFormData.is_default}
                          onChange={(e) => handleAddressInputChange('is_default', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="is_default">Set as default address</Label>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                            resetAddressForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                          <Check className="h-4 w-4 mr-2" />
                          {editingAddress ? 'Update Address' : 'Add Address'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Map Selection Modal */}
            {showMap && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Choose Location on Map</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={useSelectedLocation}
                          disabled={!selectedLocation}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Use This Location
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMap(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Click on the map or drag the marker to select your delivery address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative">
                      {mapLoaded ? (
                        <div 
                          id="map" 
                          className="w-full h-96"
                          ref={(el) => {
                            if (el && mapLoaded) {
                              initializeMap(el);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading Google Maps...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
