import React from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'

interface QRCodeDisplayProps {
  qrCode: string | null // QR code data string (e.g., "mess://attendance")
  loading: boolean
  error: Error | null
}

export function QRCodeDisplay({ qrCode, loading, error }: QRCodeDisplayProps) {
  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Generating QR Code...
            </Text>
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={48} 
              color="#ef4444" 
            />
            <Text variant="titleMedium" style={styles.errorTitle}>
              Error
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              {error.message || 'Failed to generate QR code'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (!qrCode) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="qrcode" 
              size={64} 
              color="#9ca3af" 
            />
            <Text variant="bodyMedium" style={styles.emptyText}>
              No QR code available
            </Text>
          </View>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.qrContainer}>
          <View style={styles.qrImageContainer}>
            <QRCode
              value={qrCode}
              size={300}
              color="black"
              backgroundColor="white"
              logo={undefined}
              logoSize={0}
              logoMargin={0}
              logoBackgroundColor="transparent"
              logoBorderRadius={0}
              quietZone={10}
            />
          </View>
          <View style={styles.instructionContainer}>
            <MaterialCommunityIcons 
              name="cellphone" 
              size={20} 
              color="#7B2CBF" 
            />
            <Text variant="bodyMedium" style={styles.instructionText}>
              Scan to mark attendance
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#ef4444',
    fontWeight: '600',
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#9ca3af',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrImageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrImage: {
    // QRCode component handles its own sizing
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
})


