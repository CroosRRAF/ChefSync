import { Button } from "@/components/ui/button";
import { getRoleBasedPath, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGoogleLogin } from "@react-oauth/google";
import React from "react";
import { useNavigate } from "react-router-dom";

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  // For development, allow any client ID that looks like a Google OAuth client ID
  // In production, you should use proper validation
  return (
    clientId &&
    clientId !== "your-google-client-id" &&
    clientId !== "YOUR_NEW_GOOGLE_CLIENT_ID_HERE" &&
    clientId !==
      "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com" &&
    (clientId.includes(".apps.googleusercontent.com") || clientId.length > 20)
  );
};

interface GoogleAuthButtonProps {
  mode?: "login" | "register";
  onSuccess?: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = "register",
  onSuccess,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { oauthLogin } = useAuth();
  const isValidClientId = hasValidGoogleClientId();

  const login = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        console.log("Google OAuth tokenResponse:", tokenResponse);

        const apiUrl = "/api";
        console.log("Making request to:", `${apiUrl}/auth/google/login/`);

        // Get user info from Google using the access token
        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`);
        const userInfo = await userInfoResponse.json();
        console.log("Google user info:", userInfo);

        const res = await fetch(`${apiUrl}/auth/google/login/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ 
            access_token: tokenResponse.access_token,
            user_info: userInfo
          }),
        });

        const data = await res.json();
        console.log("Backend response:", { status: res.status, data });

        if (res.ok) {
          oauthLogin(data);

          toast({
            title: `Google ${
              mode === "login" ? "login" : "registration"
            } successful!`,
            description: `Welcome, ${data.user.name || data.user.email}!`,
          });

          onSuccess?.();

          const rolePath = getRoleBasedPath(data.user.role);
          navigate(rolePath, {
            replace: true,
            state: { from: "google_oauth" },
          });
        } else {
          const errorMessage =
            data.error || data.detail || "Authentication failed";
          const errorDetails = data.details ? ` (${data.details})` : "";

          console.error("Backend error:", data);
          toast({
            variant: "destructive",
            title: `Google ${mode} failed`,
            description: `${errorMessage}${errorDetails}`,
          });
        }
      } catch (err: any) {
        console.error("Google OAuth error:", err);
        let errorMessage = "Please check your connection and try again";

        if (err.message?.includes("fetch")) {
          errorMessage =
            "Cannot connect to server. Please ensure the backend is running.";
        }

        toast({
          variant: "destructive",
          title: "Network error",
          description: errorMessage,
        });
      }
    },
    onError: () => {
      console.error("Google OAuth failed");
      toast({
        variant: "destructive",
        title: "Google authentication failed",
        description: "Please try again or use email/password",
      });
    },
  });

  if (!isValidClientId) {
    return (
      <Button variant="outline" disabled className="w-full">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google OAuth not configured
      </Button>
    );
  }

  return (
    <div className="w-full">
      <Button onClick={() => login()} variant="outline" className="w-full h-10">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {mode === "login" ? "Continue with Google" : "Sign up with Google"}
      </Button>
    </div>
  );
};

export default GoogleAuthButton;
