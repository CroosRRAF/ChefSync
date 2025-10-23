import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Award,
  ChefHat,
  UtensilsCrossed,
  Package 
} from 'lucide-react';
import { toast } from 'sonner';
import CustomerHomeNavbar from '@/components/layout/CustomerHomeNavbar';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';

interface ChefProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  specialty?: string;
  rating?: number;
  total_orders?: number;
  kitchen_location?: {
    address: string;
    city: string;
  };
}

const ChefProfilePage: React.FC = () => {
  const { cookId } = useParams<{ cookId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [chef, setChef] = useState<ChefProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChefProfile();
  }, [cookId]);

  const fetchChefProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/users/cooks/${cookId}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChef(data);
      } else {
        toast.error('Failed to load chef profile');
      }
    } catch (error) {
      console.error('Error fetching chef profile:', error);
      toast.error('Error loading chef profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        {isAuthenticated && user?.role === 'customer' ? (
          <CustomerHomeNavbar />
        ) : (
          <Navbar />
        )}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading chef profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!chef) {
    return (
      <>
        {isAuthenticated && user?.role === 'customer' ? (
          <CustomerHomeNavbar />
        ) : (
          <Navbar />
        )}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chef Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The chef profile you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {isAuthenticated && user?.role === 'customer' ? (
        <CustomerHomeNavbar />
      ) : (
        <Navbar />
      )}
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Chef Header Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                {/* Chef Avatar */}
                <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {chef.name?.substring(0, 2).toUpperCase() || 'CH'}
                </div>

                {/* Chef Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Chef {chef.name || chef.username}
                      </h1>
                      {chef.specialty && (
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                          Specializes in {chef.specialty}
                        </p>
                      )}
                    </div>
                    {chef.rating && (
                      <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
                        <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {chef.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    {chef.total_orders && (
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {chef.total_orders} orders completed
                        </span>
                      </div>
                    )}
                    {chef.kitchen_location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {chef.kitchen_location.city || chef.kitchen_location.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 mt-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Award className="h-3 w-3 mr-1" />
                      Verified Chef
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Available for Bulk Orders
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                Menu & Specialties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="regular">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="regular">Regular Menu</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Menus</TabsTrigger>
                </TabsList>
                
                <TabsContent value="regular">
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    Browse chef's menu items in the <Button variant="link" onClick={() => navigate('/menu')}>Menu Page</Button>
                  </p>
                </TabsContent>
                
                <TabsContent value="bulk">
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    View chef's bulk menus in the <Button variant="link" onClick={() => navigate('/menu')}>Bulk Orders Section</Button>
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ChefProfilePage;

