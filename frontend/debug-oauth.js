// Debug Google OAuth validation
const clientId = '261285591096-ptc89hqeqs2v04890vkq8c480nabcc28.apps.googleusercontent.com';

console.log('=== Google OAuth Debug ===');
console.log('Client ID:', clientId);
console.log('Has value:', !!clientId);
console.log('Not placeholder 1:', clientId !== 'your-google-client-id');
console.log('Not placeholder 2:', clientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE');
console.log('Not placeholder 3:', clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com');
console.log('Includes googleapis.com:', clientId.includes('.apps.googleusercontent.com'));

const hasValidGoogleClientId = () => {
  return clientId && 
         clientId !== 'your-google-client-id' && 
         clientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE' &&
         clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         clientId.includes('.apps.googleusercontent.com');
};

console.log('Final validation result:', hasValidGoogleClientId());
console.log('=========================');
