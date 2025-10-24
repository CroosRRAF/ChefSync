/**
 * Setup Page - Guide users through API configuration
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiKeySetupGuide } from '@/components/setup/ApiKeySetupGuide';
import { checkEnvironment, EnvStatus } from '@/utils/envVerification';
import { 
  CheckCircle2, 
  Settings, 
  ArrowLeft,
  Home,
  RefreshCw
} from 'lucide-react';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [envStatus, setEnvStatus] = useState<EnvStatus>(checkEnvironment());

  useEffect(() => {
    // Check environment on mount
    setEnvStatus(checkEnvironment());
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  ChefSync Setup
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure your application
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={handleGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Go to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to ChefSync! 👋</CardTitle>
              <CardDescription className="text-base">
                Before you can use all features, we need to configure a few things.
                This guide will help you set up your Google API keys for maps and AI features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <div className="text-3xl">🗺️</div>
                  <div>
                    <h3 className="font-semibold mb-1">Google Maps</h3>
                    <p className="text-sm text-muted-foreground">
                      Location picker, address autocomplete, and delivery tracking
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <div className="text-3xl">🤖</div>
                  <div>
                    <h3 className="font-semibold mb-1">Google AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Intelligent chat assistance and food information
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                  <div className="text-3xl">⚡</div>
                  <div>
                    <h3 className="font-semibold mb-1">Quick Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Follow the simple steps below to get started in minutes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Status Summary */}
          <Card className={envStatus.overall ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-orange-200 bg-orange-50 dark:bg-orange-950'}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {envStatus.overall ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
                )}
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {envStatus.overall ? 'Configuration Complete!' : 'Configuration Needed'}
                  </CardTitle>
                  <CardDescription>
                    {envStatus.overall 
                      ? 'All required APIs are configured. You can start using the app!'
                      : `${envStatus.errors.length} required configuration(s) missing`
                    }
                  </CardDescription>
                </div>
                {envStatus.overall && (
                  <Badge variant="default" className="bg-green-600 text-white px-4 py-2">
                    Ready
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* API Setup Guide */}
          <ApiKeySetupGuide />

          {/* Next Steps */}
          {envStatus.overall && (
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  You're All Set! 🎉
                </CardTitle>
                <CardDescription>
                  Your ChefSync application is fully configured and ready to use.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">What's Next?</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Browse menus and discover local chefs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Set up your delivery addresses with Google Maps
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Use AI chat for help and food information
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Place orders and track deliveries in real-time
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={handleGoHome}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  size="lg"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Start Using ChefSync
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                If you encounter any issues during setup, here are some resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className="text-2xl">📚</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Check the project README and setup guides in the repository
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                    View Docs
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className="text-2xl">💬</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Contact us if you need assistance with configuration
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/contact')}>
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;

