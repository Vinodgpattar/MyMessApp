import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions, Camera } from 'expo-camera'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Text } from 'react-native-paper'
import { validateQRCode } from '@/lib/qr-attendance'
import { logger } from '@/lib/logger'

interface QRScannerProps {
  onScan: (qrData: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Manual permission request on mount (FIX for SDK 54)
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync()
        logger.debug('Camera permission status', { status })
        
        if (status !== 'granted') {
          setCameraError('Camera permission not granted')
          Alert.alert(
            'Permission Required',
            'Camera permission is required to scan QR codes. Please enable it in settings.',
            [
              { text: 'Cancel', onPress: onClose, style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          )
        }
      } catch (error) {
        logger.error('Error requesting camera permission', error as Error)
        setCameraError('Failed to request camera permission')
      }
    }

    requestCameraPermission()
  }, [onClose])

  // Reset when component mounts
  useEffect(() => {
    setScanned(false)
    setCameraReady(false)
    setCameraError(null)
  }, [])

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)

    if (validateQRCode(data)) {
      onScan(data)
    } else {
      Alert.alert(
        'Invalid QR Code',
        'Please scan the mess attendance QR code.',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Close', onPress: onClose, style: 'cancel' },
        ]
      )
    }
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>
          Requesting camera permission...
        </Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#9CA3AF" />
        <Text style={styles.permissionText}>
          Camera permission required
        </Text>
        <Text style={styles.permissionSubtext}>
          Please grant camera permission to scan QR codes
        </Text>
        <Button mode="contained" onPress={requestPermission} style={styles.button}>
          Grant Permission
        </Button>
        <Button mode="text" onPress={onClose} style={styles.button}>
          Cancel
        </Button>
      </View>
    )
  }

  if (cameraError) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>
          Camera Error
        </Text>
        <Text style={styles.errorSubtext}>
          {cameraError}
        </Text>
        <Button mode="contained" onPress={onClose} style={styles.button} buttonColor="#EF4444">
          Close
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
        onCameraReady={() => {
          setCameraReady(true)
          logger.debug('Camera ready')
        }}
        onError={(error) => {
          logger.error('Camera error', error as Error)
          setCameraError(error.message || 'Camera failed to initialize')
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Button mode="text" onPress={onClose} icon="close" textColor="#FFFFFF">
              Close
            </Button>
          </View>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Point camera at QR code
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#7B2CBF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  permissionSubtext: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#999',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 20,
    color: '#FFFFFF',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#EF4444',
  },
  errorSubtext: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#999',
    paddingHorizontal: 32,
  },
  button: {
    marginVertical: 8,
  },
})
