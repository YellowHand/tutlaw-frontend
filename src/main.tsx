import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource-variable/manrope";
import './index.css'
import App from './App.tsx'
import { initMonitoring, reactRootErrorOptions } from './lib/monitoring'

// Najpierw monitoring, żeby złapać także błędy z uruchamiania aplikacji. Bez VITE_SENTRY_DSN nic nie wysyła.
initMonitoring()


createRoot(document.getElementById('root')!, reactRootErrorOptions).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
