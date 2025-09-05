// Debug Google OAuth Client ID
console.log('=== GOOGLE OAUTH DEBUG ===');
console.log('Client ID from env:', import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID);
console.log('Client ID length:', import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.length);
console.log('Client ID includes .apps.googleusercontent.com:', import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.includes('.apps.googleusercontent.com'));
console.log('Client ID type:', typeof import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID);

// Check all environment variables starting with VITE_
console.log('All VITE env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).forEach(key => {
  console.log(`${key}:`, import.meta.env[key]);
});

export {};
