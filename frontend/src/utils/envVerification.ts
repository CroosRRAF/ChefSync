/**
 * Environment Variables Verification Utility
 * Checks and validates all required environment variables
 */

export interface EnvCheckResult {
  variable: string;
  required: boolean;
  present: boolean;
  valid: boolean;
  message?: string;
  value?: string; // Masked value for display
}

export interface EnvStatus {
  allRequired: boolean;
  allOptional: boolean;
  overall: boolean;
  checks: EnvCheckResult[];
  errors: string[];
  warnings: string[];
}

/**
 * Mask API key for display (show first and last 4 characters)
 */
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '***';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * Check if a value looks like a placeholder
 */
function isPlaceholder(value: string): boolean {
  const placeholders = [
    'your_api_key_here',
    'your_google_maps_api_key_here',
    'your_google_ai_api_key_here',
    'replace_with_actual_key',
  ];
  return placeholders.some(placeholder => value.toLowerCase().includes(placeholder));
}

/**
 * Verify Google Maps API Key
 */
function verifyGoogleMapsKey(): EnvCheckResult {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!key) {
    return {
      variable: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
      present: false,
      valid: false,
      message: 'Missing - Required for location features',
    };
  }

  if (isPlaceholder(key)) {
    return {
      variable: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
      present: true,
      valid: false,
      message: 'Placeholder value detected - Please replace with actual API key',
      value: maskApiKey(key),
    };
  }

  if (key.length < 20) {
    return {
      variable: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
      present: true,
      valid: false,
      message: 'Invalid format - API key too short',
      value: maskApiKey(key),
    };
  }

  return {
    variable: 'VITE_GOOGLE_MAPS_API_KEY',
    required: true,
    present: true,
    valid: true,
    message: 'Configured and valid',
    value: maskApiKey(key),
  };
}

/**
 * Verify Google AI API Key
 */
function verifyGoogleAIKey(): EnvCheckResult {
  const key = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  
  if (!key) {
    return {
      variable: 'VITE_GOOGLE_AI_API_KEY',
      required: false,
      present: false,
      valid: false,
      message: 'Optional - AI features will use fallback responses',
    };
  }

  if (isPlaceholder(key)) {
    return {
      variable: 'VITE_GOOGLE_AI_API_KEY',
      required: false,
      present: true,
      valid: false,
      message: 'Placeholder value - Replace for AI features',
      value: maskApiKey(key),
    };
  }

  if (key.length < 20) {
    return {
      variable: 'VITE_GOOGLE_AI_API_KEY',
      required: false,
      present: true,
      valid: false,
      message: 'Invalid format - API key too short',
      value: maskApiKey(key),
    };
  }

  return {
    variable: 'VITE_GOOGLE_AI_API_KEY',
    required: false,
    present: true,
    valid: true,
    message: 'Configured and valid',
    value: maskApiKey(key),
  };
}

/**
 * Verify Backend API URL
 */
function verifyBackendUrl(): EnvCheckResult {
  const url = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  
  return {
    variable: 'VITE_API_BASE_URL',
    required: false,
    present: !!import.meta.env.VITE_API_BASE_URL,
    valid: true,
    message: `Using: ${url}`,
    value: url,
  };
}

/**
 * Run full environment check
 */
export function checkEnvironment(): EnvStatus {
  const checks: EnvCheckResult[] = [
    verifyGoogleMapsKey(),
    verifyGoogleAIKey(),
    verifyBackendUrl(),
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  checks.forEach(check => {
    if (check.required && !check.valid) {
      errors.push(`${check.variable}: ${check.message}`);
    } else if (!check.required && check.present && !check.valid) {
      warnings.push(`${check.variable}: ${check.message}`);
    }
  });

  const requiredChecks = checks.filter(c => c.required);
  const optionalChecks = checks.filter(c => !c.required);

  return {
    allRequired: requiredChecks.every(c => c.valid),
    allOptional: optionalChecks.every(c => !c.present || c.valid),
    overall: requiredChecks.every(c => c.valid),
    checks,
    errors,
    warnings,
  };
}

/**
 * Log environment status to console
 */
export function logEnvironmentStatus(): void {
  const status = checkEnvironment();
  
  console.group('🔧 Environment Configuration Check');
  console.log('Overall Status:', status.overall ? '✅ Ready' : '❌ Issues Found');
  console.log('');
  
  console.group('📋 Configuration Details:');
  status.checks.forEach(check => {
    const icon = check.valid ? '✅' : (check.required ? '❌' : '⚠️');
    const badge = check.required ? '[REQUIRED]' : '[OPTIONAL]';
    console.log(`${icon} ${badge} ${check.variable}`);
    console.log(`   Status: ${check.message}`);
    if (check.value && check.present) {
      console.log(`   Value: ${check.value}`);
    }
    console.log('');
  });
  console.groupEnd();

  if (status.errors.length > 0) {
    console.group('❌ Errors (Must Fix):');
    status.errors.forEach(error => console.error(error));
    console.groupEnd();
  }

  if (status.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    status.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }

  if (!status.overall) {
    console.group('💡 Quick Fix:');
    console.log('1. Copy .env.example to .env:');
    console.log('   cp .env.example .env');
    console.log('');
    console.log('2. Edit .env and add your API keys');
    console.log('');
    console.log('3. Restart the development server');
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Check if environment is ready for production
 */
export function isProductionReady(): boolean {
  const status = checkEnvironment();
  return status.overall && status.allOptional;
}

/**
 * Get environment summary for UI display
 */
export function getEnvironmentSummary(): {
  ready: boolean;
  message: string;
  details: string;
} {
  const status = checkEnvironment();
  
  if (status.overall && status.allOptional) {
    return {
      ready: true,
      message: 'All systems configured',
      details: 'Your application is fully configured and ready to use.',
    };
  }

  if (status.overall) {
    return {
      ready: true,
      message: 'Core systems ready',
      details: `Required configuration complete. ${status.warnings.length} optional feature(s) not configured.`,
    };
  }

  return {
    ready: false,
    message: 'Configuration required',
    details: `${status.errors.length} required configuration(s) missing. Please set up your environment variables.`,
  };
}

// Auto-check on module load in development
if (import.meta.env.DEV) {
  logEnvironmentStatus();
}

export default checkEnvironment;

