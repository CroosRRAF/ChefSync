import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const GoogleRegisterButton: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Google sign up successful!' });
        // Save tokens, update context, etc.
        navigate('/');
      } else {
        toast({ variant: 'destructive', title: 'Google sign up failed', description: data.error });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Network error' });
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => toast({ variant: 'destructive', title: 'Google sign up failed' })}
    />
  );
};

export default GoogleRegisterButton;
