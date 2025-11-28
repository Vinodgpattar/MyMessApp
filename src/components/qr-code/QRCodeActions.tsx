import React, { useRef, useState } from 'react'
import { View, StyleSheet, Alert, Platform } from 'react-native'
import { Button, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import QRCode from 'react-native-qrcode-svg'


interface QRCodeActionsProps {
  qrCode: string | null
  onRefresh: () => void
  refreshing: boolean
}

export function QRCodeActions({ qrCode, onRefresh, refreshing }: QRCodeActionsProps) {
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const qrCodeRef = useRef<View>(null)
  const svgRef = useRef<any>(null)

  const captureQRCodeAsImage = async (): Promise<string> => {
    if (!qrCode) {
      throw new Error('QR code not available')
    }

    // Ensure the view is ready
    if (!qrCodeRef.current) {
      throw new Error('QR code view not ready. Please wait a moment and try again.')
    }

    // Wait longer to ensure the QR code is fully rendered
    await new Promise(resolve => setTimeout(resolve, 800))

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        // Capture the QR code view as an image - always use tmpfile for file URI
        const uri = await captureRef(qrCodeRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile', // This ensures we get a file:// URI
        })

        if (!uri || typeof uri !== 'string') {
          throw new Error('Failed to capture QR code: Invalid URI returned')
        }

        // Ensure it's a file URI
        if (!uri.startsWith('file://')) {
          throw new Error(`Invalid file URI: ${uri}`)
        }

        return uri
      } catch (error: any) {
        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('Failed to capture QR code image. Please try again.')
        }
        // Wait a bit longer before retrying
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    throw new Error('Failed to capture QR code after multiple attempts')
  }

  const handleDownload = async () => {
    if (!qrCode) {
      Alert.alert('Error', 'No QR code available to download')
      return
    }

    try {
      setDownloading(true)

      // Capture QR code as image - this should return a file:// URI
      const imageUri = await captureQRCodeAsImage()

      // Validate URI
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('Invalid image URI. Please try again.')
      }

      // Use sharing API to let user save the image
      const isAvailable = await Sharing.isAvailableAsync()
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: 'Save QR Code',
          UTI: 'public.png',
        })
      } else {
        // Fallback: Try to copy to a more permanent location
        try {
          const cacheDir = FileSystem.cacheDirectory
          if (cacheDir) {
            const filename = `qr-code-${Date.now()}.png`
            const permanentUri = `${cacheDir}${filename}`
            
            await FileSystem.copyAsync({
              from: imageUri,
              to: permanentUri,
            })

            Alert.alert(
              'Download Complete',
              `QR code saved to: ${permanentUri}`,
              [{ text: 'OK' }]
            )
          } else {
            Alert.alert(
              'Sharing Not Available',
              'Sharing is not available on this device.',
              [{ text: 'OK' }]
            )
          }
        } catch (fsError: any) {
          Alert.alert(
            'Error',
            'Unable to save QR code. Please try again.',
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to download QR code. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!qrCode) {
      Alert.alert('Error', 'No QR code available to share')
      return
    }

    try {
      setSharing(true)

      // Capture QR code as image - this should return a file:// URI
      const imageUri = await captureQRCodeAsImage()

      // Validate URI
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('Invalid image URI. Please try again.')
      }

      // Share the image
      const isAvailable = await Sharing.isAvailableAsync()
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share QR Code',
          UTI: 'public.png',
        })
      } else {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.',
          [{ text: 'OK' }]
        )
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to share QR code. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setSharing(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Hidden QR code view for capturing - must be rendered but off-screen */}
      {qrCode && (
        <View 
          style={styles.hiddenQRContainer} 
          collapsable={false} 
          ref={qrCodeRef}
          removeClippedSubviews={false}
          renderToHardwareTextureAndroid={true}
        >
          <QRCode
            value={qrCode}
            size={300}
            color="black"
            backgroundColor="white"
            quietZone={10}
          />
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleDownload}
        disabled={!qrCode || downloading}
        loading={downloading}
        icon="download"
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {downloading ? 'Downloading...' : 'Download QR Code'}
      </Button>

      <Button
        mode="contained"
        onPress={handleShare}
        disabled={!qrCode || sharing}
        loading={sharing}
        icon="share-variant"
        style={[styles.button, styles.shareButton]}
        contentStyle={styles.buttonContent}
      >
        {sharing ? 'Sharing...' : 'Share QR Code'}
      </Button>

      <Button
        mode="outlined"
        onPress={onRefresh}
        disabled={refreshing}
        loading={refreshing}
        icon="refresh"
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Refresh
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 16,
  },
  hiddenQRContainer: {
    position: 'absolute',
    opacity: 1, // Fully visible for capture (but positioned off-screen)
    pointerEvents: 'none',
    width: 300,
    height: 300,
    left: -1000, // Off-screen but still rendered
    top: -1000,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  button: {
    borderRadius: 8,
  },
  shareButton: {
    backgroundColor: '#6366f1',
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
