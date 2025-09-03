

import './index.css';
import './App.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider clientId="261285591096-ptc89hqeqs2v04890vkq8c480nabcc28.apps.googleusercontent.com">
		<App />
	</GoogleOAuthProvider>
);
