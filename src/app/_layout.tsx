import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { lightTheme } from '@/lib/theme'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Linking from 'expo-linking'
import { markAttendanceFromQR } from '@/lib/qr-attendance'
import { logger } from '@/lib/logger'
import { Alert } from 'react-native'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Deep link handler component (must be inside both AuthProvider and QueryClientProvider)
function DeepLinkHandler() {
  const { user } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink)
    
    // Handle deep link when app is opened from closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        // Small delay to ensure auth is ready
        setTimeout(() => handleDeepLink({ url }), 500)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [user])

  const handleDeepLink = async ({ url }: { url: string }) => {
    logger.debug('Deep link received', { url })
    
    // Check if it's an attendance QR code
    if (url.includes('mess-management://attendance') || url.includes('mess://attendance')) {
      if (!user?.id) {
        // User not logged in - navigate to login first
        logger.info('User not authenticated, redirecting to login')
        router.push('/(auth)/login')
        return
      }

      // Mark attendance
      try {
        logger.info('Marking attendance from deep link', { userId: user.id })
        const result = await markAttendanceFromQR(user.id)
        
        // Invalidate attendance queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['today-attendance'] })
        await queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
        
        // Navigate to dashboard if not already there
        const currentRoute = segments[segments.length - 1]
        if (currentRoute !== 'dashboard') {
          router.push('/(student)/(tabs)/dashboard')
        }
        
        // Show result message
        if (result.success) {
          Alert.alert(
            'Attendance Marked',
            result.message,
            [{ text: 'OK' }]
          )
        } else {
          Alert.alert(
            'Attendance Not Marked',
            result.message,
            [{ text: 'OK' }]
          )
        }
      } catch (error) {
        logger.error('Error marking attendance from deep link', error as Error, { userId: user.id })
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Unable to mark attendance. Please try again.',
          [{ text: 'OK' }]
        )
      }
    }
  }

  return null // This component doesn't render anything
}

// Inner layout that has access to both providers
function InnerLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DeepLinkHandler />
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(student)" />
          </Stack>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={lightTheme}>
            <InnerLayout />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

