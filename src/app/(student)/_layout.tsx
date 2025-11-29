import { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getProfileByUserId } from '@/lib/profiles'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'

export default function StudentLayout() {
  const { session, loading: authLoading, user } = useAuth()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkStudentAccess = async () => {
      if (authLoading) return

      if (!session || !user) {
        router.replace('/(auth)/admin-login')
        return
      }

      // ✅ NEW: Get role from profiles table ONLY
      if (user.id) {
        setCheckingRole(true)
        try {
          const result = await getProfileByUserId(user.id)
          
          if (result.error) {
            router.replace('/(auth)/admin-login')
            return
          }

          if (!result.profile) {
            router.replace('/(auth)/admin-login')
            return
          }

          const role = result.profile.role

          if (role === 'student') {
            setIsAuthorized(true)
            setCheckingRole(false)
            return
          }

          if (role === 'admin') {
            router.replace('/(admin)/(tabs)')
            return
          }

          // Unknown role - deny access
          router.replace('/(auth)/admin-login')
        } catch (error) {
          router.replace('/(auth)/admin-login')
        }
      } else {
        router.replace('/(auth)/admin-login')
      }
    }

    checkStudentAccess()
  }, [session, user, authLoading, router])

  if (authLoading || checkingRole) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Checking access...
        </Text>
      </View>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="reset-pin" options={{ presentation: 'card' }} />
      <Stack.Screen name="qr-scanner" options={{ headerShown: false, animation: 'fade' }} />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
})

