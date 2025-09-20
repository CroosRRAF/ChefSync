import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, AlertCircle, Loader2, CheckCircle, ChefHat, Lock, Eye, EyeOff, ArrowRight, Utensils, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthPattern from '@/assets/auth-pattern.svg';
import logo from '@/assets/logo.svg';

// Floating food icons component for the background
const FloatingIcons = () => {
  const icons = [
    { icon: <Utensils className="w-5 h-5" />, position: 'top-10 left-1/4' },
    { icon: <ChefHat className="w-6 h-6" />, position: 'top-1/3 right-10' },
    { icon: <Heart className="w-5 h-5 text-rose-400" />, position: 'bottom-1/4 left-10' },
    { icon: <Sparkles className="w-6 h-6 text-yellow-400" />, position: 'bottom-10 right-1/4' },
  ];

  return (
    <>
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.position} text-primary/30`}
          initial={{ y: 0, opacity: 0.5 }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        >
          {item.icon}
        </motion.div>
      ))}
    </>
  );
};

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
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiUrl}/auth/${endpoint}`, {
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4 md:p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url(${AuthPattern})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }}
        />
        <FloatingIcons />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-lg overflow-hidden">
            {/* Decorative gradient header */}
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
            
            <CardHeader className="text-center pb-2 pt-8 px-8">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <img 
                  src={logo} 
                  alt="ChefSync Logo" 
                  className="w-10 h-10"
                />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {currentStep === 1 ? 'Forgot Password' : 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {currentStep === 1 
                  ? 'Enter your email to receive a reset code' 
                  : 'Enter the code sent to your email and create a new password'
                }
              </CardDescription>
            </CardHeader>

          <CardContent className="px-8 pt-4 pb-6">
            {currentStep === 1 && (
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      className={cn(
                        "pl-10 h-11 text-base transition-all duration-200",
                        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "hover:border-muted-foreground/30",
                        emailForm.formState.errors.email && "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/20"
                      )}
                      {...emailForm.register('email')}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-1 flex items-center"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {emailForm.formState.errors.email.message}
                    </motion.p>
                  )}
                </div>

                <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full h-12 text-base font-medium rounded-lg transition-all duration-200",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
                      "shadow-md hover:shadow-lg hover:shadow-primary/20",
                      "transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                    )}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send Reset Code
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-foreground/80">
                    Verification Code
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input 
                      id="otp" 
                      type="text" 
                      placeholder="Enter 6-digit code" 
                      className={cn(
                        "pl-10 h-11 text-base transition-all duration-200",
                        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "hover:border-muted-foreground/30",
                        resetForm.formState.errors.otp && "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/20"
                      )}
                      {...resetForm.register('otp')}
                    />
                  </div>
                  {resetForm.formState.errors.otp && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-1 flex items-center"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {resetForm.formState.errors.otp.message}
                    </motion.p>
                  )}
                  <div className="flex justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={handleResendOTP} 
                      disabled={otpTimer > 0 || isLoading}
                      className={cn(
                        "text-xs transition-colors",
                        otpTimer > 0 
                          ? "text-muted-foreground/70" 
                          : "text-primary hover:underline hover:text-primary/80",
                        "disabled:opacity-50"
                      )}
                    >
                      {otpTimer > 0 ? (
                        `Resend code in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`
                      ) : (
                        'Resend verification code'
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-foreground/80">
                    New Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input 
                      id="newPassword" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        "pl-10 pr-10 h-11 text-base transition-all duration-200",
                        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "hover:border-muted-foreground/30",
                        resetForm.formState.errors.newPassword && "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/20"
                      )}
                      {...resetForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-1 flex items-center"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {resetForm.formState.errors.newPassword.message}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">
                    Confirm New Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        "pl-10 pr-10 h-11 text-base transition-all duration-200",
                        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "hover:border-muted-foreground/30",
                        resetForm.formState.errors.confirmPassword && "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/20"
                      )}
                      {...resetForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-1 flex items-center"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {resetForm.formState.errors.confirmPassword.message}
                    </motion.p>
                  )}
                </div>

                <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full h-12 text-base font-medium rounded-lg transition-all duration-200",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
                      "shadow-md hover:shadow-lg hover:shadow-primary/20",
                      "transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                    )}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </motion.div>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-4 pb-8 px-8 border-t border-border/30">
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link 
                  to="/auth/login" 
                  className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                >
                  Back to login
                </Link>
              </p>
              
              <p className="mt-4 text-xs text-muted-foreground/70">
                Need help?{' '}
                <a href="#" className="hover:underline hover:text-foreground transition-colors">
                  Contact support
                </a>
              </p>
            </div>
          </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
