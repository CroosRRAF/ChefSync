import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    try {
      await authService.verifyEmail({ token: verificationToken });
      setVerificationStatus('success');
      toast({
        title: 'Email verified successfully!',
        description: 'Your account has been verified. You can now log in.',
      });
    } catch (error: any) {
      setVerificationStatus('error');
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
      setErrorMessage(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = () => {
    toast({
      title: 'Verification email resent',
      description: 'Please check your email for a new verification link.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-food">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Verifying your email...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-food">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">Email Verified!</CardTitle>
              <CardDescription className="text-green-700">
                Your account has been successfully verified.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                You can now log in to your ChefSync account and start ordering delicious food.
              </p>
            </CardContent>

            <CardFooter className="text-center">
              <Button 
                onClick={() => navigate('/auth/login')} 
                className="w-full button-gradient-primary"
              >
                Continue to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-food">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                <XCircle className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-800">Verification Failed</CardTitle>
              <CardDescription className="text-red-700">
                We couldn't verify your email address.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This could happen if:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• The verification link has expired</li>
                  <li>• The link has already been used</li>
                  <li>• The link is invalid or corrupted</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button 
                onClick={handleResendVerification} 
                variant="outline" 
                className="w-full"
              >
                Resend Verification Email
              </Button>
              <Button 
                onClick={() => navigate('/auth/login')} 
                className="w-full button-gradient-primary"
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmail;
