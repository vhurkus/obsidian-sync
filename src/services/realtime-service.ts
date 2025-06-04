// src/services/realtime-service.ts
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Note } from '@/types'
import { deviceService } from './device-service'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEvent {
  eventType: RealtimeEventType
  new: Note
  old: Note
  schema: string
  table: string
  commit_timestamp: string
}

export interface ConnectionStatus {
  connected: boolean
  error?: string
  lastConnected?: Date
  lastDisconnected?: Date
}

export type RealtimeCallback = (event: RealtimeEvent) => void
export type ConnectionCallback = (status: ConnectionStatus) => void

export class RealtimeService {
  private static instance: RealtimeService | null = null
  private channel: RealtimeChannel | null = null
  private callbacks: Set<RealtimeCallback> = new Set()
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private userId: string | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null

  private constructor() {
    // Initialize connection status monitoring only in browser
    if (typeof window !== 'undefined') {
      this.setupConnectionMonitoring()
    }
  }

  static getInstance(): RealtimeService {
    // Create a new instance each time on server side to avoid singleton issues
    if (typeof window === 'undefined') {
      return new RealtimeService()
    }
    
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  private setupConnectionMonitoring() {
    // Only set up monitoring in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Monitor network connectivity
    window.addEventListener('online', () => {
      console.log('Network online - attempting to reconnect')
      this.handleReconnect()
    })

    window.addEventListener('offline', () => {
      console.log('Network offline - disconnecting realtime')
      this.handleDisconnect()
    })
  }

  private notifyConnectionStatus(status: ConnectionStatus) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Connection callback error:', error)
      }
    })
  }

  private handleReconnect() {
    if (this.userId && !this.isConnected) {
      this.connect(this.userId)
    }
  }

  private handleDisconnect() {
    this.isConnected = false
    this.notifyConnectionStatus({
      connected: false,
      lastDisconnected: new Date()
    })
  }

  // Track connection in progress to prevent multiple simultaneous connection attempts
  private isConnecting = false;

  // Add a timeout to reset isConnecting flag in case of stuck connections
  private addConnectionTimeout() {
    const CONNECTION_TIMEOUT = 15000; // 15 seconds
    
    setTimeout(() => {
      if (this.isConnecting) {
        console.log('Connection timeout - resetting connection state');
        this.isConnecting = false;
      }
    }, CONNECTION_TIMEOUT);
  }

  async connect(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we have a valid session before attempting connection
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.log('No active session - realtime requires authentication');
        return { 
          success: false, 
          error: 'Authentication required for sync functionality' 
        };
      }
      
      // Check if a connection attempt is already in progress
      if (this.isConnecting) {
        console.log('Connection attempt already in progress, skipping duplicate request');
        
        // If already connected to the same user, consider it a success
        if (this.channel && this.userId === userId && this.isConnected) {
          console.log('Already connected to the same user channel, returning success');
          return { success: true };
        }
        
        // For in-progress connections, return a specific status code that the UI can handle
        return { success: true, error: 'Connection in progress' };
      }

      this.isConnecting = true;
      // Add safety timeout to reset connecting state if stuck
      this.addConnectionTimeout();
      
      console.log(`Connecting to realtime service for user: ${userId.substring(0, 8)}...`);
      
      // If already connected to the same user channel, return success
      if (this.channel && this.userId === userId && this.isConnected) {
        console.log('Already connected to the same user channel');
        this.isConnecting = false;
        return { success: true };
      }
      
      this.userId = userId

      // Disconnect existing channel
      if (this.channel) {
        await this.disconnect()
      }

      // Try to register device, but continue even if it fails
      try {
        console.log('Attempting to register device...');
        const deviceResult = await deviceService.registerDevice(userId)
        if (!deviceResult.success) {
          console.warn(`Device registration failed but continuing: ${deviceResult.error || 'Unknown error'}`);
          // Continue anyway - this is non-critical
        } else {
          console.log('Device registered successfully');
        }
      } catch (deviceError) {
        const errorDetails = deviceError instanceof Error 
          ? deviceError.message 
          : (typeof deviceError === 'object' ? JSON.stringify(deviceError) : String(deviceError));
        console.warn(`Device registration error but continuing: ${errorDetails}`);
        // Continue anyway - this is non-critical
      }

      // Create channel with user-specific subscription
      this.channel = supabase.channel(`notes_${userId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: deviceService.getDeviceId() }
        }
      })

      // Configure channel event handlers
      const alreadySubscribedToNotes = this.isChannelSubscribedToTable('notes');
      
      if (!alreadySubscribedToNotes) {
        console.log('Setting up postgres changes listeners');
        this.channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notes',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log('Realtime event received:', payload)
              this.handleDatabaseChange(payload)
            }
          )
      } else {
        console.log('Channel already has postgres_changes subscription for notes table');
      }
      
      // Always set up presence handlers
      this.channel
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence sync')
          this.updatePresence()
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Device joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Device left:', key, leftPresences)
        })

      // Subscribe and handle connection
      try {
        // Check if the channel is already subscribed
        if (this.channel.state === 'joined') {
          console.log('Channel is already subscribed')
          this.isConnected = true
          
          this.notifyConnectionStatus({
            connected: true,
            lastConnected: new Date()
          })
          
          // Make sure to update presence when joining an existing channel
          this.updatePresence()
          
          return { success: true }
        }
        
        // Subscribe to the channel once and handle status changes directly
        console.log('Subscribing to channel...');
        
        // Create a promise that will resolve when the subscription status is received
        // but will time out after 10 seconds
        const subscriptionPromise = new Promise<{ success: boolean; error?: string }>((resolve) => {
          // Keep track of timeout ID to clear it on success
          let timeoutId: NodeJS.Timeout | null = null;
          const handleStatus = (status: string) => {
            console.log('Subscription status:', status)
            
            // Clear timeout if it exists to prevent resolution after timeout
            if (timeoutId) {
              clearTimeout(timeoutId)
              timeoutId = null
            }
            
            if (status === 'SUBSCRIBED') {
              this.isConnected = true
              this.reconnectAttempts = 0
              
              // Clear any pending reconnect timeout
              if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout)
                this.reconnectTimeout = null
              }

              this.notifyConnectionStatus({
                connected: true,
                lastConnected: new Date()
              })

              // Track presence
              this.updatePresence()
              
              resolve({ success: true })
            } else if (status === 'CHANNEL_ERROR') {
              this.isConnected = false
              this.notifyConnectionStatus({
                connected: false,
                error: 'Channel connection error'
              })
              
              // Attempt reconnection
              this.scheduleReconnect()
              
              resolve({ success: false, error: 'Channel error' })
            } else if (status === 'TIMED_OUT') {
              this.isConnected = false
              this.notifyConnectionStatus({
                connected: false,
                error: 'Connection timed out'
              })
              
              // Attempt reconnection
              this.scheduleReconnect()
              
              resolve({ success: false, error: 'Connection timed out' })
            }
          }
          
          try {
            // Check channel state before subscribing to prevent multiple subscriptions
            if (this.channel && (this.channel.state === 'joined' || this.channel.state === 'joining')) {
              console.log('Channel is already in state:', this.channel.state)
              // If already joined, manually trigger success state
              if (this.channel.state === 'joined') {
                handleStatus('SUBSCRIBED')
              }
              // If joining, let the subscription process complete naturally
            } else if (this.channel) {
              // Only subscribe if not already subscribed or joining
              this.channel.subscribe(handleStatus)
            } else {
              console.error('Channel is null before subscription')
              resolve({ success: false, error: 'Channel initialization failed' })
            }
          } catch (err) {
            console.error('Error during subscribe:', err)
            resolve({ success: false, error: err instanceof Error ? err.message : 'Subscribe error' })
          }
          
          // Set timeout for the subscription
          timeoutId = setTimeout(() => {
            console.log('Subscription timed out after 10 seconds')
            timeoutId = null
            this.isConnected = false
            
            // Notify about timeout
            this.notifyConnectionStatus({
              connected: false,
              error: 'Subscription timeout',
              lastDisconnected: new Date()
            })
            
            // Attempt reconnection
            this.scheduleReconnect()
            
            resolve({ success: false, error: 'Subscription timeout' })
          }, 10000)
        })
        
        // Wait for the subscription promise to resolve
        return await subscriptionPromise
      } catch (subscribeError) {
        console.error('Channel subscription error:', subscribeError)
        this.isConnected = false;
        
        // Clean up the channel
        if (this.channel) {
          try {
            await this.channel.unsubscribe();
          } catch (unsubError) {
            console.error('Error unsubscribing from channel:', unsubError);
          }
          this.channel = null;
        }
        
        this.isConnecting = false;
        return {
          success: false,
          error: subscribeError instanceof Error ? subscribeError.message : 'Subscription failed'
        };
      }

      this.isConnecting = false;
      return { success: true }
    } catch (error) {
      console.error('Realtime connection failed:', error)
      this.isConnecting = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Max 30s
    this.reconnectAttempts++

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    this.reconnectTimeout = setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId)
      }
    }, delay)
  }

  private updatePresence() {
    if (this.channel && this.userId) {
      this.channel.track({
        user_id: this.userId,
        device_id: deviceService.getDeviceId(),
        device_name: deviceService.getDeviceName(),
        online_at: new Date().toISOString()
      })

      // Update device activity
      deviceService.updateDeviceActivity(this.userId)
    }
  }

  private handleDatabaseChange(payload: any) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload

      // Skip if this change was made by current device
      if (newRecord?.device_id === deviceService.getDeviceId()) {
        console.log('Skipping self-generated change')
        return
      }

      const event: RealtimeEvent = {
        eventType: eventType as RealtimeEventType,
        new: newRecord as Note,
        old: oldRecord as Note,
        schema: payload.schema,
        table: payload.table,
        commit_timestamp: payload.commit_timestamp
      }

      // Notify all subscribers
      this.callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Realtime callback error:', error)
        }
      })
    } catch (error) {
      console.error('Error handling database change:', error)
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Reset connecting state first to prevent pending connection attempts
      this.isConnecting = false;
      
      // If there's no channel or we're not connected, just reset state
      if (!this.channel) {
        this.isConnected = false;
        this.userId = null;
        return;
      }
      
      console.log('Disconnecting from channel, current state:', this.channel.state);
      
      // First unsubscribe from the channel
      try {
        // Check the channel state before attempting to unsubscribe
        // This helps prevent errors when trying to unsubscribe from an already unsubscribed channel
        if (this.channel.state === 'joined' || this.channel.state === 'joining') {
          console.log('Unsubscribing from channel in state:', this.channel.state);
          await this.channel.unsubscribe();
          console.log('Channel unsubscribed successfully');
        } else {
          console.log('Channel already unsubscribed, state:', this.channel.state);
        }
      } catch (error) {
        // Check for specific errors related to already being unsubscribed
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('already unsubscribed') || 
            errorMsg.includes('not subscribed') ||
            errorMsg.includes('No subscription')) {
          console.log('Channel was already unsubscribed');
        } else {
          console.error('Error unsubscribing from channel:', error);
        }
        // Continue with cleanup despite the error
      }
      
      // Reset the channel
      this.channel = null;

      // Deactivate device if we have a user ID
      if (this.userId) {
        try {
          await deviceService.deactivateDevice(this.userId);
        } catch (error) {
          console.error('Error deactivating device:', error);
        }
      }

      // Reset connection state
      this.isConnected = false;
      this.userId = null;

      // Clear any reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      this.notifyConnectionStatus({
        connected: false,
        lastDisconnected: new Date()
      })
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  subscribe(callback: RealtimeCallback): () => void {
    this.callbacks.add(callback)
    
    return () => {
      this.callbacks.delete(callback)
    }
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    
    // Immediately call with current status
    callback({
      connected: this.isConnected,
      lastConnected: this.isConnected ? new Date() : undefined
    })
    
    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      lastConnected: this.isConnected ? new Date() : undefined
    }
  }

  isOnline(): boolean {
    return this.isConnected
  }

  private isChannelSubscribedToTable(tableName: string): boolean {
    if (!this.channel) return false;
    
    // Check if this channel has any config for the specified table
    const hasTableSubscription = this.channel.topic.includes(tableName);
    
    // There's no public API to check subscriptions directly, so we rely on topic name
    // and check if the channel is already joined
    return hasTableSubscription && this.channel.state === 'joined';
  }

  // Broadcast custom events to other devices
  async broadcast(event: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.channel || !this.isConnected) {
        return { success: false, error: 'Not connected to realtime' }
      }

      const result = await this.channel.send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          device_id: deviceService.getDeviceId(),
          timestamp: new Date().toISOString()
        }
      })

      return { success: result === 'ok' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Broadcast failed'
      }
    }
  }
}

export const realtimeService = RealtimeService.getInstance()
