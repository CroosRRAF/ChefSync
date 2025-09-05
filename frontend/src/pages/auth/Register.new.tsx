import React from 'react';
import { Link } from 'react-router-dom';
import OTPRegistrationForm from '@/components/auth/OTPRegistrationForm';
import ConnectionStatus from '@/components/common/ConnectionStatus';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Connection Status */}
        <div className="mb-6">
          <ConnectionStatus />
        </div>

        {/* Main Registration Form */}
        <OTPRegistrationForm />

        {/* Alternative Options */}
        <div className="max-w-md mx-auto mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <div className="mt-6">
            <GoogleAuthButton mode="register" />
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/auth/login" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
