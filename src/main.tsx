// Silence benign Vite HMR websocket connection errors in AI Studio iframe environment
if (typeof window !== 'undefined' && window.console) {
  function isViteArtifact(args: any[]) {
    for (let i = 0; i < args.length; i++) {
      const item = args[i];
      if (!item) continue;
      let str = '';
      if (typeof item === 'string') {
        str = item;
      } else if (item instanceof Error) {
        str = (item.message || '') + ' ' + (item.stack || '');
      } else {
        try { str = JSON.stringify(item); } catch(e) { str = String(item); }
      }
      const lower = str.toLowerCase();
      if (
        str.includes('[vite]') ||
        str.includes('/@vite/') ||
        str.includes('vite-hmr') ||
        lower.includes('websocket') ||
        (lower.includes('vite') && (lower.includes('connect') || lower.includes('failed')))
      ) {
        return true;
      }
    }
    return false;
  }

  const methods: ('error' | 'warn' | 'debug' | 'log' | 'info')[] = ['error', 'warn', 'debug', 'log', 'info'];
  methods.forEach(function (m) {
    if (typeof window.console[m] === 'function') {
      const orig = window.console[m];
      window.console[m] = function (...args: any[]) {
        if (isViteArtifact(args)) {
          return;
        }
        return orig.apply(this, args);
      };
    }
  });
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
