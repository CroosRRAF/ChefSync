import React from 'react';
import { Wallet, CreditCard, Smartphone, DollarSign, CheckCircle } from 'lucide-react';

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
  customerNotes: string;
  onCustomerNotesChange: (notes: string) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  phoneNumber,
  onPhoneNumberChange,
  customerNotes,
  onCustomerNotesChange,
}) => {
  const paymentOptions = [
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      description: 'Pay with cash when your order arrives',
      icon: Wallet,
      available: true,
      recommended: true,
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      description: 'Pay using Google Pay, PhonePe, Paytm',
      icon: Smartphone,
      available: false,
      comingSoon: true,
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, Rupay',
      icon: CreditCard,
      available: false,
      comingSoon: true,
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'Paytm, PhonePe, Amazon Pay',
      icon: DollarSign,
      available: false,
      comingSoon: true,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-green-600" />
        Payment Method
      </h3>

      <div className="space-y-3">
        {paymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = paymentMethod === option.id;
          const isDisabled = !option.available;

          return (
            <button
              key={option.id}
              onClick={() => option.available && onPaymentMethodChange(option.id)}
              disabled={isDisabled}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                isSelected
                  ? 'border-green-600 bg-green-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? 'bg-green-600 text-white'
                      : isDisabled
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{option.name}</h4>
                    {option.recommended && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Recommended
                      </span>
                    )}
                    {option.comingSoon && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                )}
              </div>

              {/* Additional Info for COD */}
              {isSelected && option.id === 'cash_on_delivery' && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium mb-1">Payment Instructions:</p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li>• Please keep exact change ready</li>
                        <li>• Payment to be made to delivery partner</li>
                        <li>• Request a receipt for your records</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">
              100% Secure Transactions
            </p>
            <p className="text-xs text-blue-700">
              Your payment information is encrypted and secure. We never store your payment details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


