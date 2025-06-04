import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { mockAuthService } from '@/services/mock-service'
import { User, AuthState } from '@/types'
import type { Session } from '@supabase/supabase-js'

const isMockMode = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

interface AuthStore extends AuthState {
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      session: null,
      loading: true,
      error: null,

      // Actions
      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })

        try {
          if (isMockMode) {
            const { data, error } = await mockAuthService.signIn(email, password)
            if (error) {
              set({ error: String(error), loading: false })
              return { error: String(error) }
            }
            set({ user: data.user, loading: false })
            return { error: null }
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ error: error.message, loading: false })
            return { error: error.message }
          }

          set({ user: data.user as User, session: data.session, loading: false })
          return { error: null }
        } catch (error) {
          const errorMessage = 'An unexpected error occurred'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      signUp: async (email: string, password: string) => {
        set({ loading: true, error: null })

        try {
          if (isMockMode) {
            const { data, error } = await mockAuthService.signUp(email, password)
            if (error) {
              set({ error: String(error), loading: false })
              return { error: String(error) }
            }
            set({ user: data.user, loading: false })
            return { error: null }
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })

          if (error) {
            set({ error: error.message, loading: false })
            return { error: error.message }
          }

          // If user needs to confirm email
          if (data.user && !data.session) {
            set({ 
              error: 'Please check your email to confirm your account',
              loading: false 
            })
            return { error: null }
          }

          set({ user: data.user as User, session: data.session, loading: false })
          return { error: null }
        } catch (error) {
          const errorMessage = 'An unexpected error occurred'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      signOut: async () => {
        set({ loading: true })
        
        try {
          if (isMockMode) {
            await mockAuthService.signOut()
          } else {
            await supabase.auth.signOut()
          }
          set({ user: null, session: null, loading: false, error: null })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ loading: false })
        }
      },

      resetPassword: async (email: string) => {
        if (isMockMode) {
          // Mock password reset - just return success
          return { error: null }
        }

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          })

          if (error) {
            return { error: error.message }
          }

          return { error: null }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred'
          return { error: errorMessage }
        }
      },

      initialize: async () => {
        try {
          if (isMockMode) {
            const { data } = await mockAuthService.getCurrentUser()
            set({
              user: data.user,
              session: null, // Mock mode doesn't use sessions
              loading: false,
            })
            return
          }

          const { data: { session } } = await supabase.auth.getSession()
          
          set({
            user: session?.user as User | null,
            session,
            loading: false,
          })

          // Listen for auth changes
          supabase.auth.onAuthStateChange((event, session) => {
            set({
              user: session?.user as User | null,
              session,
              loading: false,
            })
          })
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ loading: false })
        }
      },

      // Setters
      setUser: (user: User | null) => set({ user }),
      setSession: (session: Session | null) => set({ session }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-store',
    }
  )
)
