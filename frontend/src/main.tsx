

import './index.css';
import './App.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import { suppressKnownWarnings } from './utils/consoleUtils';

// Clean up development console warnings
suppressKnownWarnings();

createRoot(document.getElementById("root")!).render(
	<App />
);
