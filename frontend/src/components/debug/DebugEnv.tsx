import React from 'react';

const DebugEnv: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  console.log('=== Environment Debug ===');
  console.log('All import.meta.env:', import.meta.env);
  console.log('VITE_GOOGLE_OAUTH_CLIENT_ID:', googleClientId);
  console.log('VITE_API_BASE_URL:', apiUrl);
  console.log('========================');

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-md">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      <p><strong>Google Client ID:</strong> {googleClientId || 'NOT SET'}</p>
      <p><strong>API URL:</strong> {apiUrl || 'NOT SET'}</p>
      <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
      <p><strong>Dev:</strong> {import.meta.env.DEV ? 'true' : 'false'}</p>
    </div>
  );
};

export default DebugEnv;
