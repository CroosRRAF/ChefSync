import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from "@/components/layout/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";

const queryClient = new QueryClient();

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return clientId && 
         clientId !== 'your-google-client-id' && 
         clientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE' &&
         clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         clientId.includes('.apps.googleusercontent.com');
};

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const isValidClientId = hasValidGoogleClientId();

  const appContent = (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {isValidClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {appContent}
          </GoogleOAuthProvider>
        ) : (
          appContent
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
