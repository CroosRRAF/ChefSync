/**
 * API Configuration Banner
 * Shows a warning banner when API keys are not properly configured
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, Settings } from 'lucide-react';
import { getApiKeyStatus } from '@/config/apiKeys';

export const ApiConfigBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = sessionStorage.getItem('api-config-banner-dismissed') === 'true';
    setDismissed(isDismissed);

    // Check API configuration
    const status = getApiKeyStatus();
    if (!status.allRequired && !isDismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('api-config-banner-dismissed', 'true');
  };

  const handleSetup = () => {
    navigate('/setup');
  };

  if (!show || dismissed) {
    return null;
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 mb-4 relative">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <strong className="font-semibold">API Configuration Required:</strong> Some features require API keys to be configured.
            <span className="block mt-1 text-sm">
              Set up your Google Maps and AI API keys to enable all features.
            </span>
          </AlertDescription>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleSetup}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Settings className="h-3 w-3 mr-2" />
              Configure Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};

export default ApiConfigBanner;

