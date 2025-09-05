import React from 'react';
import { Link } from 'react-router-dom';
import SimpleRegisterForm from '@/components/auth/SimpleRegisterForm';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Main Registration Form */}
        <SimpleRegisterForm />

        {/* Alternative Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <div className="mt-4">
            <GoogleAuthButton mode="register" />
          </div>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                to="/auth/login" 
                className="font-medium text-primary hover:text-primary/80 transition-colors"
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
