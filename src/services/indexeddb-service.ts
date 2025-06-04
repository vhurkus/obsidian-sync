// ObsidianSync IndexedDB Service
// Phase 6: Offline Support - Local Database Management

export interface OfflineNote {
  id: string;
  title: string;
  content: string;
  path: string;
  parent_id: string | null;
  is_folder: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_id: string;
  device_id: string | null;
  version: number;
  is_favorite: boolean;
  last_accessed_at: string | null;
  sync_status: 'pending' | 'synced' | 'conflict';
}

export interface SyncQueueItem {
  id?: number;
  user_id: string;
  device_id: string;
  action: 'create' | 'update' | 'delete';
  resource_type: 'note' | 'tag';
  resource_id: string;
  payload: any;
  timestamp: number;
  attempts: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ObsidianSyncOffline';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[IndexedDB] Upgrading database...');

        // Create notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('user_id', 'user_id');
          notesStore.createIndex('updated_at', 'updated_at');
          notesStore.createIndex('sync_status', 'sync_status');
          notesStore.createIndex('path', 'path');
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          syncStore.createIndex('user_id', 'user_id');
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('resource_type', 'resource_type');
          syncStore.createIndex('attempts', 'attempts');
        }

        // Create tags store
        if (!db.objectStoreNames.contains('tags')) {
          const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
          tagsStore.createIndex('user_id', 'user_id');
          tagsStore.createIndex('name', 'name');
        }

        // Create app metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Notes Operations
  async saveNote(note: OfflineNote): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      
      const request = store.put({
        ...note,
        updated_at: new Date().toISOString(),
        sync_status: 'pending'
      });

      request.onsuccess = () => {
        console.log('[IndexedDB] Note saved:', note.id);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to save note:', request.error);
        reject(request.error);
      };
    });
  }

  async getNote(id: string): Promise<OfflineNote | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get note:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllNotes(userId: string): Promise<OfflineNote[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const notes = request.result.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        resolve(notes);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get notes:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteNote(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[IndexedDB] Note deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to delete note:', request.error);
        reject(request.error);
      };
    });
  }

  // Sync Queue Operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      const request = store.add({
        ...item,
        timestamp: Date.now(),
        attempts: 0
      });

      request.onsuccess = () => {
        console.log('[IndexedDB] Item added to sync queue:', item);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to add to sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  async getSyncQueue(userId: string): Promise<SyncQueueItem[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const items = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[IndexedDB] Item removed from sync queue:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to remove from sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  async updateSyncQueueAttempts(id: number): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.attempts += 1;
          const putRequest = store.put(item);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Sync queue item not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Metadata Operations
  async setMetadata(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(key: string): Promise<any> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes', 'sync_queue', 'tags', 'metadata'], 'readwrite');
      
      const promises = [
        this.clearStore(transaction.objectStore('notes')),
        this.clearStore(transaction.objectStore('sync_queue')),
        this.clearStore(transaction.objectStore('tags')),
        this.clearStore(transaction.objectStore('metadata'))
      ];

      Promise.all(promises)
        .then(() => {
          console.log('[IndexedDB] All data cleared');
          resolve();
        })
        .catch(reject);
    });
  }

  private clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageStats(): Promise<{
    notesCount: number;
    syncQueueCount: number;
    estimatedSize: number;
  }> {
    const db = this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes', 'sync_queue'], 'readonly');
      
      Promise.all([
        this.getStoreCount(transaction.objectStore('notes')),
        this.getStoreCount(transaction.objectStore('sync_queue'))
      ]).then(([notesCount, syncQueueCount]) => {
        // Estimate storage size (rough calculation)
        const estimatedSize = (notesCount * 5000) + (syncQueueCount * 1000); // bytes
        
        resolve({
          notesCount,
          syncQueueCount,
          estimatedSize
        });
      }).catch(reject);
    });
  }

  private getStoreCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();

// Initialize on import (with error handling)
if (typeof window !== 'undefined' && 'indexedDB' in window) {
  indexedDBService.init().catch(error => {
    console.error('[IndexedDB] Failed to initialize:', error);
  });
}
