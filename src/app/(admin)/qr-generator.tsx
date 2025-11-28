import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQRCode } from '@/hooks/useQRCode'
import { QRCodeDisplay } from '@/components/qr-code/QRCodeDisplay'
import { QRCodeInfo } from '@/components/qr-code/QRCodeInfo'
import { QRCodeActions } from '@/components/qr-code/QRCodeActions'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function QRGeneratorScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch, isRefetching } = useQRCode()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const handleRefresh = async () => {
    try {
      await refetch()
      setSnackbarMessage('QR code refreshed successfully')
      setSnackbarVisible(true)
    } catch (error) {
      setSnackbarMessage('Failed to refresh QR code')
      setSnackbarVisible(true)
    }
  }

  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="qrcode" size={24} color="#7B2CBF" />
            </View>
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.title}>
                QR Code Generator
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Display at mess entrance for students to scan
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* QR Code Display */}
        <QRCodeDisplay
          qrCode={data?.qrCode || null}
          loading={isLoading}
          error={error || null}
        />

        {/* QR Code Info (URL) */}
        {data?.url && (
          <QRCodeInfo url={data.url} />
        )}

        {/* Action Buttons */}
        {data?.qrCode && (
          <QRCodeActions
            qrCode={data.qrCode}
            onRefresh={handleRefresh}
            refreshing={isRefetching}
          />
        )}

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <View style={styles.instructionsContainer}>
              <MaterialCommunityIcons 
                name="information" 
                size={24} 
                color="#6366f1" 
              />
              <View style={styles.instructionsText}>
                <Text variant="titleSmall" style={styles.instructionsTitle}>
                  How to Use
                </Text>
                <Text variant="bodySmall" style={styles.instructionsBody}>
                  Display this QR code at the mess entrance. Students can scan it with any QR code scanner to open the attendance page and mark their attendance.
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Retry Button (if error) */}
        {error && (
          <Card style={styles.retryCard}>
            <Card.Content>
              <View style={styles.retryContainer}>
                <Text variant="bodyMedium" style={styles.retryText}>
                  Failed to generate QR code. Please try again.
                </Text>
                <View style={styles.retryButtonContainer}>
                  <MaterialCommunityIcons 
                    name="refresh" 
                    size={20} 
                    color="#7B2CBF" 
                  />
                  <Text 
                    variant="bodyMedium" 
                    style={styles.retryButton}
                    onPress={handleRefresh}
                  >
                    Retry
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#666',
  },
  instructionsCard: {
    marginTop: 8,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  instructionsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
  },
  instructionsTitle: {
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  instructionsBody: {
    color: '#075985',
    lineHeight: 20,
  },
  retryCard: {
    marginTop: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  retryContainer: {
    gap: 12,
  },
  retryText: {
    color: '#92400e',
  },
  retryButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
})


