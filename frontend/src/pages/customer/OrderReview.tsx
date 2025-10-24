import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
  getOrderReviewStatus,
  submitFoodReview,
  submitDeliveryReview,
  submitBothReviews,
  ReviewStatus,
} from '@/services/reviewService';
import {
  moderateContent,
  getReviewSuggestions,
  enhanceReview,
  analyzeSentiment,
  generateReviewTemplate,
  isAIAvailable,
  ContentModerationResult,
  ReviewSuggestion,
} from '@/services/aiReviewService';
import {
  Star,
  ChefHat,
  Truck,
  CheckCircle,
  ArrowLeft,
  Heart,
  ThumbsUp,
  Package,
  Loader2,
  Sparkles,
  MessageSquare,
  Award,
  Wand2,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, label, size = 'lg' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const starSize = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`${starSize} transition-colors ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-sm text-gray-600">
          {rating === 1 && '😞 Poor'}
          {rating === 2 && '😕 Fair'}
          {rating === 3 && '😊 Good'}
          {rating === 4 && '😄 Very Good'}
          {rating === 5 && '🤩 Excellent'}
        </p>
      )}
    </div>
  );
};

const OrderReview: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);

  // Food/Cook Review State
  const [foodRating, setFoodRating] = useState(0);
  const [foodComment, setFoodComment] = useState('');
  const [tasteRating, setTasteRating] = useState(0);
  const [presentationRating, setPresentationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);

  // Delivery Review State
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState('');

  // UI State
  const [showSuccess, setShowSuccess] = useState(false);

  // AI Features State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [foodSuggestions, setFoodSuggestions] = useState<ReviewSuggestion | null>(null);
  const [deliverySuggestions, setDeliverySuggestions] = useState<ReviewSuggestion | null>(null);
  const [foodModeration, setFoodModeration] = useState<ContentModerationResult | null>(null);
  const [deliveryModeration, setDeliveryModeration] = useState<ContentModerationResult | null>(null);
  const [isCheckingContent, setIsCheckingContent] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }

    if (!orderId) {
      navigate('/customer/orders');
      return;
    }

    // Check if AI is available
    setAiEnabled(isAIAvailable());

    fetchReviewStatus();
  }, [isAuthenticated, user, orderId, navigate]);

  // Auto-generate suggestions when rating changes
  useEffect(() => {
    if (aiEnabled && foodRating > 0 && !reviewStatus?.has_food_review) {
      generateFoodSuggestions();
    }
  }, [foodRating, aiEnabled]);

  useEffect(() => {
    if (aiEnabled && deliveryRating > 0 && !reviewStatus?.has_delivery_review) {
      generateDeliverySuggestions();
    }
  }, [deliveryRating, aiEnabled]);

  const fetchReviewStatus = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const status = await getOrderReviewStatus(parseInt(orderId));
      setReviewStatus(status);

      if (!status.can_review) {
        navigate('/customer/orders');
        return;
      }

      if (status.has_food_review && status.has_delivery_review) {
        navigate('/customer/orders');
        return;
      }
    } catch (error: any) {
      console.error('Failed to fetch review status:', error);
      navigate('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  // AI Helper Functions
  const generateFoodSuggestions = async () => {
    if (!aiEnabled || foodRating === 0) return;
    try {
      const suggestions = await getReviewSuggestions(foodRating, 'food');
      setFoodSuggestions(suggestions);
      setShowFoodSuggestions(true);
    } catch (error) {
      console.error('Failed to generate food suggestions:', error);
    }
  };

  const generateDeliverySuggestions = async () => {
    if (!aiEnabled || deliveryRating === 0) return;
    try {
      const suggestions = await getReviewSuggestions(deliveryRating, 'delivery');
      setDeliverySuggestions(suggestions);
      setShowDeliverySuggestions(true);
    } catch (error) {
      console.error('Failed to generate delivery suggestions:', error);
    }
  };

  const handleGenerateTemplate = async (type: 'food' | 'delivery') => {
    const rating = type === 'food' ? foodRating : deliveryRating;
    if (!aiEnabled || rating === 0) return;

    try {
      const template = await generateReviewTemplate(rating, type);
      if (template) {
        if (type === 'food') {
          setFoodComment(template);
        } else {
          setDeliveryComment(template);
        }
      }
    } catch (error) {
      console.error('Failed to generate template:', error);
    }
  };

  const handleEnhanceReview = async (type: 'food' | 'delivery') => {
    const text = type === 'food' ? foodComment : deliveryComment;
    const rating = type === 'food' ? foodRating : deliveryRating;
    
    if (!aiEnabled || !text.trim() || rating === 0) {
      return;
    }

    try {
      setIsEnhancing(true);
      const enhanced = await enhanceReview(text, rating);
      
      if (enhanced.enhancedText && enhanced.enhancedText !== text) {
        if (type === 'food') {
          setFoodComment(enhanced.enhancedText);
        } else {
          setDeliveryComment(enhanced.enhancedText);
        }
      }
    } catch (error) {
      console.error('Failed to enhance review:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const checkContent = async (text: string, type: 'food' | 'delivery') => {
    if (!aiEnabled || !text.trim()) {
      if (type === 'food') {
        setFoodModeration(null);
      } else {
        setDeliveryModeration(null);
      }
      return true;
    }

    try {
      setIsCheckingContent(true);
      const moderation = await moderateContent(text);
      
      if (type === 'food') {
        setFoodModeration(moderation);
      } else {
        setDeliveryModeration(moderation);
      }

      return moderation.isAppropriate;
    } catch (error) {
      console.error('Content check failed:', error);
      return true; // Fail open
    } finally {
      setIsCheckingContent(false);
    }
  };

  const handleApplySuggestion = (suggestion: string, type: 'food' | 'delivery') => {
    if (type === 'food') {
      setFoodComment(suggestion);
      setShowFoodSuggestions(false);
    } else {
      setDeliveryComment(suggestion);
      setShowDeliverySuggestions(false);
    }
  };

  const handleSubmitReviews = async () => {
    if (!orderId || !reviewStatus) return;

    // Validate ratings
    if (!reviewStatus.has_food_review && foodRating === 0) {
      return;
    }

    if (!reviewStatus.has_delivery_review && reviewStatus.delivery_agent_id && deliveryRating === 0) {
      return;
    }

    // AI Content Moderation
    if (aiEnabled) {
      let contentOk = true;

      // Check food comment
      if (!reviewStatus.has_food_review && foodComment.trim()) {
        const foodOk = await checkContent(foodComment, 'food');
        if (!foodOk) {
          contentOk = false;
        }
      }

      // Check delivery comment
      if (!reviewStatus.has_delivery_review && deliveryComment.trim()) {
        const deliveryOk = await checkContent(deliveryComment, 'delivery');
        if (!deliveryOk) {
          contentOk = false;
        }
      }

      if (!contentOk) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const promises: Promise<any>[] = [];

      // Submit food review if not already reviewed
      if (!reviewStatus.has_food_review && reviewStatus.chef_id) {
        // Use filtered content if available
        const finalFoodComment = foodModeration?.filteredContent || foodComment;
        
        promises.push(
          submitFoodReview({
            order_id: parseInt(orderId),
            cook_id: reviewStatus.chef_id,
            rating: foodRating,
            comment: finalFoodComment,
            taste_rating: tasteRating || undefined,
            presentation_rating: presentationRating || undefined,
            value_rating: valueRating || undefined,
          })
        );
      }

      // Submit delivery review if not already reviewed
      if (!reviewStatus.has_delivery_review && reviewStatus.delivery_agent_id) {
        // Use filtered content if available
        const finalDeliveryComment = deliveryModeration?.filteredContent || deliveryComment;
        
        promises.push(
          submitDeliveryReview({
            order_id: parseInt(orderId),
            delivery_agent_id: reviewStatus.delivery_agent_id,
            rating: deliveryRating,
            comment: finalDeliveryComment,
          })
        );
      }

      await Promise.all(promises);

      setShowSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/customer/orders');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit reviews:', error);
    } finally{
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-screen">
            <Card className="w-full max-w-md text-center shadow-2xl border-2 border-green-200">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    <CheckCircle className="relative h-20 w-20 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Review Submitted Successfully! 🎉
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Thank you for your valuable feedback!
                </p>
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <Heart className="h-5 w-5 fill-current animate-pulse" />
                  <span className="font-medium">We appreciate your time</span>
                  <Heart className="h-5 w-5 fill-current animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/orders')}
            className="mb-4 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Rate Your Experience
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your feedback helps us improve our service
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Food/Cook Review Card */}
          {reviewStatus && !reviewStatus.has_food_review && reviewStatus.chef_id && (
            <Card className="shadow-xl border-2 border-orange-100 hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <ChefHat className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Rate the Food & Chef</CardTitle>
                    <CardDescription>
                      Chef: <span className="font-semibold">{reviewStatus.chef_name}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Overall Rating */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                  <StarRating
                    rating={foodRating}
                    onChange={setFoodRating}
                    label="Overall Rating *"
                    size="lg"
                  />
                </div>

                <Separator />

                {/* Detailed Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <StarRating
                      rating={tasteRating}
                      onChange={setTasteRating}
                      label="Taste"
                      size="md"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <StarRating
                      rating={presentationRating}
                      onChange={setPresentationRating}
                      label="Presentation"
                      size="md"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <StarRating
                      rating={valueRating}
                      onChange={setValueRating}
                      label="Value for Money"
                      size="md"
                    />
                  </div>
                </div>

                {/* Comment with AI Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Share your experience
                      {aiEnabled && <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700"><Brain className="h-3 w-3 mr-1" />AI Powered</Badge>}
                    </Label>
                    {aiEnabled && foodRating > 0 && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateTemplate('food')}
                          className="text-xs"
                        >
                          <Wand2 className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                        {foodComment.trim() && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEnhanceReview('food')}
                            disabled={isEnhancing}
                            className="text-xs"
                          >
                            {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            Enhance
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Textarea
                    placeholder="Tell us what you loved about the food, or how we can improve..."
                    value={foodComment}
                    onChange={(e) => setFoodComment(e.target.value)}
                    onBlur={() => aiEnabled && foodComment.trim() && checkContent(foodComment, 'food')}
                    rows={4}
                    className={`resize-none border-2 focus:border-orange-300 ${
                      foodModeration && !foodModeration.isAppropriate ? 'border-red-300' : ''
                    }`}
                  />

                  {/* Content Moderation Indicator */}
                  {foodModeration && foodComment.trim() && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${
                      foodModeration.isAppropriate 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                    }`}>
                      {foodModeration.isAppropriate ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-700 dark:text-green-300">
                            <p className="font-medium">Content looks good! ✓</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <p className="font-medium">Please revise your review</p>
                            {foodModeration.issues.length > 0 && (
                              <ul className="list-disc list-inside mt-1">
                                {foodModeration.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            )}
                            {foodModeration.suggestion && (
                              <p className="mt-2 italic">Suggestion: {foodModeration.suggestion}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {aiEnabled && showFoodSuggestions && foodSuggestions && foodSuggestions.suggestions.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-purple-600" />
                          <p className="font-medium text-sm text-gray-900 dark:text-white">AI Suggestions</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFoodSuggestions(false)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {foodSuggestions.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplySuggestion(suggestion, 'food')}
                            className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border border-gray-200 dark:border-gray-700 text-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Review Card */}
          {reviewStatus && !reviewStatus.has_delivery_review && reviewStatus.delivery_agent_id && (
            <Card className="shadow-xl border-2 border-blue-100 hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Rate the Delivery Service</CardTitle>
                    <CardDescription>
                      Delivery Agent:{' '}
                      <span className="font-semibold">{reviewStatus.delivery_agent_name}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Delivery Rating */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <StarRating
                    rating={deliveryRating}
                    onChange={setDeliveryRating}
                    label="Delivery Service Rating *"
                    size="lg"
                  />
                </div>

                {/* Comment with AI Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Share your delivery experience
                      {aiEnabled && <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700"><Brain className="h-3 w-3 mr-1" />AI Powered</Badge>}
                    </Label>
                    {aiEnabled && deliveryRating > 0 && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateTemplate('delivery')}
                          className="text-xs"
                        >
                          <Wand2 className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                        {deliveryComment.trim() && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEnhanceReview('delivery')}
                            disabled={isEnhancing}
                            className="text-xs"
                          >
                            {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            Enhance
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Textarea
                    placeholder="How was the delivery service? Was the agent professional and timely?..."
                    value={deliveryComment}
                    onChange={(e) => setDeliveryComment(e.target.value)}
                    onBlur={() => aiEnabled && deliveryComment.trim() && checkContent(deliveryComment, 'delivery')}
                    rows={4}
                    className={`resize-none border-2 focus:border-blue-300 ${
                      deliveryModeration && !deliveryModeration.isAppropriate ? 'border-red-300' : ''
                    }`}
                  />

                  {/* Content Moderation Indicator */}
                  {deliveryModeration && deliveryComment.trim() && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${
                      deliveryModeration.isAppropriate 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                    }`}>
                      {deliveryModeration.isAppropriate ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-700 dark:text-green-300">
                            <p className="font-medium">Content looks good! ✓</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <p className="font-medium">Please revise your review</p>
                            {deliveryModeration.issues.length > 0 && (
                              <ul className="list-disc list-inside mt-1">
                                {deliveryModeration.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            )}
                            {deliveryModeration.suggestion && (
                              <p className="mt-2 italic">Suggestion: {deliveryModeration.suggestion}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {aiEnabled && showDeliverySuggestions && deliverySuggestions && deliverySuggestions.suggestions.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-purple-600" />
                          <p className="font-medium text-sm text-gray-900 dark:text-white">AI Suggestions</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeliverySuggestions(false)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {deliverySuggestions.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplySuggestion(suggestion, 'delivery')}
                            className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border border-gray-200 dark:border-gray-700 text-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Card className="shadow-lg border-2 border-green-100">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Ready to submit your review?
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your feedback helps others make better choices
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSubmitReviews}
                  disabled={submitting}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Submit Reviews
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ThumbsUp className="h-5 w-5 text-purple-600 mt-1" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-1">Why your review matters:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Helps chefs improve their recipes and service</li>
                  <li>Assists delivery agents in providing better service</li>
                  <li>Helps other customers make informed decisions</li>
                  <li>Contributes to building a better food community</li>
                  {aiEnabled && (
                    <li className="text-purple-700 font-medium">
                      <Brain className="h-3 w-3 inline mr-1" />
                      AI-powered features ensure respectful and helpful reviews
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Info Card */}
        {aiEnabled && (
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-1" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    AI-Powered Review Assistant
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Wand2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span><strong>Auto-Generate:</strong> Create review templates based on your rating</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span><strong>Enhance:</strong> Improve grammar and clarity of your review</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span><strong>Suggestions:</strong> Get helpful ideas for what to write</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span><strong>Content Filter:</strong> Automatic checking for appropriate language</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderReview;

