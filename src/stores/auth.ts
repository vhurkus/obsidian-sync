import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { User, AuthState } from '@/types'
import type { Session } from '@supabase/supabase-js'

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
        
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const errorMsg = 'Supabase yapılandırılmamış. Lütfen .env.local dosyasını oluşturun ve Supabase bilgilerinizi ekleyin.'
          set({ error: errorMsg, loading: false })
          return { error: errorMsg }
        }
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ error: error.message, loading: false })
            return { error: error.message }
          }

          set({
            user: data.user as User, 
            session: data.session,
            loading: false,
            error: null 
          })
          
          return { error: null }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      signUp: async (email: string, password: string) => {
        set({ loading: true, error: null })
        
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const errorMsg = 'Supabase yapılandırılmamış. Lütfen .env.local dosyasını oluşturun ve Supabase bilgilerinizi ekleyin.'
          set({ error: errorMsg, loading: false })
          return { error: errorMsg }
        }
          try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          })

          if (error) {
            set({ error: error.message, loading: false })
            return { error: error.message }
          }

          // Don't set user immediately for signup - they need to confirm email
          set({ loading: false, error: null })
          return { error: null }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      signOut: async () => {
        set({ loading: true })
        
        try {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            await supabase.auth.signOut()
          }
          set({ user: null, session: null, loading: false, error: null })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ loading: false })
        }
      },

      resetPassword: async (email: string) => {        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          return { error: 'Supabase yapılandırılmamış' }
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
          const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
          return { error: errorMessage }
        }
      },

      initialize: async () => {
        try {
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('⚠️  Supabase yapılandırılmamış')
            set({ loading: false })
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
