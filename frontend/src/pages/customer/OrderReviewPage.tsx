import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { customerService } from '@/services/customerService';
import {
  Star,
  ChefHat,
  Package,
  Truck,
  ArrowLeft,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const OrderReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isAuthenticated } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Food/Cook Review
  const [foodRating, setFoodRating] = useState(0);
  const [foodComment, setFoodComment] = useState('');
  const [tasteRating, setTasteRating] = useState(0);
  const [presentationRating, setPresentationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  
  // Delivery Review
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderDetails = await customerService.getOrder(parseInt(orderId!));
      setOrder(orderDetails);
      
      // Check if already reviewed
      try {
        const reviewStatus = await fetch(`/api/orders/reviews/status/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (reviewStatus.ok) {
          const data = await reviewStatus.json();
          if (data.has_food_review || data.has_delivery_review) {
            toast.info('You have already reviewed this order');
            setSubmitted(true);
          }
        }
      } catch (error) {
        console.log('Could not check review status:', error);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (rating: number, type: 'food' | 'delivery' | 'taste' | 'presentation' | 'value') => {
    switch (type) {
      case 'food':
        setFoodRating(rating);
        break;
      case 'delivery':
        setDeliveryRating(rating);
        break;
      case 'taste':
        setTasteRating(rating);
        break;
      case 'presentation':
        setPresentationRating(rating);
        break;
      case 'value':
        setValueRating(rating);
        break;
    }
  };

  const renderStars = (rating: number, setRating: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmitReviews = async () => {
    try {
      setSubmitting(true);
      
      // Validate
      if (foodRating === 0) {
        toast.error('Please rate the food');
        return;
      }
      
      if (deliveryRating === 0 && order?.order_type === 'delivery') {
        toast.error('Please rate the delivery service');
        return;
      }

      // Submit food review
      const foodReviewData = {
        order_id: parseInt(orderId!),
        rating: foodRating,
        comment: foodComment,
        taste_rating: tasteRating || foodRating,
        presentation_rating: presentationRating || foodRating,
        value_rating: valueRating || foodRating,
      };

      const foodResponse = await fetch('/api/orders/reviews/food/submit/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(foodReviewData)
      });

      if (!foodResponse.ok) {
        throw new Error('Failed to submit food review');
      }

      // Submit delivery review (if delivery order)
      if (order?.order_type === 'delivery' && deliveryRating > 0) {
        const deliveryReviewData = {
          order_id: parseInt(orderId!),
          rating: deliveryRating,
          comment: deliveryComment,
        };

        const deliveryResponse = await fetch('/api/orders/reviews/delivery/submit/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deliveryReviewData)
        });

        if (!deliveryResponse.ok) {
          console.error('Failed to submit delivery review');
        }
      }

      toast.success('Thank you for your review!');
      setSubmitted(true);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/customer/orders');
      }, 2000);

    } catch (error) {
      console.error('Error submitting reviews:', error);
      toast.error('Failed to submit reviews. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <Button onClick={() => navigate('/customer/orders')}>
              Go to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your review has been submitted successfully.
            </p>
            <Button 
              onClick={() => navigate('/customer/orders')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Go to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate('/customer/orders')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Review Your Order
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Order #{order.order_number}
          </p>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Chef:</span>
                <span className="font-medium">{order.chef?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">LKR {Math.round(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800">
                  {order.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Food/Cook Review */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-500" />
              Rate Food & Chef
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Overall Rating *
              </Label>
              {renderStars(foodRating, setFoodRating)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm mb-2 block">Taste</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star, 'taste')}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= tasteRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Presentation</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star, 'presentation')}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= presentationRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Value for Money</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star, 'value')}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= valueRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="foodComment" className="text-base font-semibold mb-2 block">
                Your Comments
              </Label>
              <Textarea
                id="foodComment"
                placeholder="Share your experience with the food and chef..."
                value={foodComment}
                onChange={(e) => setFoodComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Review (if delivery order) */}
        {order?.order_type === 'delivery' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                Rate Delivery Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Delivery Rating *
                </Label>
                {renderStars(deliveryRating, setDeliveryRating)}
              </div>

              <div>
                <Label htmlFor="deliveryComment" className="text-base font-semibold mb-2 block">
                  Delivery Comments
                </Label>
                <Textarea
                  id="deliveryComment"
                  placeholder="How was your delivery experience?"
                  value={deliveryComment}
                  onChange={(e) => setDeliveryComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/customer/orders')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReviews}
            disabled={submitting || foodRating === 0}
            className="bg-orange-500 hover:bg-orange-600 min-w-[150px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewPage;

