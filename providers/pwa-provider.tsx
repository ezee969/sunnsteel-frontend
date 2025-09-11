'use client';

import { useEffect, useRef } from 'react';

export const PwaProvider = (): null => {
  const reloadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const onControllerChange = () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      // Reload once when the new SW takes control
      window.location.reload();
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // When a new SW is installed and waiting, tell it to activate
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // There is an updated SW waiting
              console.debug('[PWA] Update found, activating new service worker');
              navigator.serviceWorker.controller?.postMessage({
                type: 'SKIP_WAITING',
              });
            }
          });
        });
      })
      .catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );
    };
  }, []);

  return null;
};
