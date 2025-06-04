import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { mockAuthService } from '@/services/mock-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase environment variables not configured. Running in mock mode for testing.')
}

// Initialize Supabase client with debug logging
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey)

// Add connection status logging
// Note: The realtime connection status can be monitored through channel status instead
// of direct realtime events in newer Supabase versions
if (typeof window !== 'undefined') {
  console.log('Supabase client initialized');
  
  // Set up a channel for connection status monitoring
  try {
    const statusChannel = supabase.channel('connection_status');
    
    // Monitor the status of this channel to track connection state
    statusChannel.subscribe((status) => {
      console.log(`Supabase connection status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('Supabase realtime connected');
      } else if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        console.log('Supabase realtime disconnected');
      } else if (status === 'ERRORED') {
        console.error('Supabase realtime error');
      }
    });
  } catch (error) {
    console.error('Failed to initialize connection monitoring:', error);
  }
}

// Export createClient function for compatibility
export const createClient = () => supabase

// Helper function to get current user with mock support
export const getCurrentUser = async () => {
  if (isMockMode) {
    return await mockAuthService.getUser()
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper function to get session with mock support
export const getSession = async () => {
  if (isMockMode) {
    const session = localStorage.getItem('mock-session')
    return session ? JSON.parse(session) : null
  }
  
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}
