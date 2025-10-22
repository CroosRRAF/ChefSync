import React from 'react';
import { Store, MapPin, Phone, Clock } from 'lucide-react';

interface PickupDetailsProps {
  chefName: string;
  chefAddress: string;
}

export const PickupDetails: React.FC<PickupDetailsProps> = ({
  chefName,
  chefAddress,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Store className="w-6 h-6 text-green-600" />
        Pickup Location
      </h3>

      {/* Kitchen Info Card */}
      <div className="border-2 border-green-600 rounded-lg p-6 bg-green-50">
        <div className="flex items-start gap-4">
          {/* Kitchen Image Placeholder */}
          <div className="w-20 h-20 bg-green-200 rounded-lg flex items-center justify-center">
            <Store className="w-10 h-10 text-green-700" />
          </div>

          {/* Kitchen Details */}
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{chefName}'s Kitchen</h4>
            
            {/* Location */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900 font-medium">Kitchen Address</p>
                <p className="text-sm text-gray-600">
                  Available after order confirmation
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-900 font-medium">Contact</p>
                <p className="text-sm text-gray-600">
                  Available after order confirmation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Pickup Instructions
          </h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Please arrive within 10 minutes of the ready time</li>
            <li>• Show your order confirmation to the cook</li>
            <li>• Ensure to bring your own bag or container if needed</li>
            <li>• Follow COVID-19 safety protocols</li>
          </ul>
        </div>
      </div>

      {/* Benefits of Pickup */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-900">No Delivery Fee</p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs font-medium text-gray-900">Faster Service</p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-900">Fresh & Hot</p>
        </div>
      </div>
    </div>
  );
};


