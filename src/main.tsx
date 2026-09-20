import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update
registerSW({
  immediate: true,
  onRegisteredSW(swScriptUrl) {
    console.log('PWA Service Worker registered:', swScriptUrl);
  },
  onRegisterError(error) {
    console.warn('PWA Service Worker registration failed:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
