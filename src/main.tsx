// Silence benign Vite HMR websocket connection errors in AI Studio iframe environment
if (typeof window !== 'undefined' && window.console && window.console.error) {
  const origError = window.console.error;
  window.console.error = function (message, ...args) {
    const msgStr = typeof message === 'string' ? message : (message && (message.message || message.toString())) || '';
    if (typeof msgStr === 'string' && msgStr.includes('[vite]') && (msgStr.includes('websocket') || msgStr.includes('WebSocket') || msgStr.includes('failed to connect') || msgStr.includes('server connection lost'))) {
      return;
    }
    return origError.apply(this, [message, ...args]);
  };
}

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
