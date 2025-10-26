import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatSriLankanPhone, validateSriLankanPhone } from '@/utils/phoneValidation';
import { Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showValidation?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label = 'Phone Number',
  placeholder = '+94 77 123 4567 or 0771234567',
  required = false,
  className = '',
  showValidation = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // Validate phone number
  const validation = value ? validateSriLankanPhone(value) : { isValid: false, error: '' };
  const showError = touched && !isFocused && value && !validation.isValid;
  const showSuccess = touched && value && validation.isValid;

  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="phone-input" className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id="phone-input"
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={`mt-1 pr-10 ${
            showError ? 'border-red-500 focus:ring-red-500' : ''
          } ${
            showSuccess ? 'border-green-500 focus:ring-green-500' : ''
          }`}
        />
        {showValidation && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5">
            {showSuccess && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {showError && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      <div className="mt-1 min-h-[20px]">
        {showError && (
          <p className="text-xs text-red-500">
            {validation.error}
          </p>
        )}
        {showSuccess && validation.type && (
          <p className="text-xs text-green-600">
            ✓ Valid Sri Lankan {validation.type === 'mobile' ? 'mobile' : 'landline'} number
          </p>
        )}
        {!value && (
          <p className="text-xs text-gray-500">
            Mobile: 07X XXX XXXX or Landline: 0XX XXX XXXX
          </p>
        )}
      </div>
    </div>
  );
};

export default PhoneInput;

