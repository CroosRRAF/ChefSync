import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getRoleBasedPath } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  // Check if client ID is properly configured
  return clientId && 
         clientId.trim() !== '' &&
         clientId !== 'your-google-client-id' && 
         clientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE' &&
         clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         clientId.includes('.apps.googleusercontent.com');
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
  const { oauthLogin } = useAuth();
  const isValidClientId = hasValidGoogleClientId();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Add debug logging
      console.log('Google OAuth credentialResponse:', credentialResponse);
      
      if (!credentialResponse?.credential) {
        throw new Error('No credential received from Google');
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      console.log('Making request to:', `${apiUrl}/auth/google/login/`);
      
      const res = await fetch(`${apiUrl}/auth/google/login/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Include credentials for CORS
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      
      const data = await res.json();
      console.log('Backend response:', { status: res.status, data });
      
      if (res.ok) {
        // Set auth context state via oauthLogin helper
        oauthLogin(data);

        toast({ 
          title: `Google ${mode === 'login' ? 'login' : 'registration'} successful!`,
          description: `Welcome, ${data.user.name || data.user.email}!`
        });
        
        // Call onSuccess callback if provided
        onSuccess?.();
        
        // Role-based redirect
        const rolePath = getRoleBasedPath(data.user.role);
        navigate(rolePath, { replace: true, state: { from: 'google_oauth' } });
      } else {
        // Better error handling for backend errors
        const errorMessage = data.error || data.detail || 'Authentication failed';
        const errorDetails = data.details ? ` (${data.details})` : '';
        
        console.error('Backend error:', data);
        toast({ 
          variant: 'destructive', 
          title: `Google ${mode} failed`, 
          description: `${errorMessage}${errorDetails}`
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
        width="300"
        // Avoid passing width="100%" which causes GSI width invalid warnings; let it fill container.
      />
    </div>
  );
};

export default GoogleAuthButton;
