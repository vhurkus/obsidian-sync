// ObsidianSync Offline Store
// Phase 6: Offline Support - Sync Queue Management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { indexedDBService, SyncQueueItem } from '@/services/indexeddb-service';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  connectionQuality: 'good' | 'poor' | 'offline';
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: Date | null;
  lastSyncError: string | null;
  syncProgress: number; // 0-100
}

interface OfflineState {
  // Network Status
  networkStatus: NetworkStatus;
  setNetworkStatus: (status: Partial<NetworkStatus>) => void;
  
  // Sync Status
  syncStatus: SyncStatus;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  
  // Sync Queue
  syncQueue: SyncQueueItem[];
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>) => Promise<void>;
  removeFromSyncQueue: (id: number) => Promise<void>;
  clearSyncQueue: () => Promise<void>;
  processSyncQueue: () => Promise<void>;
  
  // Offline Mode
  isOfflineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  
  // PWA Installation
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
  showInstallPrompt: boolean;
  setShowInstallPrompt: (show: boolean) => void;
  
  // Background Sync Registration
  backgroundSyncSupported: boolean;
  setBackgroundSyncSupported: (supported: boolean) => void;
  
  // Actions
  initializeOfflineSupport: () => Promise<void>;
  forceSync: () => Promise<void>;
  retryFailedSyncs: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        networkStatus: {
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
          isConnecting: false,
          lastConnected: null,
          connectionQuality: 'good'
        },
        
        syncStatus: {
          isSyncing: false,
          pendingChanges: 0,
          lastSyncTime: null,
          lastSyncError: null,
          syncProgress: 0
        },
        
        syncQueue: [],
        isOfflineMode: false,
        deferredPrompt: null,
        showInstallPrompt: false,
        backgroundSyncSupported: false,

        // Network Status Actions
        setNetworkStatus: (status) =>
          set((state) => ({
            networkStatus: { ...state.networkStatus, ...status }
          })),

        // Sync Status Actions
        setSyncStatus: (status) =>
          set((state) => ({
            syncStatus: { ...state.syncStatus, ...status }
          })),

        // Sync Queue Actions
        addToSyncQueue: async (item) => {
          try {
            await indexedDBService.addToSyncQueue(item);
            
            // Update local state
            set((state) => ({
              syncQueue: [...state.syncQueue, { ...item, id: Date.now(), timestamp: Date.now(), attempts: 0 }],
              syncStatus: {
                ...state.syncStatus,
                pendingChanges: state.syncStatus.pendingChanges + 1
              }
            }));

            // Try to sync immediately if online
            const { networkStatus } = get();
            if (networkStatus.isOnline && !networkStatus.isConnecting) {
              get().processSyncQueue();
            }
          } catch (error) {
            console.error('[OfflineStore] Failed to add to sync queue:', error);
          }
        },

        removeFromSyncQueue: async (id) => {
          try {
            await indexedDBService.removeFromSyncQueue(id);
            
            set((state) => ({
              syncQueue: state.syncQueue.filter(item => item.id !== id),
              syncStatus: {
                ...state.syncStatus,
                pendingChanges: Math.max(0, state.syncStatus.pendingChanges - 1)
              }
            }));
          } catch (error) {
            console.error('[OfflineStore] Failed to remove from sync queue:', error);
          }
        },

        clearSyncQueue: async () => {
          try {
            const { syncQueue } = get();
            for (const item of syncQueue) {
              if (item.id) {
                await indexedDBService.removeFromSyncQueue(item.id);
              }
            }
            
            set((state) => ({
              syncQueue: [],
              syncStatus: {
                ...state.syncStatus,
                pendingChanges: 0
              }
            }));
          } catch (error) {
            console.error('[OfflineStore] Failed to clear sync queue:', error);
          }
        },

        processSyncQueue: async () => {
          const state = get();
          
          if (state.syncStatus.isSyncing || !state.networkStatus.isOnline) {
            return;
          }

          try {
            set((prevState) => ({
              syncStatus: {
                ...prevState.syncStatus,
                isSyncing: true,
                syncProgress: 0,
                lastSyncError: null
              }
            }));

            const syncQueue = await indexedDBService.getSyncQueue(
              // We'll need to get current user ID from auth store
              state.syncQueue[0]?.user_id || ''
            );

            if (syncQueue.length === 0) {
              set((prevState) => ({
                syncStatus: {
                  ...prevState.syncStatus,
                  isSyncing: false,
                  syncProgress: 100,
                  lastSyncTime: new Date(),
                  pendingChanges: 0
                }
              }));
              return;
            }

            let processed = 0;
            const total = syncQueue.length;

            for (const item of syncQueue) {
              try {
                // Here we would call the actual sync API
                await syncSingleItem(item);
                
                if (item.id) {
                  await indexedDBService.removeFromSyncQueue(item.id);
                }
                
                processed++;
                
                set((prevState) => ({
                  syncStatus: {
                    ...prevState.syncStatus,
                    syncProgress: Math.round((processed / total) * 100)
                  }
                }));
                
              } catch (error) {
                console.error('[OfflineStore] Failed to sync item:', error);
                
                // Increment attempts
                if (item.id) {
                  await indexedDBService.updateSyncQueueAttempts(item.id);
                }
                
                // Remove items that have failed too many times
                if (item.attempts >= 3) {
                  if (item.id) {
                    await indexedDBService.removeFromSyncQueue(item.id);
                  }
                }
              }
            }

            // Update sync queue from IndexedDB
            const updatedQueue = await indexedDBService.getSyncQueue(
              syncQueue[0]?.user_id || ''
            );

            set((prevState) => ({
              syncQueue: updatedQueue,
              syncStatus: {
                ...prevState.syncStatus,
                isSyncing: false,
                syncProgress: 100,
                lastSyncTime: new Date(),
                pendingChanges: updatedQueue.length
              }
            }));

          } catch (error) {
            console.error('[OfflineStore] Sync process failed:', error);
            
            set((prevState) => ({
              syncStatus: {
                ...prevState.syncStatus,
                isSyncing: false,
                lastSyncError: error instanceof Error ? error.message : 'Sync failed'
              }
            }));
          }
        },

        // Offline Mode Actions
        setOfflineMode: (offline) =>
          set({ isOfflineMode: offline }),

        // PWA Actions
        setDeferredPrompt: (prompt) =>
          set({ deferredPrompt: prompt }),

        setShowInstallPrompt: (show) =>
          set({ showInstallPrompt: show }),

        setBackgroundSyncSupported: (supported) =>
          set({ backgroundSyncSupported: supported }),

        // Initialize Offline Support
        initializeOfflineSupport: async () => {
          try {
            // Initialize IndexedDB
            await indexedDBService.init();

            // Check for existing sync queue items
            // Note: We'll need to get user ID from auth store
            const existingQueue = await indexedDBService.getSyncQueue('current_user_id');
            
            set((state) => ({
              syncQueue: existingQueue,
              syncStatus: {
                ...state.syncStatus,
                pendingChanges: existingQueue.length
              }
            }));

            // Set up network status listeners
            if (typeof window !== 'undefined') {
              const updateNetworkStatus = () => {
                const isOnline = navigator.onLine;
                get().setNetworkStatus({ 
                  isOnline, 
                  lastConnected: isOnline ? new Date() : get().networkStatus.lastConnected 
                });

                // Try to sync when coming back online
                if (isOnline && get().syncQueue.length > 0) {
                  setTimeout(() => {
                    get().processSyncQueue();
                  }, 1000);
                }
              };

              window.addEventListener('online', updateNetworkStatus);
              window.addEventListener('offline', updateNetworkStatus);

              // Check for PWA install prompt
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                get().setDeferredPrompt(e);
                get().setShowInstallPrompt(true);
              });

              // Check for service worker support
              if ('serviceWorker' in navigator) {
                // Check for background sync support
                navigator.serviceWorker.ready.then((registration) => {
                  get().setBackgroundSyncSupported('sync' in registration);
                });
              }
            }

            console.log('[OfflineStore] Offline support initialized');
          } catch (error) {
            console.error('[OfflineStore] Failed to initialize offline support:', error);
          }
        },

        // Force Sync
        forceSync: async () => {
          await get().processSyncQueue();
        },

        // Retry Failed Syncs
        retryFailedSyncs: async () => {
          const { syncQueue } = get();
          const failedItems = syncQueue.filter(item => item.attempts > 0);
          
          for (const item of failedItems) {
            // Reset attempts for retry
            if (item.id) {
              try {
                const db = indexedDBService['db'];
                if (db) {
                  const transaction = db.transaction(['sync_queue'], 'readwrite');
                  const store = transaction.objectStore('sync_queue');
                  await new Promise<void>((resolve, reject) => {
                    const request = store.get(item.id!);
                    request.onsuccess = () => {
                      const record = request.result;
                      if (record) {
                        record.attempts = 0;
                        const putRequest = store.put(record);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                      } else {
                        resolve();
                      }
                    };
                    request.onerror = () => reject(request.error);
                  });
                }
              } catch (error) {
                console.error('[OfflineStore] Failed to reset attempts:', error);
              }
            }
          }
          
          await get().processSyncQueue();
        }
      }),
      {
        name: 'offline-store',
        partialize: (state) => ({
          networkStatus: state.networkStatus,
          isOfflineMode: state.isOfflineMode,
          showInstallPrompt: state.showInstallPrompt
        })
      }
    ),
    { name: 'offline-store' }
  )
);

// Helper function to sync individual items
async function syncSingleItem(item: SyncQueueItem): Promise<void> {
  const { supabase } = await import('@/lib/supabase/client');
  
  console.log('[OfflineStore] Syncing item:', item);
  
  switch (item.resource_type) {
    case 'note':
      await syncNoteItem(supabase, item);
      break;
    case 'tag':
      await syncTagItem(supabase, item);
      break;
    default:
      throw new Error(`Unknown resource type: ${item.resource_type}`);
  }
}

async function syncNoteItem(supabase: any, item: SyncQueueItem): Promise<void> {
  switch (item.action) {
    case 'create':
      {
        const { error } = await supabase
          .from('notes')
          .insert([item.payload]);
        
        if (error) throw error;
        
        // Update IndexedDB to mark as synced
        await indexedDBService.saveNote({
          ...item.payload,
          sync_status: 'synced'
        });
      }
      break;
      
    case 'update':
      {
        const { error } = await supabase
          .from('notes')
          .update(item.payload)
          .eq('id', item.resource_id);
        
        if (error) throw error;
        
        // Update IndexedDB to mark as synced
        const existingNote = await indexedDBService.getNote(item.resource_id);
        if (existingNote) {
          await indexedDBService.saveNote({
            ...existingNote,
            ...item.payload,
            sync_status: 'synced'
          });
        }
      }
      break;
      
    case 'delete':
      {
        const { error } = await supabase
          .from('notes')
          .update(item.payload)
          .eq('id', item.resource_id);
        
        if (error) throw error;
        
        // Update IndexedDB to mark as synced
        const existingNote = await indexedDBService.getNote(item.resource_id);
        if (existingNote) {
          await indexedDBService.saveNote({
            ...existingNote,
            ...item.payload,
            sync_status: 'synced'
          });
        }
      }
      break;
      
    default:
      throw new Error(`Unknown action: ${item.action}`);
  }
}

async function syncTagItem(supabase: any, item: SyncQueueItem): Promise<void> {
  // Implementation for tag sync would go here
  console.log('[OfflineStore] Tag sync not yet implemented:', item);
}
