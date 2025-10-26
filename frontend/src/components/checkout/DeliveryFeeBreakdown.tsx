import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Clock,
  CloudRain,
  MapPin,
  Info,
  TrendingUp,
  Navigation
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DeliveryFeeBreakdownProps {
  breakdown: {
    total_fee: number;
    currency: string;
    breakdown: {
      distance_fee: number;
      time_surcharge: number;
      weather_surcharge: number;
    };
    factors: {
      distance_km: number;
      order_type: string;
      is_night_delivery: boolean;
      is_rainy: boolean;
      delivery_time?: string;
    };
    weather_details?: {
      is_rainy: boolean;
      checked_locations: Array<{
        location: string;
        lat: number;
        lng: number;
        condition: string;
        is_rainy: boolean;
      }>;
      message: string;
    };
    route_info?: {
      distance_km: number;
      method: string;
      success: boolean;
    };
  };
}

export const DeliveryFeeBreakdown: React.FC<DeliveryFeeBreakdownProps> = ({ breakdown }) => {
  const { breakdown: fees, factors, currency, route_info, weather_details } = breakdown;
  
  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5" />
          Delivery Fee Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Fee Breakdown */}
        <div className="space-y-3">
          {/* Distance Fee */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Base Delivery Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Distance: {factors.distance_km.toFixed(2)} km</p>
                    <p className="text-xs text-muted-foreground">
                      {factors.order_type === 'bulk' 
                        ? 'Bulk Order: First 5km = 250 LKR, then 15 LKR/km'
                        : 'Regular Order: First 5km = 50 LKR, then 15 LKR/km'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-medium">{formatCurrency(fees.distance_fee)}</span>
          </div>

          {/* Time Surcharge */}
          {fees.time_surcharge > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Night Delivery Surcharge</span>
                <Badge variant="secondary" className="text-xs">
                  +10%
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Night hours: 6:00 PM - 5:00 AM</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium text-amber-600">
                +{formatCurrency(fees.time_surcharge)}
              </span>
            </div>
          )}

          {/* Weather Surcharge */}
          {fees.weather_surcharge > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Rainy Weather Surcharge</span>
                <Badge variant="secondary" className="text-xs">
                  +10%
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Rain detected along delivery route</p>
                      {weather_details && weather_details.checked_locations && (
                        <div className="mt-2 text-xs space-y-1">
                          {weather_details.checked_locations.map((loc, idx) => (
                            <p key={idx} className={loc.is_rainy ? 'text-blue-400' : ''}>
                              {loc.location}: {loc.condition}
                            </p>
                          ))}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium text-blue-600">
                +{formatCurrency(fees.weather_surcharge)}
              </span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total Delivery Fee</span>
            <span className="text-primary">{formatCurrency(breakdown.total_fee)}</span>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Distance:</span>
            <span className="font-medium">{factors.distance_km.toFixed(2)} km</span>
            {route_info && (
              <Badge variant="outline" className="text-xs ml-auto">
                {route_info.method === 'google_maps_api' ? 'Real-time route' : 'Direct distance'}
              </Badge>
            )}
          </div>

          {factors.is_night_delivery && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600 font-medium">Night Delivery (6PM-5AM)</span>
            </div>
          )}

          {factors.is_rainy && (
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 font-medium">Rainy Conditions Detected</span>
            </div>
          )}

          {factors.order_type === 'bulk' && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-purple-600 font-medium">Bulk Order Pricing</span>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
          <div className="flex gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Dynamic Pricing</p>
              <p>
                Delivery fees are calculated based on distance, time of day, and weather conditions
                to ensure fair pricing and adequate delivery partner compensation.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryFeeBreakdown;

