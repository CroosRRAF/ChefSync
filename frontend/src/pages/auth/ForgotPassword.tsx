import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, AlertCircle, Loader2, CheckCircle, ChefHat, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

// Step 1: Email form
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Step 2: OTP + Password form
const resetSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

const ForgotPassword: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: OTP + Password
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Email form
  const emailForm = useForm<EmailFormValues>({ 
    resolver: zodResolver(emailSchema) 
  });

  // Reset form (OTP + Password)
  const resetForm = useForm<ResetFormValues>({ 
    resolver: zodResolver(resetSchema) 
  });

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const apiCall = async (endpoint: string, data: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Request failed');
      }
      
      return result;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  };

  const handleEmailSubmit = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      await apiCall('password/reset/request/', { email: data.email });
      
      setEmail(data.email);
      setCurrentStep(2);
      setOtpTimer(600); // 10 minutes
      
      toast({
        title: "Reset Code Sent!",
        description: `We've sent a 6-digit reset code to ${data.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to Send Reset Code",
        description: error.message || "Please check your email address and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);
    try {
      await apiCall('password/reset/confirm/', {
        email: email,
        otp: data.otp,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword
      });
      
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      
      // Redirect to login after success
      navigate('/auth/login');
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    try {
      await apiCall('password/reset/request/', { email: email });
      
      setOtpTimer(600); // 10 minutes
      
      toast({
        title: "New Reset Code Sent!",
        description: `A fresh reset code has been sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to Resend Code",
        description: error.message || "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg">
              <ChefHat className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {currentStep === 1 ? 'Forgot Password' : 'Reset Your Password'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {currentStep === 1 
                ? 'Enter your email to receive a reset code' 
                : 'Enter the code and your new password'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentStep === 1 && (
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="pl-10 h-11" 
                      {...emailForm.register('email')} 
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending reset code...
                    </>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert className="border-primary/20 bg-primary/5">
                  <Mail className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    We've sent a reset code to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>

                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
                  {/* OTP Input */}
                  <div className="space-y-2">
                    <Label htmlFor="otp">Reset Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-xl tracking-widest h-12 font-mono"
                      {...resetForm.register('otp')}
                    />
                    {resetForm.formState.errors.otp && (
                      <p className="text-sm text-destructive">{resetForm.formState.errors.otp.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        className="pl-10 pr-10 h-11"
                        {...resetForm.register('newPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {resetForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10 h-11"
                        {...resetForm.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {otpTimer > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-center text-amber-700 dark:text-amber-300">
                        ⏰ Code expires in <strong>{formatTime(otpTimer)}</strong>
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11"
                    onClick={handleResendOTP}
                    disabled={otpTimer > 0 || isLoading}
                  >
                    {otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` : 'Resend Code'}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground w-full">
              Remembered your password?{' '}
              <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Back to Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
