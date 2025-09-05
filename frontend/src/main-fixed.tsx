import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { suppressKnownWarnings } from "./utils/consoleUtils";

// Debug Google OAuth environment
import "./debug-google-oauth.ts";

// Clean up known console warnings in development
suppressKnownWarnings();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
