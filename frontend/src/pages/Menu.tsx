import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ChefHat, Filter, Search, Star, Clock, Users, Utensils, DollarSign, 
  Heart, MapPin, Truck, ShoppingBag, X, Gift, Percent, RotateCcw,
  Eye, ChevronRight, Plus, Minus, Leaf, Sun, Moon, Settings,
  Bell, User, LogOut, Menu as MenuIcon, Home, History, 
  Award, Zap, Target, Flame, Shield, Sparkles,
  Mic, MicOff, Navigation, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { menuService, FoodItem, FoodPrice, Cuisine, FoodCategory, CartSummary } from "@/services/menuService";
import { toast } from "sonner";
import DraggableCartIcon from "@/components/cart/DraggableCartIcon";
import CartPopup from "@/components/cart/CartPopup";
import GoogleMapLocationPicker from "@/components/maps/GoogleMapLocationPicker";

// Geolocation and Voice Search hooks
const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  const startLocationWatch = useCallback((onLocationChange: (location: { lat: number; lng: number }) => void) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onLocationChange(newLocation);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute
      }
    );

    return watchId;
  }, []);

  const stopLocationWatch = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, loading, getCurrentLocation, startLocationWatch, stopLocationWatch };
};

const useVoiceSearch = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice search is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  return { isListening, transcript, startListening };
};

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { cartSummary, addToCart: addToCartContext } = useCart();
  
  // Geolocation and Voice Search
  const { location, error: locationError, loading: locationLoading, getCurrentLocation, startLocationWatch, stopLocationWatch } = useGeolocation();
  const { isListening, transcript, startListening } = useVoiceSearch();
  
  // State management
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [foodPrices, setFoodPrices] = useState<FoodPrice[]>([]);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDelivery, setIsDelivery] = useState(true);
  const [favorites, setFavorites] = useState(new Set<number>());
  const [address, setAddress] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [quantities, setQuantities] = useState<{[cookId: number]: number}>({});
  const [manualAddress, setManualAddress] = useState<string>('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedSizes, setSelectedSizes] = useState<{[cookId: number]: number}>({});
  const [cartPopupOpen, setCartPopupOpen] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [lastToastTime, setLastToastTime] = useState<number>(0);
  const [locationUpdateTimeout, setLocationUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    minPrice: 0,
    maxPrice: 100,
    isVegetarian: false,
    isVegan: false,
    search: "",
    cuisine: "",
    rating: 0,
    prepTime: 120
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Get location on first load
  useEffect(() => {
    if (!location && !locationError) {
      getCurrentLocation();
    }
  }, [location, locationError, getCurrentLocation]);

  // Handle automatic location updates
  const handleLocationChange = useCallback((newLocation: { lat: number; lng: number }) => {
    // Only update if it's not a manual location change and location has changed significantly
    if (!isManualLocation && hasLocationChanged(newLocation)) {
      console.log('Location changed significantly, updating address...');
      
      // Clear any existing timeout
      if (locationUpdateTimeout) {
        clearTimeout(locationUpdateTimeout);
      }
      
      // Set a new timeout to debounce location updates
      const timeout = setTimeout(() => {
        setLastKnownLocation(newLocation);
        getAddressFromCoordinates(newLocation.lat, newLocation.lng);
        showToastMessage('Location updated automatically!');
      }, 1000); // 1 second delay
      
      setLocationUpdateTimeout(timeout);
    }
  }, [isManualLocation, lastKnownLocation, locationUpdateTimeout]);

  // Start location watching when component mounts
  useEffect(() => {
    if (navigator.geolocation && !locationWatchId) {
      const watchId = startLocationWatch(handleLocationChange);
      if (watchId) {
        setLocationWatchId(watchId);
      }
    }

    return () => {
      if (locationWatchId) {
        stopLocationWatch(locationWatchId);
        setLocationWatchId(null);
      }
      if (locationUpdateTimeout) {
        clearTimeout(locationUpdateTimeout);
      }
    };
  }, [startLocationWatch, stopLocationWatch, handleLocationChange, locationWatchId]);

  // Update address when location changes
  useEffect(() => {
    const currentLocation = manualLocation || location;
    if (currentLocation) {
      setAddressLoading(true);
      // Try to get a readable address from coordinates
      getAddressFromCoordinates(currentLocation.lat, currentLocation.lng);
      // Update last known location
      setLastKnownLocation(currentLocation);
    } else if (locationError && !manualLocation) {
      setAddress('Location not available');
    }
  }, [location, locationError, manualLocation]);

  // Update search when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setFilters(prev => ({ ...prev, search: transcript }));
    }
  }, [transcript]);

  // Fetch data when filters change
  useEffect(() => {
    fetchFoodItems();
  }, [filters, location]);

  // Debug categories and cuisines
  useEffect(() => {
    console.log('Categories updated:', categories.length, categories);
    console.log('Cuisines updated:', cuisines.length, cuisines);
  }, [categories, cuisines]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('Fetching initial data...');
      
      const [foodsData, categoriesData, cuisinesData] = await Promise.all([
        menuService.getFoods({ page_size: 1000 } as any), // Fetch all food items
        menuService.getCategories(),
        menuService.getCuisines()
      ]);
      
      console.log('Raw API responses:');
      console.log('Foods:', foodsData);
      console.log('Categories:', categoriesData);
      console.log('Cuisines:', cuisinesData);
      
      const categoriesList = categoriesData.results || categoriesData;
      const cuisinesList = cuisinesData.results || cuisinesData;
      
      // Create unique categories with cuisine information
      const uniqueCategories = categoriesList.reduce((acc: any[], category: any) => {
        const existingCategory = acc.find(cat => cat.name === category.name);
        if (!existingCategory) {
          // Add the first occurrence of this category name
          acc.push({
            ...category,
            cuisines: [category.cuisine_name]
          });
        } else {
          // Add cuisine to existing category if not already present
          if (!existingCategory.cuisines.includes(category.cuisine_name)) {
            existingCategory.cuisines.push(category.cuisine_name);
          }
        }
        return acc;
      }, []);
      
      const foods = foodsData.results || foodsData;
      
      // Sort foods by chef distance if user location is available
      if ((manualLocation || location) && foods.length > 0) {
        const userLocation = manualLocation || location;
        const sortedFoods = sortFoodsByChefDistance(foods, userLocation);
        setFoodItems(sortedFoods);
      } else {
        setFoodItems(foods);
      }
      
      setCategories(uniqueCategories);
      setCuisines(cuisinesList);
      
      console.log('Original categories:', categoriesList.length);
      console.log('Unique categories:', uniqueCategories.length);
      console.log('Set categories:', uniqueCategories);
      console.log('Set cuisines:', cuisinesList);
      console.log('Categories count:', uniqueCategories.length);
      console.log('Cuisines count:', cuisinesList.length);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load menu data');
      
      // Set empty arrays as fallback
      setCategories([]);
      setCuisines([]);
      setFoodItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const params = {
        q: filters.search,
        category: filters.category,
        cuisine: filters.cuisine,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        veg: filters.isVegetarian || filters.isVegan ? true : undefined,
        lat: (manualLocation || location)?.lat,
        lng: (manualLocation || location)?.lng,
        delivery: isDelivery,
        page_size: 1000 as any // Fetch all food items
      };

      const data = await menuService.getFoods(params);
      const foods = data.results || data;
      
      // Sort foods by chef distance if user location is available
      if ((manualLocation || location) && foods.length > 0) {
        const userLocation = manualLocation || location;
        const sortedFoods = sortFoodsByChefDistance(foods, userLocation);
        setFoodItems(sortedFoods);
      } else {
        setFoodItems(foods);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
      toast.error('Failed to load food items');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodPrices = async (foodId: number) => {
    try {
      const data = await menuService.getFoodPrices(foodId, (manualLocation || location)?.lat, (manualLocation || location)?.lng);
      console.log('Food prices API response:', data);
      // The API returns prices directly as an array, not wrapped in a 'prices' property
      const prices = Array.isArray(data) ? data : [];
      
      // Group prices by cook to show one entry per cook with size options
      const groupedPrices = prices.reduce((acc: any, price: any) => {
        const cookId = price.cook.id;
        if (!acc[cookId]) {
          acc[cookId] = {
            cook: price.cook,
            prices: []
          };
        }
        acc[cookId].prices.push(price);
        return acc;
      }, {});
      
      // Convert to array and sort prices by size
      const groupedArray = Object.values(groupedPrices).map((group: any) => ({
        ...group,
        prices: group.prices.sort((a: any, b: any) => {
          const sizeOrder = { 'Small': 1, 'Medium': 2, 'Large': 3 };
          return (sizeOrder[a.size as keyof typeof sizeOrder] || 0) - (sizeOrder[b.size as keyof typeof sizeOrder] || 0);
        })
      }));
      
      setFoodPrices(groupedArray);
      
      // Set default size selection and quantities (first size for each cook, quantity 1)
      const defaultSizes: {[cookId: number]: number} = {};
      const defaultQuantities: {[cookId: number]: number} = {};
      groupedArray.forEach((group: any) => {
        defaultSizes[group.cook.id] = 0; // Select first size by default
        defaultQuantities[group.cook.id] = 1; // Default quantity 1
      });
      setSelectedSizes(defaultSizes);
      setQuantities(defaultQuantities);
    } catch (error) {
      console.error('Error fetching food prices:', error);
      toast.error('Failed to load food prices');
    }
  };


  const handleFoodClick = async (food: FoodItem) => {
    setSelectedFoodItem(food);
    setSelectedSizes({}); // Reset selected sizes
    setQuantities({}); // Reset quantities
    await fetchFoodPrices(food.food_id);
    setFoodModalOpen(true);
  };

  const handleAddToCart = async (priceId: number, quantity: number = 1) => {
    try {
      // Check if user is authenticated first
      if (!isAuthenticated || user?.role !== 'customer') {
        toast.error('Please login as a customer to add items to cart');
        navigate('/auth/login', { state: { from: '/menu' } });
        return;
      }
      
      await addToCartContext(priceId, quantity);
      
      // Success feedback
      const itemText = quantity === 1 ? 'Item' : `${quantity} items`;
      toast.success(`${itemText} added to cart successfully! 🛒`);
      
      // Show cart popup after adding item
      setTimeout(() => setCartPopupOpen(true), 500);
      
      // Close the food modal after adding to cart
      setFoodModalOpen(false);
      
    } catch (error: any) {
      console.error('Add to cart error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error('Please login to add items to cart');
        navigate('/auth/login', { state: { from: '/menu' } });
      } else if (error.message === 'Please login to add items to cart') {
        toast.error('Please login to add items to cart');
        navigate('/auth/login', { state: { from: '/menu' } });
      } else if (error.response?.status === 400) {
        toast.error('Invalid request. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(`Failed to add item to cart: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Function to get address suggestions using Google Places API
  const getAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Using Google Places Autocomplete API with proper API key
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&types=address&components=country:lk&language=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setAddressSuggestions(data.predictions || []);
          setShowSuggestions(true);
        } else {
          console.warn('Google Places API error:', data.status);
          // Fallback to simple suggestions
          setAddressSuggestions([
            { description: `${query}, Colombo, Sri Lanka`, place_id: '1' },
            { description: `${query}, Kandy, Sri Lanka`, place_id: '2' },
            { description: `${query}, Galle, Sri Lanka`, place_id: '3' }
          ]);
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Address suggestions error:', error);
      // Fallback to simple suggestions
      setAddressSuggestions([
        { description: `${query}, Colombo, Sri Lanka`, place_id: '1' },
        { description: `${query}, Kandy, Sri Lanka`, place_id: '2' },
        { description: `${query}, Galle, Sri Lanka`, place_id: '3' }
      ]);
      setShowSuggestions(true);
    }
  };

  // Function to get place details and coordinates
  const getPlaceDetails = async (placeId: string) => {
    try {
      setAddressLoading(true);
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        throw new Error('API key not available');
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.result) {
          const place = data.result;
          
          if (place && place.geometry) {
            const { lat, lng } = place.geometry.location;
            setManualLocation({ lat, lng });
            setAddress(place.formatted_address);
            setSelectedPlace(place);
            setLastKnownLocation({ lat, lng });
            setIsManualLocation(true);
            showLocationSetMessage();
            return { lat, lng };
          }
        } else {
          console.warn('Google Places API error:', data.status);
          throw new Error('Place details not found');
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
      // Fallback coordinates for Sri Lanka
      const fallbackCoords = { lat: 6.9271, lng: 79.8612 };
      setManualLocation(fallbackCoords);
      setAddress(manualAddress || 'Colombo, Sri Lanka');
      setLastKnownLocation(fallbackCoords);
      setIsManualLocation(true);
      showLocationSetMessage();
      return fallbackCoords;
    } finally {
      setAddressLoading(false);
    }
  };

  // Function to geocode address to coordinates (fallback)
  const geocodeAddress = async (address: string) => {
    try {
      setAddressLoading(true);
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        throw new Error('API key not available');
      }
      
      // Try to get real coordinates using geocoding
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&components=country:lk`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const { lat, lng } = result.geometry.location;
          setManualLocation({ lat, lng });
          setAddress(result.formatted_address);
          setLastKnownLocation({ lat, lng });
          setIsManualLocation(true);
          showLocationSetMessage();
          return { lat, lng };
        } else {
          console.warn('Geocoding API error:', data.status);
          throw new Error('Address not found');
        }
      }
      
      // Fallback coordinates for Sri Lanka
      const defaultCoords = { lat: 6.9271, lng: 79.8612 };
      
      setManualLocation(defaultCoords);
      setAddress(address || 'Colombo, Sri Lanka');
      setLastKnownLocation(defaultCoords);
      setIsManualLocation(true);
      showLocationSetMessage();
      return defaultCoords;
      
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Could not set the address. Please try again.');
      return null;
    } finally {
      setAddressLoading(false);
    }
  };

  // Function to handle address input change
  const handleAddressInputChange = (value: string) => {
    setManualAddress(value);
    if (value.length >= 3) {
      getAddressSuggestions(value);
    } else {
      setShowSuggestions(false);
    }
  };

  // Function to handle suggestion selection
  const handleSuggestionSelect = async (suggestion: any) => {
    setManualAddress(suggestion.description);
    setShowSuggestions(false);
    
    if (suggestion.place_id) {
      await getPlaceDetails(suggestion.place_id);
    } else {
      await geocodeAddress(suggestion.description);
    }
    
    setIsEditingAddress(false);
    setShowLocationInput(false);
  };

  // Function to get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setAddressLoading(true);
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        throw new Error('API key not available');
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const address = data.results[0].formatted_address;
          setAddress(address);
          showLocationSetMessage();
          return;
        } else {
          console.warn('Reverse geocoding API error:', data.status);
          throw new Error('Address not found');
        }
      }
    } catch (error) {
      console.log('Reverse geocoding not available, using coordinates');
    }
    
    // Fallback to coordinates if reverse geocoding fails
    setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    showLocationSetMessage();
  };

  // Function to handle manual address input (fallback)
  const handleManualAddress = async () => {
    if (manualAddress.trim()) {
      const coords = await geocodeAddress(manualAddress.trim());
      if (coords) {
        setIsEditingAddress(false);
        setShowLocationInput(false);
      }
    } else {
      toast.error('Please enter a valid address');
    }
  };

  // Function to handle location selection from map picker
  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setManualLocation({ lat: location.lat, lng: location.lng });
    setAddress(location.address);
    setLastKnownLocation({ lat: location.lat, lng: location.lng });
    setIsManualLocation(true);
    setShowMapPicker(false);
    showLocationSetMessage();
  };

  // Function to enable automatic location tracking
  const enableAutomaticLocation = () => {
    setIsManualLocation(false);
    setManualLocation(null);
    getCurrentLocation();
    showToastMessage('Automatic location tracking enabled!');
  };

  // Function to show toast messages with debouncing to prevent duplicates
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const now = Date.now();
    const timeSinceLastToast = now - lastToastTime;
    
    // Only show toast if it's been more than 2 seconds since the last one
    if (timeSinceLastToast > 2000) {
      setLastToastTime(now);
      if (type === 'success') {
        toast.success(message);
      } else if (type === 'error') {
        toast.error(message);
      } else {
        toast.info(message);
      }
    }
  };

  // Function to show unified location set message
  const showLocationSetMessage = () => {
    showToastMessage('Location set successfully!');
  };

  // Function to calculate distance between two coordinates (in kilometers)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Function to sort foods by chef distance from user location
  const sortFoodsByChefDistance = (foods: FoodItem[], userLocation: { lat: number; lng: number }): FoodItem[] => {
    return foods.sort((a, b) => {
      // Get the closest chef distance for each food item
      const aDistance = getClosestChefDistance(a, userLocation);
      const bDistance = getClosestChefDistance(b, userLocation);
      
      // Sort by distance (closest first)
      return aDistance - bDistance;
    });
  };

  // Function to get the closest chef distance for a food item
  const getClosestChefDistance = (food: FoodItem, userLocation: { lat: number; lng: number }): number => {
    // If food has chef locations, find the closest one
    const foodWithLocations = food as any; // Type assertion for chef_locations
    if (foodWithLocations.chef_locations && foodWithLocations.chef_locations.length > 0) {
      let minDistance = Infinity;
      
      foodWithLocations.chef_locations.forEach((chefLocation: any) => {
        if (chefLocation.latitude && chefLocation.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            chefLocation.latitude,
            chefLocation.longitude
          );
          minDistance = Math.min(minDistance, distance);
        }
      });
      
      return minDistance === Infinity ? 999 : minDistance; // Default high distance if no valid locations
    }
    
    // If no chef locations, use a default distance based on available cooks count
    // Foods with more available cooks are prioritized
    return 50 + (10 - (food.available_cooks_count || 0)); // Lower distance for more available cooks
  };

  // Function to get distance display text for a food item
  const getDistanceDisplay = (food: FoodItem): string => {
    const userLocation = manualLocation || location;
    if (!userLocation) return '';

    const distance = getClosestChefDistance(food, userLocation);
    
    if (distance >= 999) {
      return 'Distance not available';
    } else if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else {
      return `${distance.toFixed(1)}km away`;
    }
  };

  // Function to check if location has changed significantly
  const hasLocationChanged = (newLocation: { lat: number; lng: number }): boolean => {
    if (!lastKnownLocation) return true;
    
    const distance = calculateDistance(
      lastKnownLocation.lat, 
      lastKnownLocation.lng, 
      newLocation.lat, 
      newLocation.lng
    );
    
    return distance >= 2; // 2km threshold
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.address-suggestions-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: 0,
      maxPrice: 100,
      isVegetarian: false,
      isVegan: false,
      search: "",
      cuisine: "",
      rating: 0,
    prepTime: 120
  });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleFavorite = (foodId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(foodId)) {
        newFavorites.delete(foodId);
      } else {
        newFavorites.add(foodId);
      }
      return newFavorites;
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      appetizers: "🥗",
      "main course": "🍽️",
      "main_course": "🍽️",
      desserts: "🍰",
      beverages: "🥤",
      drinks: "🥤",
      snacks: "🍿",
      salads: "🥙",
      soups: "🍲",
      sides: "🥔",
      breakfast: "🥞",
      lunch: "🍱",
      dinner: "🍽️",
      vegetarian: "🌱",
      vegan: "🌿",
      seafood: "🐟",
      meat: "🥩",
      poultry: "🍗",
      pasta: "🍝",
      pizza: "🍕",
      bread: "🍞",
      rice: "🍚",
      noodles: "🍜"
    };
    
    const lowerCategory = category.toLowerCase();
    return icons[lowerCategory] || icons[category] || "🍽️";
  };

  const FoodCard = ({ item }: { item: FoodItem }) => {

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
        <div className="relative cursor-pointer" onClick={() => handleFoodClick(item)}>
          <img
            src={item.primary_image || item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
            alt={item.name}
            className="w-full h-48 object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
          <button
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.food_id);
            }}
          >
            <Heart 
              className={`h-4 w-4 ${favorites.has(item.food_id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
          <div className="absolute top-2 left-2 flex gap-1">
            {item.is_vegetarian && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                🌱
              </Badge>
            )}
            {item.is_vegan && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                🌿
              </Badge>
            )}
            {item.spice_level === 'hot' && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                🌶️
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold line-clamp-1 text-lg cursor-pointer" onClick={() => handleFoodClick(item)}>{item.name}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{item.rating_average ? Number(item.rating_average).toFixed(1) : 'N/A'}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2 cursor-pointer" onClick={() => handleFoodClick(item)}>
            {item.description}
          </p>
          
          {/* Food Information Only - No Prices on Cards */}
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{item.available_cooks_count} cook{item.available_cooks_count !== 1 ? 's' : ''} available</span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4" />
              <span>{item.preparation_time} min</span>
            </div>
            
            {/* Distance Information */}
            {(manualLocation || location) && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                <MapPin className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">
                  {getDistanceDisplay(item)}
                </span>
              </div>
            )}
            
            <div className="mt-2 text-center">
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Click to view prices and cooks
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{item.rating_average ? Number(item.rating_average).toFixed(1) : 'N/A'}</span>
              <span className="mx-2">•</span>
              <span>{item.total_reviews} reviews</span>
            </div>
            
            {/* View Details Button - No direct Add to Cart */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFoodClick(item)}
              className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SectionHeader = ({ title, subtitle, showViewAll = false }: { 
    title: string; 
    subtitle?: string; 
    showViewAll?: boolean; 
  }) => (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {showViewAll && (
        <Button variant="ghost" size="sm" className="text-primary">
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Address Display */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {isManualLocation && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Manual
                </span>
              )}
              {!isManualLocation && address && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Auto
                </span>
              )}
              {isEditingAddress ? (
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter your address"
                      value={manualAddress}
                      onChange={(e) => handleAddressInputChange(e.target.value)}
                      className="h-8 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleManualAddress()}
                      onFocus={() => manualAddress.length >= 3 && setShowSuggestions(true)}
                    />
                    
                    {/* Address Suggestions Dropdown */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="address-suggestions-container absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.place_id || index}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                            onClick={() => handleSuggestionSelect(suggestion)}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-gray-900 dark:text-white">
                                {suggestion.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={handleManualAddress}
                    disabled={addressLoading}
                    className="h-8 px-3 text-xs"
                  >
                    {addressLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingAddress(false);
                      setManualAddress('');
                      setShowSuggestions(false);
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => setIsEditingAddress(true)}
                    title="Click to change address"
                  >
                    {address || (locationLoading ? 'Getting location...' : 'Location not available')}
                  </span>
                  {!address && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingAddress(true)}
                      className="text-xs h-6 px-2"
                    >
                      Set Address
                    </Button>
                  )}
                  {address && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMapPicker(true)}
                        className="text-xs h-6 px-2"
                        title="Open map to change location"
                      >
                        <MapPin className="h-3 w-3" />
                      </Button>
                      {isManualLocation && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={enableAutomaticLocation}
                          className="text-xs h-6 px-2"
                          title="Enable automatic location tracking"
                        >
                          <Navigation className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  {locationError && !manualLocation && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="text-xs h-6 px-2"
                      >
                        Use GPS
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMapPicker(true)}
                        className="text-xs h-6 px-2"
                      >
                        Map
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLocationInput(!showLocationInput)}
                        className="text-xs h-6 px-2"
                      >
                        Coordinates
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Coordinates Input */}
            {showLocationInput && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Input
                  placeholder="Latitude"
                  type="number"
                  step="0.0001"
                  className="w-24 h-8 text-xs"
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value);
                    if (!isNaN(lat)) {
                      setManualLocation(prev => ({ ...prev, lat }));
                    }
                  }}
                />
                <Input
                  placeholder="Longitude"
                  type="number"
                  step="0.0001"
                  className="w-24 h-8 text-xs"
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value);
                    if (!isNaN(lng)) {
                      setManualLocation(prev => ({ ...prev, lng }));
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (manualLocation?.lat && manualLocation?.lng) {
                      setShowLocationInput(false);
                      setLastKnownLocation(manualLocation);
                      setIsManualLocation(true);
                      // Try to get a readable address from coordinates
                      getAddressFromCoordinates(manualLocation.lat, manualLocation.lng);
                    } else {
                      toast.error('Please enter valid coordinates');
                    }
                  }}
                  className="h-8 px-2 text-xs"
                >
                  Set
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowLocationInput(false);
                    setManualLocation(null);
                  }}
                  className="h-8 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for dishes, cuisines..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 pr-20 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={startListening}
                disabled={isListening}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-3">
              {/* Delivery/Pickup Toggle */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Truck className={`h-4 w-4 ${isDelivery ? 'text-primary' : 'text-gray-400'}`} />
                <Switch
                  checked={!isDelivery}
                  onCheckedChange={(checked) => setIsDelivery(!checked)}
                  className="scale-75"
                />
                <ShoppingBag className={`h-4 w-4 ${!isDelivery ? 'text-primary' : 'text-gray-400'}`} />
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={toggleSidebar}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {sidebarOpen && <span className="sm:hidden">Close</span>}
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-10 w-10 p-0"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Responsive Layout */}
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <div className={`${sidebarOpen ? 'fixed lg:relative' : 'hidden'} w-full lg:w-80 flex-shrink-0 z-50 lg:z-auto`}>
            <div className={`${sidebarOpen ? 'fixed top-0 left-0 h-full w-80 lg:relative lg:top-24 lg:h-auto lg:w-auto' : 'sticky top-24'}`}>
              <Card className="h-full lg:h-auto bg-white dark:bg-gray-900 border-0 shadow-lg lg:shadow-md">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Filter className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Refine your search</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearFilters}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Clear All
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={closeSidebar} 
                        className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-6">

                    {/* Categories */}
                    <div>
                      <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-primary" />
                        Category
                      </label>
                      <div className="space-y-2">
                        <div 
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                            filters.category === "" 
                              ? "bg-primary text-white border-primary shadow-md" 
                              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                          }`}
                          onClick={() => updateFilter('category', '')}
                        >
                          <span className="text-sm font-medium">🍽️ All Categories</span>
                        </div>
                        {categories.length > 0 ? categories.map((category) => (
                          <div
                            key={category.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                              filters.category === category.name 
                                ? "bg-primary text-white border-primary shadow-md" 
                                : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                            }`}
                            onClick={() => updateFilter('category', category.name)}
                          >
                            <span className="text-sm font-medium flex items-center gap-2">
                              <span className="text-lg">{getCategoryIcon(category.name)}</span>
                              <div className="flex flex-col">
                                <span>{category.name}</span>
                                {category.cuisine_name && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {category.cuisine_name}
                                  </span>
                                )}
                              </div>
                            </span>
                          </div>
                        )) : (
                          <div className="text-center text-gray-500 py-4">
                            {loading ? 'Loading categories...' : 'No categories available'}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Cuisine */}
                    <div>
                      <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-primary" />
                        Cuisine
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div 
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border text-center ${
                            filters.cuisine === "" 
                              ? "bg-primary text-white border-primary shadow-md" 
                              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                          }`}
                          onClick={() => updateFilter('cuisine', '')}
                        >
                          <span className="text-sm font-medium">All</span>
                        </div>
                        {cuisines.length > 0 ? cuisines.map((cuisine) => (
                          <div
                            key={cuisine.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border text-center ${
                              filters.cuisine === cuisine.name 
                                ? "bg-primary text-white border-primary shadow-md" 
                                : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                            }`}
                            onClick={() => updateFilter('cuisine', cuisine.name)}
                          >
                            <span className="text-sm font-medium">{cuisine.name}</span>
                          </div>
                        )) : (
                          <div className="text-center text-gray-500 py-4">
                            {loading ? 'Loading cuisines...' : 'No cuisines available'}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Price Range
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-center mb-4">
                          <span className="text-lg font-bold text-primary">
                            LKR {filters.minPrice} - LKR {filters.maxPrice}
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Min Price</label>
                            <Slider
                              value={[filters.minPrice]}
                              onValueChange={(value) => updateFilter('minPrice', value[0])}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Max Price</label>
                            <Slider
                              value={[filters.maxPrice]}
                              onValueChange={(value) => updateFilter('maxPrice', value[0])}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Rating Filter */}
                    <div>
                      <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        Minimum Rating
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-center mb-4">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl font-bold text-primary">{filters.rating}</span>
                            <span className="text-lg text-yellow-500">⭐</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">+ rating</span>
                          </div>
                        </div>
                        <Slider
                          value={[filters.rating]}
                          onValueChange={(value) => updateFilter('rating', value[0])}
                          max={5}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Dietary Preferences */}
                    <div>
                      <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-primary" />
                        Dietary Preferences
                      </label>
                      <div className="space-y-3">
                        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                          filters.isVegetarian 
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                        }`}>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="vegetarian"
                              checked={filters.isVegetarian}
                              onCheckedChange={(checked) => updateFilter('isVegetarian', checked)}
                            />
                            <label htmlFor="vegetarian" className="text-sm font-medium cursor-pointer">
                              🌱 Vegetarian
                            </label>
                          </div>
                          {filters.isVegetarian && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                          filters.isVegan 
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                        }`}>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="vegan"
                              checked={filters.isVegan}
                              onCheckedChange={(checked) => updateFilter('isVegan', checked)}
                            />
                            <label htmlFor="vegan" className="text-sm font-medium cursor-pointer">
                              🌿 Vegan
                            </label>
                          </div>
                          {filters.isVegan && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" onClick={closeSidebar}>
              <div className="fixed inset-0 bg-black/50" />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-8">
              {/* Quick Filter Bar */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Filters:</span>
                  
                  {/* Active Filters Display */}
                  {filters.category && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {filters.category}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('category', '')} />
                    </Badge>
                  )}
                  
                  {filters.cuisine && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {filters.cuisine}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('cuisine', '')} />
                    </Badge>
                  )}
                  
                  {filters.isVegetarian && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      🌱 Vegetarian
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('isVegetarian', false)} />
                    </Badge>
                  )}
                  
                  {filters.isVegan && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      🌿 Vegan
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('isVegan', false)} />
                    </Badge>
                  )}
                  
                  {filters.rating > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      ⭐ {filters.rating}+ Rating
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('rating', 0)} />
                    </Badge>
                  )}
                  
                  {(filters.minPrice > 0 || filters.maxPrice < 100) && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      LKR {filters.minPrice}-{filters.maxPrice}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => {
                        updateFilter('minPrice', 0);
                        updateFilter('maxPrice', 100);
                      }} />
                    </Badge>
                  )}
                  
                  {/* Clear All Button */}
                  {(filters.category || filters.cuisine || filters.isVegetarian || filters.isVegan || filters.rating > 0 || filters.minPrice > 0 || filters.maxPrice < 100) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Menu */}
              <div>
                <SectionHeader 
                  title="🍽️ Our Full Menu" 
                  subtitle={
                    (manualLocation || location) 
                      ? "Foods sorted by distance from your location - nearest chefs first!" 
                      : "Explore all our delicious options"
                  } 
                />
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-muted rounded-t-lg"></div>
                        <CardContent className="p-4">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {foodItems.map((item) => (
                      <FoodCard key={item.food_id} item={item} />
                    ))}
                  </div>
                )}

                {!loading && foodItems.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No dishes found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters to see more options
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Food Detail Modal */}
      <Dialog open={foodModalOpen} onOpenChange={setFoodModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="available-cooks-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {selectedFoodItem?.name} - Available Cooks
            </DialogTitle>
            <p id="available-cooks-description" className="text-sm text-muted-foreground">
              Choose from available cooks and their prices for this dish
            </p>
          </DialogHeader>
          
          {selectedFoodItem && (
            <div className="space-y-6">
              {/* Food Item Details */}
              <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <img
                  src={selectedFoodItem.primary_image || selectedFoodItem.image_url || selectedFoodItem.thumbnail_url || 'https://via.placeholder.com/80x80?text=No+Image'}
                  alt={selectedFoodItem.name}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedFoodItem.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedFoodItem.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedFoodItem.preparation_time} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {selectedFoodItem.rating_average ? Number(selectedFoodItem.rating_average).toFixed(1) : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedFoodItem.available_cooks_count} cooks
                    </span>
                  </div>
                </div>
              </div>

              {/* Available Cooks */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Available Cooks ({foodPrices.length})
                </h4>
                
                {foodPrices.length > 0 ? (
                  <div className="grid gap-4">
                    {foodPrices.map((cookGroup: any) => {
                      const cook = cookGroup.cook;
                      const cookPrices = cookGroup.prices;
                      const selectedPriceIndex = selectedSizes[cook.id] || 0;
                      const selectedPrice = cookPrices[selectedPriceIndex];
                      
                      return (
                        <Card key={cook.id} className="p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-orange-200 dark:border-orange-800">
                              <AvatarImage 
                                src={cook.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(cook.name)}&size=64&background=f97316&color=ffffff&bold=true`} 
                                alt={cook.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <AvatarFallback className="bg-orange-100 text-orange-800 font-bold text-lg">
                                {cook.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-lg">{cook.name}</h5>
                                  <Badge 
                                    variant={cook.is_active ? 'default' : 'secondary'}
                                    className={cook.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600'}
                                  >
                                    {cook.is_active ? 'Available' : 'Busy'}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    LKR {selectedPrice?.price || '0.00'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {selectedPrice?.size || 'Select size'} size
                                  </div>
                                </div>
                              </div>
                              
                              {/* Size Selection */}
                              <div className="mb-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                  Choose Size:
                                </label>
                                <div className="flex gap-2">
                                  {cookPrices.map((price: any, index: number) => (
                                    <Button
                                      key={price.price_id}
                                      variant={selectedPriceIndex === index ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setSelectedSizes(prev => ({ ...prev, [cook.id]: index }))}
                                      className={`text-xs ${
                                        selectedPriceIndex === index 
                                          ? 'bg-orange-500 text-white' 
                                          : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                      }`}
                                    >
                                      {price.size} - LKR {price.price}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{cook.rating} rating</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{selectedPrice?.preparation_time || 0} min prep</span>
                                </span>
                                {selectedPrice?.distance && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{selectedPrice.distance} km away</span>
                                  </span>
                                )}
                                {selectedPrice?.estimated_delivery_time && (
                                  <span className="flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    <span>~{selectedPrice.estimated_delivery_time} min delivery</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Quantity Selector and Add to Cart */}
                            <div className="flex items-center gap-3 mt-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Qty:</span>
                                <div className="flex items-center border rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      const currentQty = quantities[cook.id] || 1;
                                      if (currentQty > 1) {
                                        setQuantities(prev => ({
                                          ...prev,
                                          [cook.id]: currentQty - 1
                                        }));
                                      }
                                    }}
                                    disabled={!cook.is_active || (quantities[cook.id] || 1) <= 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {quantities[cook.id] || 1}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      const currentQty = quantities[cook.id] || 1;
                                      if (currentQty < 10) {
                                        setQuantities(prev => ({
                                          ...prev,
                                          [cook.id]: currentQty + 1
                                        }));
                                      }
                                    }}
                                    disabled={!cook.is_active || (quantities[cook.id] || 1) >= 10}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => selectedPrice && handleAddToCart(selectedPrice.price_id, quantities[cook.id] || 1)}
                                disabled={!cook.is_active || !selectedPrice}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add to Cart (LKR {((parseFloat(selectedPrice?.price || '0') * (quantities[cook.id] || 1))).toFixed(2)})
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No cooks available</h3>
                      <p className="text-muted-foreground">
                        No cooks are currently available for this dish. Please try again later.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Draggable Cart Icon */}
      <DraggableCartIcon 
        onCartClick={() => setCartPopupOpen(true)}
      />

      {/* Cart Popup */}
      <CartPopup 
        isOpen={cartPopupOpen}
        onClose={() => setCartPopupOpen(false)}
        onCheckout={() => navigate('/checkout')}
      />

      {/* Google Maps Location Picker */}
      <GoogleMapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={manualLocation || location}
      />
    </div>
  );
};

export default Menu;
