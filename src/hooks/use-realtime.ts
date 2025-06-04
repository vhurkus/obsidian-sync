'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useNoteStore } from '@/stores/note'
import { useSyncStore } from '@/stores/sync'
import { useDeviceStore } from '@/stores/device'
import { realtimeService, RealtimeEvent } from '@/services/realtime-service'
import { deviceService } from '@/services/device-service'

export const useRealtime = () => {
  const { user } = useAuthStore()
  const { fetchNotes, updateNote } = useNoteStore()
  const { setConnectionStatus } = useSyncStore()
  const { setCurrentDevice, setActiveDevices } = useDeviceStore()
  
  const [isConnected, setIsConnected] = useState(false)
  const isInitialized = useRef(false)
  const isConnecting = useRef(false)

  // Handle realtime events
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    console.log('Realtime event:', event)

    // Refresh the notes list on any changes
    fetchNotes();
  }, [fetchNotes])

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: any) => {
    console.log('Connection status changed:', status)
    
    setIsConnected(status.connected);
    setConnectionStatus({
      connected: status.connected,
      error: status.error || null,
      lastConnected: status.lastConnected || null,
      lastDisconnected: status.lastDisconnected || null
    })
  }, [setConnectionStatus])

  // Initialize connection
  useEffect(() => {
    if (!user || !user.id) {
      // Clear any existing connection status when user is not available
      setConnectionStatus({
        connected: false,
        error: null,
        lastDisconnected: new Date()
      });
      return;
    }
    
    // Skip if already initialized or connecting
    if (isInitialized.current) {
      console.log('Realtime already initialized, skipping initialization');
      return;
    }
    
    if (isConnecting.current) {
      console.log('Connection already in progress, waiting for completion');
      return;
    }
    
    const initializeRealtime = async () => {
      try {
        console.log('Initializing realtime connection...');
        isConnecting.current = true;
        
        // Connect to realtime service
        const result = await realtimeService.connect(user.id);
        
        // Special handling for "Connection in progress" status
        if (result.success && result.error === 'Connection in progress') {
          console.log('Connection already in progress, waiting for it to complete');
          
          // Show a connecting message but don't treat as error
          setConnectionStatus({
            connected: false,
            error: 'Connecting to sync service...',
            lastDisconnected: new Date()
          });
          
          // Keep the connecting flag true but schedule a timeout to release it
          setTimeout(() => {
            if (isConnecting.current) {
              console.log('Releasing connecting lock after timeout');
              isConnecting.current = false;
            }
          }, 10000); // 10 second safety
          
          return;
        } else if (!result.success) {
          console.error('Failed to connect to realtime service:', result.error);
          
          // Don't show technical errors to users
          const userFriendlyError = 
            result.error === 'Connection already in progress' ? 'Connecting to sync service...' : 
            result.error || 'Unknown connection error';
            
          setConnectionStatus({
            connected: false,
            error: userFriendlyError,
            lastDisconnected: new Date()
          });
          
          isConnecting.current = false;
          
          // Schedule a retry for certain errors
          if (result.error && 
             (result.error.includes('timeout') || 
              result.error.includes('tried to subscribe multiple times'))) {
            console.log('Will retry connection in 5 seconds...');
            setTimeout(() => {
              isConnecting.current = false;
              // This will trigger a reconnection on the next effect run
            }, 5000);
          }
          return;
        }
        
        console.log('Realtime connection established successfully');
        
        // Subscribe to events
        const unsubscribe = realtimeService.subscribe(handleRealtimeEvent);
        
        // Subscribe to connection changes
        const unsubscribeConnection = realtimeService.onConnectionChange(handleConnectionChange);
        
        // Get connection status
        const status = realtimeService.getConnectionStatus();
        setIsConnected(status.connected);
        
        isInitialized.current = true;
        isConnecting.current = false;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Realtime initialization error:', error);
        
        // Update connection status on error
        setConnectionStatus({
          connected: false,
          error: errorMessage,
          lastDisconnected: new Date()
        });
        
        isConnecting.current = false;
      }
    };
    
    initializeRealtime();
    
    // Cleanup on unmount or when user changes
    return () => {
      console.log('Cleaning up realtime connection...');
      
      // Disconnect from realtime
      try {
        realtimeService.disconnect().catch(error => {
          console.error('Error during disconnect:', error);
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
      
      // Reset state
      isInitialized.current = false;
      isConnecting.current = false;
    };
  }, [user, handleRealtimeEvent, handleConnectionChange, setConnectionStatus]);

  // Provide a way to manually reconnect
  const reconnect = useCallback(async () => {
    if (!user || !user.id) return { success: false, error: 'No user ID' };
    
    // If already connecting, don't start another connection attempt
    if (isConnecting.current) {
      console.log('Already connecting, waiting for existing connection attempt to complete');
      // Just return the current status, don't consider it an error
      return { 
        success: true,
        error: 'Connection in progress' 
      };
    }
    
    try {
      isConnecting.current = true;
      console.log('Attempting to reconnect...');
      
      // Only disconnect if previously initialized
      if (isInitialized.current) {
        console.log('Disconnecting from existing connection');
        await realtimeService.disconnect().catch(err => {
          console.warn('Error during disconnect (non-critical):', err);
        });
        isInitialized.current = false;
      }
      
      // Wait a brief moment to ensure disconnection is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Connecting to realtime service...');
      const result = await realtimeService.connect(user.id);
      
      if (result.success) {
        console.log('Reconnection successful, setting up event handlers');
        // Set up subscriptions again
        const unsubscribe = realtimeService.subscribe(handleRealtimeEvent);
        const unsubscribeConnection = realtimeService.onConnectionChange(handleConnectionChange);
        
        // Update connection status
        const status = realtimeService.getConnectionStatus();
        setIsConnected(status.connected);
        
        isInitialized.current = true;
      } else {
        console.warn('Reconnection failed:', result.error);
      }
      
      isConnecting.current = false;
      return result;
    } catch (error) {
      console.error('Reconnection error:', error);
      isConnecting.current = false;
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Reconnection failed' 
      };
    }
  }, [user, handleRealtimeEvent, handleConnectionChange]);

  return {
    isConnected,
    reconnect
  };
};
