import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator as RNActivityIndicator, Text as RNText } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { markAttendanceFromQR, MarkAttendanceResult } from '@/lib/qr-attendance'
import { QRScanner } from '@/components/qr-scanner/QRScanner'
import { QRResultModal } from '@/components/qr-scanner/QRResultModal'

export default function QRScannerScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MarkAttendanceResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const { data: studentData } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const result = await getStudentByUserId(user.id)
      if (result.error) throw result.error
      return result.student
    },
    enabled: !!user?.id,
  })

  const handleScan = useCallback(async (qrData: string) => {
    if (!user?.id) {
      setResult({
        success: false,
        message: 'User not authenticated. Please log in again.',
      })
      setShowResult(true)
      return
    }

    setLoading(true)
    try {
      const result = await markAttendanceFromQR(user.id)
      setResult(result)
      setShowResult(true)
      // Invalidate attendance queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['today-attendance', studentData?.id] })
      await queryClient.invalidateQueries({ queryKey: ['attendance-history', studentData?.id] })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unable to mark attendance. Please try again.',
      })
      setShowResult(true)
    } finally {
      setLoading(false)
    }
  }, [user?.id, studentData?.id, queryClient])

  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  const handleCloseResult = useCallback(() => {
    setShowResult(false)
    setResult(null)
    router.back()
  }, [router])

  return (
    <View style={styles.container}>
      <QRScanner onScan={handleScan} onClose={handleClose} />
      {loading && (
        <View style={styles.loadingOverlay}>
          <RNActivityIndicator size="large" color="#7B2CBF" />
          <RNText style={styles.loadingText}>Marking attendance...</RNText>
        </View>
      )}
      <QRResultModal visible={showResult} result={result} onClose={handleCloseResult} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
})

