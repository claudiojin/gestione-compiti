'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        if (process.env.NODE_ENV === 'development') {
          console.info('Service worker registered', registration);
        }
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }

    return () => {
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
