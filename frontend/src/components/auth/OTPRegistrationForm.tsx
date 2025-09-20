import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Step 1: Role and Name Selection
const step1Schema = z.object({
  role: z.enum(['customer', 'cook', 'delivery_agent'], {
    required_error: 'Please select a role',
  }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Step 2: Email and OTP Verification
const step2Schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

// Step 3: Password Creation
const step3Schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone_no: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type OTPData = z.infer<typeof otpSchema>;
type Step3Data = z.infer<typeof step3Schema>;

interface RegistrationData extends Step1Data, Step2Data, Step3Data {}

const OTPRegistrationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  // Step 2 form  
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  // OTP form
  const otpForm = useForm<OTPData>({
    resolver: zodResolver(otpSchema),
  });

  // Step 3 form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'An error occurred');
    }
    
    return result;
  };

  const handleStep1Submit = (data: Step1Data) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Submit = async (data: Step2Data) => {
    setIsLoading(true);
    try {
      const requestData = {
        email: data.email,
        name: registrationData.name,
        purpose: 'registration'
      };

      await apiCall('send-otp/', requestData);
      
      setRegistrationData(prev => ({ ...prev, ...data }));
      setOtpSent(true);
      setOtpTimer(600); // 10 minutes
      
      toast({
        title: "OTP Sent!",
        description: `Verification code sent to ${data.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (data: OTPData) => {
    setIsLoading(true);
    try {
      const requestData = {
        email: registrationData.email!,
        otp: data.otp,
        purpose: 'registration'
      };

      await apiCall('verify-otp/', requestData);
      
      // Store email in localStorage for document upload
      localStorage.setItem('registration_email', registrationData.email!);
      
      setOtpVerified(true);
      setCurrentStep(3);
      
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified",
      });
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: error.message,
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
      const requestData = {
        email: registrationData.email!,
        name: registrationData.name,
        purpose: 'registration'
      };

      await apiCall('send-otp/', requestData);
      
      setOtpTimer(600); // 10 minutes
      
      toast({
        title: "OTP Resent!",
        description: `New verification code sent to ${registrationData.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (data: Step3Data) => {
    setIsLoading(true);
    try {
      const finalData = {
        ...registrationData,
        ...data,
      };

      const result = await apiCall('complete-registration/', finalData);
      
      // Store tokens in localStorage
      if (result.tokens) {
        localStorage.setItem('access_token', result.tokens.access);
        localStorage.setItem('refresh_token', result.tokens.refresh);
      }
      
      toast({
        title: "Registration Successful!",
        description: `Welcome to ChefSync, ${result.user.name}!`,
      });

      // Redirect based on role
      const roleRoutes = {
        customer: '/customer/dashboard',
        cook: '/cook/dashboard', 
        delivery_agent: '/delivery/dashboard'
      };
      
      navigate(roleRoutes[registrationData.role as keyof typeof roleRoutes] || '/dashboard');
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
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

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      customer: 'Customer',
      cook: 'Cook',
      delivery_agent: 'Delivery Agent'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-8">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Join ChefSync
        </CardTitle>
        <CardDescription className="text-gray-600">
          Step 1 of 3: Choose your role and enter your name
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="role" className="text-base font-medium text-gray-700">
              Select Your Role
            </Label>
            <Select 
              onValueChange={(value) => step1Form.setValue('role', value as 'customer' | 'cook' | 'delivery_agent')}
            >
              <SelectTrigger className="h-12 text-left">
                <SelectValue placeholder="Choose your role in ChefSync" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer" className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🍽️</span>
                    <div className="text-left">
                      <div className="font-medium">Customer</div>
                      <div className="text-sm text-gray-500">Order delicious food from local cooks</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="cook" className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👨‍🍳</span>
                    <div className="text-left">
                      <div className="font-medium">Cook</div>
                      <div className="text-sm text-gray-500">Prepare and sell your culinary creations</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="delivery_agent" className="p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚴‍♂️</span>
                    <div className="text-left">
                      <div className="font-medium">Delivery Agent</div>
                      <div className="text-sm text-gray-500">Deliver orders and earn money</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {step1Form.formState.errors.role && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {step1Form.formState.errors.role.message}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="name" className="text-base font-medium text-gray-700">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="name"
                placeholder="Enter your full name"
                className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...step1Form.register('name')}
              />
            </div>
            {step1Form.formState.errors.name && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {step1Form.formState.errors.name.message}
                </p>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Continue →
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-8">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Email Verification
        </CardTitle>
        <CardDescription className="text-gray-600">
          Step 2 of 3: {otpSent ? 'Enter the verification code' : 'Enter your email address'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!otpSent ? (
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...step2Form.register('email')}
                />
              </div>
              {step2Form.formState.errors.email && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-2">⚠️</span>
                    {step2Form.formState.errors.email.message}
                  </p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending verification code...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleOTPSubmit)} className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                We've sent a 6-digit verification code to <strong>{registrationData.email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label htmlFor="otp" className="text-base font-medium text-gray-700">
                Verification Code
              </Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-2xl tracking-widest h-16 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
                {...otpForm.register('otp')}
                onChange={(e) => {
                  // Auto-format: only allow numbers
                  const value = e.target.value.replace(/\D/g, '');
                  e.target.value = value;
                  otpForm.setValue('otp', value);
                }}
              />
              {otpForm.formState.errors.otp && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-2">⚠️</span>
                    {otpForm.formState.errors.otp.message}
                  </p>
                </div>
              )}
            </div>

            {otpTimer > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-center text-amber-700">
                  ⏰ Code expires in <strong>{formatTime(otpTimer)}</strong>
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying code...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Verify Code
                </>
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
              onClick={handleResendOTP}
              disabled={otpTimer > 0 || isLoading}
            >
              {otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` : 'Resend Code'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-8">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Complete Registration
        </CardTitle>
        <CardDescription className="text-gray-600">
          Step 3 of 3: Create your password and complete your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center space-x-2 text-green-700 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Email verified successfully!</span>
          </div>
          <p className="text-sm text-green-600">
            <span className="font-medium">{registrationData.name}</span> • {getRoleDisplayName(registrationData.role!)} • {registrationData.email}
          </p>
        </div>

        <form onSubmit={step3Form.handleSubmit(handleFinalSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="password" className="text-base font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...step3Form.register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {step3Form.formState.errors.password && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {step3Form.formState.errors.password.message}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirmPassword" className="text-base font-medium text-gray-700">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...step3Form.register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {step3Form.formState.errors.confirmPassword && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {step3Form.formState.errors.confirmPassword.message}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <Label htmlFor="phone_no" className="text-base font-medium text-gray-700">
                Phone Number <span className="text-gray-400 text-sm">(Optional)</span>
              </Label>
              <Input
                id="phone_no"
                type="tel"
                placeholder="Enter your phone number"
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...step3Form.register('phone_no')}
              />
              {step3Form.formState.errors.phone_no && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-2">⚠️</span>
                    {step3Form.formState.errors.phone_no.message}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="address" className="text-base font-medium text-gray-700">
                Address <span className="text-gray-400 text-sm">(Optional)</span>
              </Label>
              <Input
                id="address"
                placeholder="Enter your address"
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...step3Form.register('address')}
              />
              {step3Form.formState.errors.address && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-2">⚠️</span>
                    {step3Form.formState.errors.address.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating your account...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Registration
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step < currentStep
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110'
                      : step === currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-110 ring-4 ring-blue-200'
                      : 'bg-white text-gray-400 border-2 border-gray-300'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-2 mx-2 rounded-full transition-all duration-500 ${
                      step < currentStep ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Step titles */}
          <div className="flex justify-between mt-4 px-4">
            <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              Role & Name
            </span>
            <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              Email Verify
            </span>
            <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              Password
            </span>
          </div>
        </div>

        {/* Current step content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-2xl blur-xl"></div>
          <div className="relative">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
        </div>

        {/* Back button for step 2 and 3 */}
        {currentStep > 1 && !otpSent && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to previous step
            </Button>
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@chefsync.com" className="text-blue-600 hover:underline">
              support@chefsync.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPRegistrationForm;
