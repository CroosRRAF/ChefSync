import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';
import { Mail, AlertCircle, Loader2, CheckCircle, ChefHat } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset({ email: values.email });
      setSubmittedEmail(values.email);
      setIsSuccess(true);
      toast({
        title: 'Password reset email sent',
        description: `We have sent a password reset link to ${values.email}.`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Request failed';
      setError('root', { type: 'manual', message: errorMessage });
      toast({ 
        variant: 'destructive', 
        title: 'Request failed', 
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
              <CardDescription className="text-muted-foreground">
                We've sent a password reset link to <strong>{submittedEmail}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to reset your password. The link will expire in 24 hours.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> If you don't see the email, check your spam folder.
                </p>
              </div>
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg">
              <ChefHat className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-muted-foreground">Enter your email to receive a password reset link.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11" {...register('email')} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
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
