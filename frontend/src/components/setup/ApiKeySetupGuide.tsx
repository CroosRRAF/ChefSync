/**
 * API Key Setup Guide Component
 * Beautiful, user-friendly guide for setting up Google API keys
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  MapPin,
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getApiKeyStatus, getSetupInstructions, apiKeys } from '@/config/apiKeys';
import { toast } from 'sonner';

export const ApiKeySetupGuide: React.FC = () => {
  const [status, setStatus] = useState(getApiKeyStatus());
  const [instructions, setInstructions] = useState(getSetupInstructions());
  const [expandedSection, setExpandedSection] = useState<'maps' | 'ai' | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    setStatus(getApiKeyStatus());
    setInstructions(getSetupInstructions());
  };

  const handleRefresh = () => {
    apiKeys.refresh();
    checkStatus();
    toast.success('Configuration refreshed!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (status.allValid) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-900 dark:text-green-100">All APIs Configured</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription className="text-green-700 dark:text-green-300">
            Your application is properly configured with all required API keys.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">API Configuration Required</CardTitle>
                <CardDescription>
                  Set up your Google API keys to enable all features
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Status Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Google Maps Status */}
        <Card className={status.googleMapsValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <CardTitle className="text-lg">Google Maps API</CardTitle>
              </div>
              {status.googleMapsValid ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Missing
                </Badge>
              )}
            </div>
            <CardDescription>
              {status.googleMapsValid 
                ? 'Maps, location picker, and geocoding are active'
                : 'Required for location features'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Google AI Status */}
        <Card className={status.googleAIValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <CardTitle className="text-lg">Google AI API</CardTitle>
              </div>
              {status.googleAIValid ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Optional
                </Badge>
              )}
            </div>
            <CardDescription>
              {status.googleAIValid 
                ? 'AI chat and food information features are active'
                : 'Optional - App will use fallback responses'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Setup Instructions */}
      {!status.googleMapsValid && instructions.googleMaps && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'maps' ? null : 'maps')}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                <CardTitle>Google Maps API Setup Guide</CardTitle>
              </div>
              {expandedSection === 'maps' ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 'maps' && (
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Google Maps requires billing to be enabled. You won't be charged for typical usage under the free tier.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Step-by-Step Instructions:</h4>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Go to Google Cloud Console</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Navigate to the Google Cloud Platform to manage your APIs
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open Console
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Create or Select a Project</h5>
                      <p className="text-sm text-muted-foreground">
                        Create a new project or select an existing one from the dropdown at the top
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Enable Billing</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Go to Billing and link a payment method (required but won't be charged under free tier)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Enable Billing
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Enable Required APIs</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Enable these APIs from the API Library:
                      </p>
                      <ul className="text-sm space-y-1 mb-2 list-disc list-inside text-muted-foreground">
                        <li>Maps JavaScript API</li>
                        <li>Places API</li>
                        <li>Geocoding API</li>
                        <li>Distance Matrix API</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/apis/library', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        API Library
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Create API Key</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Go to Credentials → Create Credentials → API Key
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Credentials Page
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">6</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Add to Environment File</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Copy your API key and add it to your <code className="bg-muted px-1 rounded">.env</code> file:
                      </p>
                      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                        <span>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard('VITE_GOOGLE_MAPS_API_KEY=')}
                          className="text-white hover:text-green-300"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">7</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Restart Development Server</h5>
                      <p className="text-sm text-muted-foreground">
                        Stop your dev server (Ctrl+C) and restart it to load the new environment variables
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {!status.googleAIValid && instructions.googleAI && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'ai' ? null : 'ai')}
            >
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                <CardTitle>Google AI (Gemini) API Setup Guide</CardTitle>
                <Badge variant="secondary">Optional</Badge>
              </div>
              {expandedSection === 'ai' ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 'ai' && (
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Bot className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Note:</strong> This is optional. The app will work with smart fallback responses if AI is not configured.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Step-by-Step Instructions:</h4>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Visit Google AI Studio</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Go to Google AI Studio to get your Gemini API key
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open AI Studio
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Create API Key</h5>
                      <p className="text-sm text-muted-foreground">
                        Click "Create API Key" and select or create a Google Cloud project
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Add to Environment File</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Copy your API key and add it to your <code className="bg-muted px-1 rounded">.env</code> file:
                      </p>
                      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                        <span>VITE_GOOGLE_AI_API_KEY=your_api_key_here</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard('VITE_GOOGLE_AI_API_KEY=')}
                          className="text-white hover:text-green-300"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">Restart Development Server</h5>
                      <p className="text-sm text-muted-foreground">
                        Restart your development server to apply changes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Check out these resources for more information
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            onClick={() => window.open('https://developers.google.com/maps/documentation', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Maps Documentation
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('https://ai.google.dev/docs', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            AI Documentation
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Cloud Console
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeySetupGuide;

