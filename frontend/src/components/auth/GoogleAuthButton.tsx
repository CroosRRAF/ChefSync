import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  // Temporarily disable Google OAuth until properly configured
  return false;
  /*
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return clientId && 
         clientId !== 'your-google-client-id' && 
         clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         clientId.includes('.apps.googleusercontent.com');
  */
};

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ 
  mode = 'register',
  onSuccess 
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isValidClientId = hasValidGoogleClientId();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/auth/google/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Store tokens in localStorage
        localStorage.setItem('chefsync_token', data.access);
        localStorage.setItem('chefsync_refresh_token', data.refresh);
        
        // Update auth context with user data
        const user = {
          id: data.user.user_id,
          email: data.user.email,
          name: data.user.name,
          phone: data.user.phone_no,
          role: data.user.role,
          avatar: data.user.profile_image,
          isEmailVerified: data.user.email_verified,
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at
        };
        
        toast({ 
          title: `Google ${mode === 'login' ? 'login' : 'registration'} successful!`,
          description: `Welcome, ${data.user.name || data.user.email}!`
        });
        
        // Call onSuccess callback if provided
        onSuccess?.();
        
        // Navigate to dashboard or intended page
        navigate('/');
      } else {
        const errorMessage = data.error || data.detail || 'Authentication failed';
        toast({ 
          variant: 'destructive', 
          title: `Google ${mode} failed`, 
          description: errorMessage
        });
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      let errorMessage = 'Please check your connection and try again';
      
      if (err.message?.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }
      
      toast({ 
        variant: 'destructive', 
        title: 'Network error', 
        description: errorMessage 
      });
    }
  };

  const handleGoogleError = () => {
    console.error('Google OAuth failed');
    toast({ 
      variant: 'destructive', 
      title: 'Google authentication failed', 
      description: 'Please try again or use email/password' 
    });
  };

  if (!isValidClientId) {
    return (
      <Button variant="outline" disabled className="w-full">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google OAuth not configured
      </Button>
    );
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        theme="outline"
        size="large"
        text={mode === 'login' ? 'signin_with' : 'signup_with'}
        width="100%"
      />
    </div>
  );
};

export default GoogleAuthButton;
