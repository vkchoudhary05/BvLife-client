import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept all /api/ fetch requests globally to support separate backend hosts
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function (input: any, init: any) {
      const baseUrl = ((import.meta as any).env?.VITE_API_URL as string) || '';
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${input}` : input;
        return originalFetch(url, init);
      } else if (input instanceof Request) {
        const requestUrl = new URL(input.url, window.location.href);
        if (requestUrl.pathname.startsWith('/api/')) {
          const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${requestUrl.pathname}${requestUrl.search}` : input.url;
          const newRequest = new Request(url, input);
          return originalFetch(newRequest, init);
        }
      }
      return originalFetch(input, init);
    }
  });
} catch (error) {
  console.warn("Could not override fetch via Object.defineProperty. Falling back to direct assignment.", error);
  try {
    (window as any).fetch = function (input: any, init: any) {
      const baseUrl = ((import.meta as any).env?.VITE_API_URL as string) || '';
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${input}` : input;
        return originalFetch(url, init);
      } else if (input instanceof Request) {
        const requestUrl = new URL(input.url, window.location.href);
        if (requestUrl.pathname.startsWith('/api/')) {
          const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${requestUrl.pathname}${requestUrl.search}` : input.url;
          const newRequest = new Request(url, input);
          return originalFetch(newRequest, init);
        }
      }
      return originalFetch(input, init);
    };
  } catch (err) {
    console.error("Failed to intercept window.fetch completely", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

