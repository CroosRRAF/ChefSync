// Test the new Google Client ID
const newClientId = '261285591096-7so4415raecp21sau6q6sgsn8sqrsrg0.apps.googleusercontent.com';

console.log('=== New Google OAuth Client ID Test ===');
console.log('Client ID:', newClientId);
console.log('Has value:', !!newClientId);
console.log('Not placeholder 1:', newClientId !== 'your-google-client-id');
console.log('Not placeholder 2:', newClientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE');
console.log('Not placeholder 3:', newClientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com');
console.log('Includes googleapis.com:', newClientId.includes('.apps.googleusercontent.com'));

const hasValidGoogleClientId = () => {
  return newClientId && 
         newClientId !== 'your-google-client-id' && 
         newClientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE' &&
         newClientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         newClientId.includes('.apps.googleusercontent.com');
};

console.log('Final validation result:', hasValidGoogleClientId());
console.log('===========================================');
