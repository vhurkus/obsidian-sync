// ObsidianSync Service Worker Registration
// Phase 6: Offline Support - PWA Integration

'use client';

import { useEffect } from 'react';
import { useOfflineStore } from '@/stores/offline';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const initializeOfflineSupport = useOfflineStore(state => state.initializeOfflineSupport);
  const setBackgroundSyncSupported = useOfflineStore(state => state.setBackgroundSyncSupported);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
    
    // Initialize offline support
    initializeOfflineSupport();
  }, [initializeOfflineSupport]);

  const registerServiceWorker = async () => {
    try {
      console.log('[SW] Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('[SW] Service worker registered successfully:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[SW] New service worker available');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New content available, reload to update');
              
              // You could show a notification to user here
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller changes
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Check for background sync support
      if ('sync' in registration) {
        setBackgroundSyncSupported(true);
        console.log('[SW] Background sync supported');
      }

      // Register for background sync
      await registration.ready;
      
      // Try to register background sync
      try {
        await registration.sync.register('note-sync');
        console.log('[SW] Background sync registered');
      } catch (error) {
        console.log('[SW] Background sync registration failed:', error);
      }

    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
    }
  };

  return <>{children}</>;
}

// Hook for manual service worker operations
export function useServiceWorker() {
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  };

  const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const result = await registration.unregister();
        console.log('[SW] Service worker unregistered:', result);
        return result;
      }
    }
    return false;
  };

  const triggerBackgroundSync = async (tag: string = 'note-sync') => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        try {
          await registration.sync.register(tag);
          console.log('[SW] Background sync triggered:', tag);
          return true;
        } catch (error) {
          console.error('[SW] Background sync failed:', error);
          return false;
        }
      }
    }
    return false;
  };

  const getServiceWorkerStatus = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        registered: !!registration,
        active: !!registration?.active,
        installing: !!registration?.installing,
        waiting: !!registration?.waiting,
        scope: registration?.scope,
        updateViaCache: registration?.updateViaCache
      };
    }
    return null;
  };

  return {
    checkForUpdates,
    unregisterServiceWorker,
    triggerBackgroundSync,
    getServiceWorkerStatus
  };
}
