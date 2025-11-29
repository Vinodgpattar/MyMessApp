import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      throw error
    }

    if (data?.session) {
      setSession(data.session)
      setUser(data.user)
    } else {
      throw new Error('Failed to create session. Please try again.')
    }
  }

  const signOut = async () => {
    try {
      // Clear Supabase session first
      const { error } = await supabase.auth.signOut()
      if (error) {
        logger.error('Supabase signOut error', error as Error)
        throw error
      }

      // Clear local state immediately
      setSession(null)
      setUser(null)

      // CRITICAL FIX: Clear ALL possible AsyncStorage keys
      // Supabase uses different key names in different SDK versions
      const storageKeys = [
        '@supabase.auth.token',
        '@supabase.auth.refresh_token',
        'supabase.auth.token',
        'supabase.auth.refresh_token',
        'sb-auth-token',
        'sb-refresh-token',
      ]

      try {
        await AsyncStorage.multiRemove(storageKeys)
        logger.debug('AsyncStorage cleared', { keys: storageKeys })
      } catch (storageError) {
        // Non-critical - log but don't fail logout
        logger.warn('Failed to clear some AsyncStorage keys', storageError as Error)
      }

      // CRITICAL FIX: Verify session is actually cleared
      // Handle Supabase refresh token race condition
      await new Promise(resolve => setTimeout(resolve, 150)) // Wait for async operations
      
      const { data: { session: verifySession } } = await supabase.auth.getSession()
      if (verifySession) {
        logger.warn('Session still exists after signOut, forcing clear')
        // Force clear by removing all Supabase keys
        const allKeys = await AsyncStorage.getAllKeys()
        const supabaseKeys = allKeys.filter(key => 
          key.includes('supabase') || key.includes('auth') || key.includes('sb-')
        )
        if (supabaseKeys.length > 0) {
          await AsyncStorage.multiRemove(supabaseKeys)
        }
        setSession(null)
        setUser(null)
      }

      logger.debug('SignOut completed successfully')
    } catch (error) {
      logger.error('SignOut error', error as Error)
      // Still clear local state even if Supabase signOut fails
      setSession(null)
      setUser(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


