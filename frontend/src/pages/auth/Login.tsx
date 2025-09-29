import React, { useState } from 'react';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoginCredentials } from '@/types/auth';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ChefHat, Utensils, Heart, Sparkles, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AuthPattern from '@/assets/auth-pattern.svg';
import logo from '@/assets/logo.svg';
import navbarLogo from '@/assets/images/hero/navbarlogo.png';

// Floating food icons component
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

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<{
    status: string;
    message: string;
    canLogin: boolean;
  } | null>(null);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.redirectTo || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<LoginCredentials>();

  const emailValue = watch('email');

  // Function to check approval status
  const checkApprovalStatus = async (email: string) => {
    if (!email || !email.includes('@')) return;

    setIsCheckingApproval(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/auth/check-user-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setApprovalStatus({
          status: data.approval_status || 'unknown',
          message: data.message || 'Status unknown',
          canLogin: data.can_login || false
        });
      } else {
        setApprovalStatus(null);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus(null);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Check approval status when email changes
  React.useEffect(() => {
    if (emailValue && emailValue.includes('@')) {
      const timeoutId = setTimeout(() => {
        checkApprovalStatus(emailValue);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setApprovalStatus(null);
    }
  }, [emailValue]);

  const onSubmit = async (data: LoginCredentials) => {
    // Check approval status first
    if (approvalStatus && !approvalStatus.canLogin) {
      // Store user data for approval status page
      localStorage.setItem('pending_user_data', JSON.stringify({
        email: data.email,
        approval_status: approvalStatus.status,
        message: approvalStatus.message
      }));

      navigate('/approval-status', { replace: true });
      return;
    }

    setIsLoading(true);
    try {
      await login(data);

      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });

      // Don't navigate here - let AuthContext handle role-based navigation
      // navigate(redirectTo);
    } catch (error: any) {
      // Handle specific error types
      if (error.message === 'APPROVAL_PENDING') {
        // Redirect to approval status page
        navigate('/approval-status', { replace: true });
        return;
      } else if (error.message === 'APPROVAL_REJECTED') {
        // Show rejection message
        const pendingData = localStorage.getItem('pending_user_data');
        if (pendingData) {
          const userData = JSON.parse(pendingData);
          setError('root', {
            type: 'manual',
            message: userData.message || 'Your account was not approved.'
          });

          toast({
            variant: "destructive",
            title: "Account Not Approved",
            description: userData.message || "Your account was not approved. Please contact support.",
          });
        }
      } else {
        // Handle other errors
        setError('root', {
          type: 'manual',
          message: error.message || 'Invalid email or password'
        });

        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Please check your credentials and try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Button

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
                  src={navbarLogo} 
                  alt="ChefSync" 
                  className="h-12 w-auto object-contain"
                />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Sign in to your account to continue your culinary journey
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-8 pt-4 pb-6">
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive" className="border-l-4 border-destructive/90">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="ml-2">
                      <div className="font-medium">Login Failed</div>
                      <div className="text-sm mt-1">{errors.root.message}</div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Approval Status Display */}
              {approvalStatus && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {approvalStatus.status === 'pending' && (
                    <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-600">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="ml-2 text-amber-800 dark:text-amber-200">
                        <div className="font-medium">Account Pending Approval</div>
                        <div className="text-sm mt-1">{approvalStatus.message}</div>
                        <div className="text-sm mt-2 space-y-1">
                          <p className="font-medium">You cannot login until your account is approved by an admin.</p>
                          <p>Please wait for admin approval or contact support if you have questions.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30"
                          onClick={() => {
                            localStorage.setItem('pending_user_data', JSON.stringify({
                              email: emailValue,
                              approval_status: approvalStatus.status,
                              message: approvalStatus.message
                            }));
                            navigate('/approval-status', { replace: true });
                          }}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Check Approval Status
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {approvalStatus.status === 'rejected' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription>
                        <div className="font-medium">Account Not Approved</div>
                        <div className="text-sm mt-1">{approvalStatus.message}</div>
                        <div className="text-sm mt-2">
                          <strong>Your account application was not approved.</strong>
                          <br />
                          Please contact support for more information or to reapply.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {approvalStatus.status === 'approved' && (
                    <Alert className="bg-gradient-to-r from-green-50 to-green-50 border-l-4 border-green-400 dark:from-green-900/20 dark:to-green-900/20 dark:border-green-600">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <AlertDescription className="ml-2 text-green-800 dark:text-green-200">
                        <div className="font-medium">Account Approved</div>
                        <div className="text-sm mt-1">Your account is ready to use!</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              {/* Loading indicator for approval check */}
              {isCheckingApproval && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Checking account status...</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
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
                        "pl-10 h-11 text-base transition-all duration-200 border-2 border-muted-foreground/20",
                        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "hover:border-muted-foreground/30",
                        errors.email && "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/20"
                      )}
                      {...register('email', { required: 'Email is required' })}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-1 flex items-center"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                      Password
                    </Label>
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        "pl-10 pr-10 h-11 text-base transition-all duration-200 border-2 border-muted-foreground/20",
                        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "hover:border-muted-foreground/30",
                        errors.password && "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/20"
                      )}
                      {...register('password', { required: 'Password is required' })}
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
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-1 flex items-center"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 py-1 rounded-full text-muted-foreground text-xs font-medium border border-border/30 shadow-sm">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <GoogleAuthButton mode="login" />
                </motion.div>
              </div>
            </CardContent>

            <CardFooter className="text-center pt-4">
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    to="/auth/register"
                    className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                  >
                    Create an account
                  </Link>
                </p>

                <p className="mt-4 text-xs text-muted-foreground/70">
                  By continuing, you agree to our{' '}
                  <a href="#" className="hover:underline hover:text-foreground transition-colors">Terms</a>{' '}
                  and{' '}
                  <a href="#" className="hover:underline hover:text-foreground transition-colors">Privacy Policy</a>.
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;