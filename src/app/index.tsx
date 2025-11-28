import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { Text } from 'react-native-paper'
import { getProfileByUserId } from '@/lib/profiles'

export default function Index() {
  const { session, loading, signOut } = useAuth()
  const router = useRouter()
  const hasRoutedRef = useRef(false)

  // Reset routing flag when session user ID changes
  useEffect(() => {
    if (session?.user?.id) {
      hasRoutedRef.current = false
    }
  }, [session?.user?.id])

  useEffect(() => {
    // Prevent multiple routing attempts
    if (hasRoutedRef.current) {
      return
    }
    
    const checkAuthAndRoute = async () => {
      if (loading) {
        return
      }

      if (!session) {
        hasRoutedRef.current = true
        router.replace('/(auth)/admin-login')
        return
      }

      // Get role from profiles table
      if (session.user.id) {
        try {
          const result = await getProfileByUserId(session.user.id)
          
          if (result.error) {
            await signOut()
            router.replace('/(auth)/admin-login')
            return
          }
          
          if (!result.profile) {
            await signOut()
            router.replace('/(auth)/admin-login')
            return
          }

          const role = result.profile.role

          if (role === 'student') {
            hasRoutedRef.current = true
            router.replace('/(student)/(tabs)/dashboard')
            return
          }

          if (role === 'admin') {
            hasRoutedRef.current = true
            router.replace('/(admin)/(tabs)')
            return
          }

          // Unknown role - deny access
          await signOut()
          router.replace('/(auth)/admin-login')
        } catch (error) {
          await signOut()
          router.replace('/(auth)/admin-login')
        }
      } else {
        await signOut()
        router.replace('/(auth)/admin-login')
      }
    }

    checkAuthAndRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading, signOut])

  // Show loading screen while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7B2CBF" />
      <Text style={styles.loadingText}>
        Loading...
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
})

