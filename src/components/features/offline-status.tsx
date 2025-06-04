// ObsidianSync Offline Status Component
// Phase 6: Offline Support - Network Status Indicator

'use client';

import { useState } from 'react';
import { useOfflineStore } from '@/stores/offline';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Smartphone 
} from 'lucide-react';

export function OfflineStatusIndicator() {
  const {
    networkStatus,
    syncStatus,
    isOfflineMode,
    showInstallPrompt,
    deferredPrompt,
    setShowInstallPrompt,
    forceSync,
    retryFailedSyncs
  } = useOfflineStore();

  const [showDetails, setShowDetails] = useState(false);

  // Install PWA handler
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setShowInstallPrompt(false);
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
    }
  };

  const getConnectionIcon = () => {
    if (!networkStatus.isOnline || isOfflineMode) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (networkStatus.isConnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    return <Wifi className="h-4 w-4" />;
  };

  const getConnectionStatus = () => {
    if (!networkStatus.isOnline || isOfflineMode) {
      return 'Offline';
    }
    
    if (networkStatus.isConnecting) {
      return 'Connecting...';
    }
    
    if (syncStatus.isSyncing) {
      return `Syncing... ${syncStatus.syncProgress}%`;
    }
    
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} pending`;
    }
    
    return 'Online';
  };

  const getStatusColor = () => {
    if (!networkStatus.isOnline || isOfflineMode) {
      return 'text-red-500';
    }
    
    if (networkStatus.isConnecting || syncStatus.isSyncing) {
      return 'text-yellow-500';
    }
    
    if (syncStatus.pendingChanges > 0) {
      return 'text-orange-500';
    }
    
    return 'text-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Main Status Indicator */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 ${getStatusColor()}`}
      >
        {getConnectionIcon()}
        <span className="text-xs font-medium">
          {getConnectionStatus()}
        </span>
      </Button>

      {/* PWA Install Button */}
      {showInstallPrompt && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstallPWA}
          className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
        >
          <Smartphone className="h-4 w-4" />
          <span className="text-xs">Install App</span>
        </Button>
      )}

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute top-12 right-4 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 min-w-[280px] z-50">
          <div className="space-y-3">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network Status</span>
              <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                {getConnectionIcon()}
                <span className="text-sm">
                  {networkStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Sync Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync Status</span>
              <div className="flex items-center gap-2">
                {syncStatus.isSyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                ) : syncStatus.lastSyncError ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm">
                  {syncStatus.isSyncing ? 'Syncing...' : 
                   syncStatus.lastSyncError ? 'Error' : 'Synced'}
                </span>
              </div>
            </div>

            {/* Pending Changes */}
            {syncStatus.pendingChanges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Changes</span>
                <span className="text-sm text-orange-600 dark:text-orange-400">
                  {syncStatus.pendingChanges}
                </span>
              </div>
            )}

            {/* Sync Progress */}
            {syncStatus.isSyncing && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{syncStatus.syncProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncStatus.syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Last Sync Time */}
            {syncStatus.lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {syncStatus.lastSyncTime.toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Error Message */}
            {syncStatus.lastSyncError && (
              <div className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {syncStatus.lastSyncError}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => forceSync()}
                disabled={syncStatus.isSyncing || !networkStatus.isOnline}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Force Sync
              </Button>

              {syncStatus.lastSyncError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => retryFailedSyncs()}
                  disabled={syncStatus.isSyncing || !networkStatus.isOnline}
                  className="flex-1"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const {
    showInstallPrompt,
    deferredPrompt,
    setShowInstallPrompt
  } = useOfflineStore();

  if (!showInstallPrompt) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Download className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Install ObsidianSync
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add to your home screen for a better experience and offline access.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline Banner Component
export function OfflineBanner() {
  const { networkStatus, isOfflineMode } = useOfflineStore();

  if (networkStatus.isOnline && !isOfflineMode) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
        <WifiOff className="h-4 w-4" />
        <span>
          You&apos;re currently offline. Changes will sync when connection is restored.
        </span>
      </div>
    </div>
  );
}
