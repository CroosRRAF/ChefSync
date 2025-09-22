import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, User, Lock, Eye, EyeOff, ChefHat, ArrowRight, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DocumentUpload from './DocumentUpload';

// Step 1: First name and email (progressive flow)
const emailSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

// Step 2: Role selection
const roleSchema = z.object({
  role: z.enum(['customer', 'cook', 'delivery_agent'], {
    required_error: 'Please select a role',
  }),
});

// Step 3: Password only (after email verification & role, name already collected)
const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailData = z.infer<typeof emailSchema>;
type RoleData = z.infer<typeof roleSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

const SimpleRegisterForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Enhanced Step indicator component
  const StepIndicator: React.FC = () => {
    const needsDocuments = selectedRole === 'cook' || selectedRole === 'delivery_agent';
    
    // Define steps based on whether documents are needed
    const baseSteps = [
      { number: 1, title: 'Personal Info', active: currentStep === 1 && !otpSent, completed: otpVerified },
      { number: 2, title: 'Email Verification', active: currentStep === 1 && otpSent && !otpVerified, completed: otpVerified },
      { number: 3, title: 'Role Selection', active: currentStep === 2, completed: currentStep > 2 }
    ];
    
    const documentStep = needsDocuments ? 
      [{ number: 4, title: 'Documents', active: currentStep === 3, completed: currentStep > 3 }] : [];
    
    const finalStep = [
      { number: needsDocuments ? 5 : 4, title: 'Account Setup', active: currentStep === (needsDocuments ? 4 : 3), completed: false }
    ];
    
    const steps = [...baseSteps, ...documentStep, ...finalStep];

    return (
      <div className="flex items-center justify-center mb-8 px-4 overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white shadow-lg'
                    : step.active 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110' 
                      : 'bg-muted border-muted-foreground text-muted-foreground'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium transition-colors duration-300 text-center max-w-20 ${
                  step.active || step.completed ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                  step.completed ? 'bg-green-500' : step.active ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Step 1: Email form
  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2: Role form
  const roleForm = useForm<RoleData>({
    resolver: zodResolver(roleSchema),
  });

  // Step 3: Password form
  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  // OTP Timer effect
  React.useEffect(() => {
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
        // Enhanced error extraction for serializer / field errors
        let errorMessage = '';
        if (typeof result === 'object' && result) {
          // Direct keys like message / error first
            if (result.message) errorMessage = result.message;
            else if (result.error) errorMessage = result.error;
            else {
              // Accumulate field errors (Django REST serializer style)
              const collected: string[] = [];
              for (const key of Object.keys(result)) {
                const value = (result as any)[key];
                if (Array.isArray(value)) {
                  collected.push(`${key}: ${value.join(', ')}`);
                } else if (typeof value === 'string') {
                  collected.push(`${key}: ${value}`);
                }
              }
              if (collected.length) errorMessage = collected.join(' | ');
            }
        }
        if (response.status === 409 && !errorMessage) {
          errorMessage = 'Email already exists. Please use a different email address.';
        } else if (response.status === 500 && !errorMessage) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status === 400 && !errorMessage) {
          errorMessage = 'Invalid data provided';
        }
        throw new Error(errorMessage || 'An unexpected error occurred');
      }
      
      return result;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  };

  const handleEmailSubmit = async (data: EmailData) => {
    setIsLoading(true);
    try {
      // Send OTP for email verification
      const otpData = {
        email: data.email,
        name: data.firstName,
        purpose: 'registration'
      };

      await apiCall('send-otp/', otpData);
      
      setFirstName(data.firstName);
      setEmail(data.email);
      
      // Store email in localStorage for document upload
      localStorage.setItem('registration_email', data.email);
      
      setOtpSent(true);
      setOtpTimer(600); // 10 minutes
      
      toast({
        title: "Verification Code Sent!",
        description: `We've sent a 6-digit code to ${data.email}. Please check your inbox and spam folder.`,
      });
    } catch (error: any) {
      const msg = (error?.message || '').replace(/^email:\s*/i, '').trim();
      toast({
        title: "Unable to Send Code",
        description: msg || "Please check your email address and try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (otp: string) => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      const verifyData = {
        email: email,
        otp: otp,
        purpose: 'registration'
      };

      console.log('🔍 Sending OTP verification request:', verifyData);
      await apiCall('verify-otp/', verifyData);
      
      setOtpVerified(true);
      setCurrentStep(2); // Move to role selection
      
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now proceed to the next step.",
      });
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error);
      toast({
        title: "Invalid Verification Code",
        description: error.message || "The code you entered is incorrect or has expired. Please try again or request a new code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSubmit = (data: RoleData) => {
    setSelectedRole(data.role);
    // If cook or delivery agent, go to document upload step
    if (data.role === 'cook' || data.role === 'delivery_agent') {
      setCurrentStep(3); // Move to document upload step
    } else {
      setCurrentStep(3); // Move to password step for customers
    }
  };

  const handleDocumentsComplete = (documents: any[]) => {
    setUploadedDocuments(documents);
    setCurrentStep(4); // Move to password step after documents
  };

  const handleDocumentBack = () => {
    setCurrentStep(2); // Go back to role selection
  };

  const handlePasswordSubmit = async (data: PasswordData) => {
    if (!email || !selectedRole || !firstName) return;
    
    setIsLoading(true);
    try {
      const finalData = {
        name: firstName,
        email: email,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: selectedRole,
        phone_no: '',
        address: ''
      };

      console.log('Sending registration data:', finalData);
      const result = await apiCall('complete-registration/', finalData);
      console.log('Registration result:', result);
      
      // Show different messages based on role
      if (selectedRole === 'customer') {
        // Store tokens in localStorage with correct keys for AuthContext
        if (result.tokens) {
          localStorage.setItem('chefsync_token', result.tokens.access);
          localStorage.setItem('chefsync_refresh_token', result.tokens.refresh);
        }
        
        toast({
          title: "Welcome to ChefSync!",
          description: `Your account has been created successfully. Welcome aboard, ${result.user.name}!`,
        });

        // Update AuthContext with user data by calling login
        if (result.user && result.tokens) {
          await login({ 
            email: result.user.email, 
            password: data.password 
          });
        }
      } else {
        // For cooks and delivery agents, don't store tokens and show pending approval message
        // Clear any existing tokens to ensure they can't access the system
        localStorage.removeItem('chefsync_token');
        localStorage.removeItem('chefsync_refresh_token');
        
        toast({
          title: "Registration Complete!",
          description: "Your account is pending admin approval. You'll receive an email once approved.",
        });
        
        // Navigate to approval status page or show pending message
        setCurrentStep(5); // Show pending approval step
      }
      
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "We couldn't create your account. Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0 || !email) return;
    
    setIsLoading(true);
    try {
      const otpData = {
        email: email,
        name: firstName,
        purpose: 'registration'
      };

      await apiCall('send-otp/', otpData);
      
      setOtpTimer(600); // 10 minutes
      
      toast({
        title: "New Code Sent!",
        description: `A fresh verification code has been sent to ${email}. Please check your inbox.`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to Resend Code",
        description: "We couldn't send a new code. Please try again in a few moments.",
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

  // OTP Input Component - Simple Form
  const OTPInput: React.FC = () => {
    // OTP state management
    useEffect(() => {
      // OTP state is managed here
    }, [otp]);

    const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Only allow numbers and limit to 6 digits
      const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
      
      // Always set the value - prevent any clearing
      setOtp(cleanValue);
    };

    const handleSubmit = () => {
      if (otp.length === 6) {
        handleOTPSubmit(otp);
      }
    };

    return (
      <div className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <Mail className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Label htmlFor="otp" className="text-sm font-semibold text-foreground text-center block">
            Verification Code
          </Label>
          <div className="relative">
            <Input
              key="otp-input"
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={otp}
              onChange={handleOTPChange}
              className="text-center text-xl tracking-widest h-14 font-mono border-2 focus:border-primary transition-all duration-200 rounded-xl"
              autoFocus
              autoComplete="off"
              disabled={false}
              readOnly={false}
            />
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Enter the 6-digit verification code sent to your email
          </div>
        </div>

        {otpTimer > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-center text-amber-700 dark:text-amber-300">
              ⏰ Code expires in <strong>{formatTime(otpTimer)}</strong>
            </p>
          </div>
        )}

        <Button 
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Verifying...
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
          className="w-full h-12 text-base font-semibold rounded-xl border-2 hover:border-primary transition-all duration-200"
          onClick={handleResendOTP}
          disabled={otpTimer > 0 || isLoading}
        >
          {otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` : 'Resend Code'}
        </Button>
      </div>
    );
  };


  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return otpSent ? 'Verify Your Email' : 'Join ChefSync';
      case 2: return 'Choose Your Role';
      case 3: 
        if (selectedRole === 'cook' || selectedRole === 'delivery_agent') {
          return 'Upload Documents';
        }
        return 'Complete Your Profile';
      case 4: return 'Complete Your Profile';
      case 5: return 'Registration Complete';
      default: return 'Join ChefSync';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return otpSent ? 'Enter the verification code sent to your email' : 'Enter your name and email to get started';
      case 2: return 'Select your role in the ChefSync community';
      case 3: 
        if (selectedRole === 'cook' || selectedRole === 'delivery_agent') {
          return 'Upload required documents for verification';
        }
        return 'Create a secure password';
      case 4: return 'Create a secure password';
      case 5: return 'Your account is pending admin approval';
      default: return 'Create your account to start your culinary journey';
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center pb-6 pt-6">
        <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-3xl flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-5 shadow-xl ring-4 ring-primary/20">
          <ChefHat className="w-10 h-10" />
        </div>
        <CardTitle className="text-3xl font-bold text-foreground mb-1">
          {getStepTitle()}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          {getStepDescription()}
        </CardDescription>
        {/* Step Indicator */}
        <div className="mt-4">
          <StepIndicator />
        </div>
      </CardHeader>

      <CardContent>
        {currentStep === 1 && !otpSent && (
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="firstName" className="text-sm font-semibold text-foreground">
                First Name
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  className="pl-12 h-12 text-base border-2 focus:border-primary transition-all duration-200 rounded-xl"
                  {...emailForm.register('firstName')}
                />
              </div>
              {emailForm.formState.errors.firstName && (
                <p className="text-sm text-destructive font-medium">{emailForm.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-12 h-12 text-base border-2 focus:border-primary transition-all duration-200 rounded-xl"
                  {...emailForm.register('email')}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive font-medium">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        )}

        {currentStep === 1 && otpSent && (
          <OTPInput />
        )}

        {currentStep === 2 && (
          <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Select Your Role
              </Label>
              <Select onValueChange={(value) => roleForm.setValue('role', value as 'customer' | 'cook' | 'delivery_agent')}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🍽️</span>
                      <div>
                        <div className="font-medium">Customer</div>
                        <div className="text-xs text-muted-foreground">Order delicious food</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="cook">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">👨‍🍳</span>
                      <div>
                        <div className="font-medium">Cook</div>
                        <div className="text-xs text-muted-foreground">Prepare and sell food</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery_agent">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🚴‍♂️</span>
                      <div>
                        <div className="font-medium">Delivery Agent</div>
                        <div className="text-xs text-muted-foreground">Deliver orders</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {roleForm.formState.errors.role && (
                <p className="text-sm text-destructive">{roleForm.formState.errors.role.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-10"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {currentStep === 3 && (selectedRole === 'cook' || selectedRole === 'delivery_agent') && (
          <DocumentUpload
            role={selectedRole as 'cook' | 'delivery_agent'}
            onDocumentsComplete={handleDocumentsComplete}
            onBack={handleDocumentBack}
          />
        )}

        {currentStep === 5 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                Registration Complete!
              </h3>
              <p className="text-muted-foreground text-lg">
                Thank you for registering as a <span className="font-semibold text-primary capitalize">{selectedRole}</span>
              </p>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Your account is pending admin approval.</strong><br />
                We're reviewing your application and documents. You'll receive an email notification once your account is approved.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>What happens next?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <p className="font-medium">Review</p>
                  <p className="text-xs">Admin reviews your documents</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                  </div>
                  <p className="font-medium">Approval</p>
                  <p className="text-xs">Account gets approved</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
                  </div>
                  <p className="font-medium">Email</p>
                  <p className="text-xs">You receive notification</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth/login')}
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}

        {((currentStep === 3 && selectedRole === 'customer') || currentStep === 4) && (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
            {/* Password */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="pl-12 pr-12 h-12 text-base border-2 focus:border-primary transition-all duration-200 rounded-xl"
                  {...passwordForm.register('password')}
                />
                <Button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-destructive font-medium">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="pl-12 pr-12 h-12 text-base border-2 focus:border-primary transition-all duration-200 rounded-xl"
                  {...passwordForm.register('confirmPassword')}
                />
                <Button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive font-medium">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleRegisterForm;
