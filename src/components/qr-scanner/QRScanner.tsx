import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Text } from 'react-native-paper'
import { validateQRCode } from '@/lib/qr-attendance'

interface QRScannerProps {
  onScan: (qrData: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  // Reset when component mounts
  useEffect(() => {
    setScanned(false)
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
        <Text>Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#9CA3AF" />
        <Text variant="titleMedium" style={styles.permissionText}>
          Camera permission required
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={CameraType.back}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
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
            <Text variant="bodyMedium" style={styles.instructionText}>
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
    marginTop: 16,
    marginBottom: 24,
    color: '#666',
  },
  button: {
    marginVertical: 8,
  },
})
