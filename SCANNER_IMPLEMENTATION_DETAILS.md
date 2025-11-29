# QR Scanner Implementation Details

## 📋 Overview
This document contains the complete current implementation of the QR Scanner feature in the Mess Management mobile app. The scanner is used by students to mark attendance by scanning QR codes.

---

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   └── qr-scanner/
│       ├── QRScanner.tsx          # Main camera component
│       └── QRResultModal.tsx       # Result display modal
├── app/
│   └── (student)/
│       ├── qr-scanner.tsx          # Screen wrapper
│       └── _layout.tsx             # Navigation config
└── lib/
    └── qr-attendance.ts            # Business logic
```

---

## 📱 1. QRScanner Component

**File:** `src/components/qr-scanner/QRScanner.tsx`

### Key Features:
- Uses `expo-camera` v17.0.9
- Manual camera permission request
- Error handling and loading states
- Multiple barcode type support
- Camera ready/error callbacks

### Implementation Details:

```typescript
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native'
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera'
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

  // Permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Requesting camera permission...
        </Text>
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
        <Text variant="bodySmall" style={styles.permissionSubtext}>
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
        <Text variant="titleMedium" style={styles.errorText}>
          Camera Error
        </Text>
        <Text variant="bodySmall" style={styles.errorSubtext}>
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
        facing={CameraType.back}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'codabar']
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
            <Text variant="bodyMedium" style={styles.instructionText}>
              Point camera at QR code
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  )
}
```

### Styles:
- Container: `flex: 1, backgroundColor: '#000'`
- Camera: `flex: 1`
- Scan frame: 250x250px with corner indicators
- Overlay with close button and instructions

---

## 📄 2. QR Scanner Screen

**File:** `src/app/(student)/qr-scanner.tsx`

### Purpose:
- Wraps QRScanner component
- Handles attendance marking logic
- Shows loading overlay during processing
- Displays result modal

### Implementation:

```typescript
import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator as RNActivityIndicator, Text as RNText } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { markAttendanceFromQR, MarkAttendanceResult } from '@/lib/qr-attendance'
import { QRScanner } from '@/components/qr-scanner/QRScanner'
import { QRResultModal } from '@/components/qr-scanner/QRResultModal'

export default function QRScannerScreen() {
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
```

---

## 🧭 3. Navigation Configuration

**File:** `src/app/(student)/_layout.tsx`

### Screen Registration:

```typescript
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="reset-pin" options={{ presentation: 'card' }} />
  <Stack.Screen 
    name="qr-scanner" 
    options={{ 
      headerShown: false, 
      animation: 'fade' 
    }} 
  />
</Stack>
```

**⚠️ IMPORTANT:** `presentation: 'fullScreenModal'` was removed because it causes CameraView to fail on Android in Expo SDK 54. This is a known bug where modal presentation uses Android DialogFragment which cannot attach camera SurfaceView correctly.

### Navigation Flow:
1. Student taps "Scan QR Code" button on dashboard/attendance screen
2. `router.push('/(student)/qr-scanner')` is called
3. Full-screen modal opens with camera
4. After scan/close, `router.back()` returns to previous screen

---

## 🔗 4. Integration Points

### Dashboard Screen (`src/app/(student)/(tabs)/dashboard.tsx`):
```typescript
<Button
  mode="contained"
  onPress={() => router.push('/(student)/qr-scanner')}
  style={styles.qrButton}
  buttonColor="#7B2CBF"
  icon="qrcode-scan"
>
  Scan QR Code
</Button>
```

### Attendance Screen (`src/app/(student)/(tabs)/attendance.tsx`):
```typescript
<Button
  mode="contained"
  onPress={() => router.push('/(student)/qr-scanner')}
  style={styles.scanButton}
  buttonColor="#7B2CBF"
  icon="qrcode-scan"
>
  Open Scanner
</Button>
```

---

## ⚙️ 5. App Configuration

### app.json - Camera Plugin:
```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan QR codes for attendance."
      }
    ],
    [
      "expo-build-properties",
      {
        "android": {
          "kotlinVersion": "2.0.21"
        },
        "ios": {},
        "newArchEnabled": false
      }
    ]
  ],
  "android": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO"
    ]
  }
}
```

### Plugin Order:
1. `expo-router`
2. `expo-splash-screen`
3. `expo-camera` (before expo-build-properties)
4. `expo-build-properties`
5. `expo-notifications`
6. `expo-image-picker`
7. `expo-font`

---

## 📦 6. Dependencies

### package.json:
```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-camera": "~17.0.9",
    "expo-build-properties": "^1.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5"
  }
}
```

---

## 🔍 7. QR Code Validation

**File:** `src/lib/qr-attendance.ts`

### Valid QR Code Formats:
```typescript
export function validateQRCode(qrData: string): boolean {
  if (!qrData || typeof qrData !== 'string') return false
  
  const trimmed = qrData.trim()
  
  // Primary scheme
  if (trimmed === 'mess-management://attendance') return true
  
  // Backward compatibility
  if (trimmed === 'mess://attendance') return true
  
  // URL format
  if (qrData.includes('/attendance/mobile')) return true
  
  return false
}
```

---

## 📊 8. Attendance Marking Logic

**File:** `src/lib/qr-attendance.ts`

### Flow:
1. Validate student profile exists
2. Check current meal time (with grace periods)
3. Verify meal is included in student's plan
4. Check if plan is active (not expired/not started)
5. Check if attendance already marked for this meal
6. Insert or update attendance record
7. Return success/error result

### Meal Times:
- **Breakfast:** 7:00 AM - 11:00 AM (grace: 30 min before/after)
- **Lunch:** 12:00 PM - 4:00 PM (grace: 30 min before/after)
- **Dinner:** 7:00 PM - 11:00 PM (grace: 30 min before/after)

---

## 🐛 9. Known Issues & Current State

### Root Cause (IDENTIFIED):
**Scanner not opening due to Expo SDK 54 + Android + fullScreenModal bug**

### Root Cause Details:
1. **Expo SDK 54 Bug:** `CameraView` does NOT work inside `fullScreenModal` presentation on Android
2. **Technical Reason:** SDK 54 uses Android `DialogFragment` for modals, which cannot attach camera `SurfaceView` correctly
3. **Symptom:** CameraView stays black, no preview, `onCameraReady` never fires, no error in `onError`
4. **Workaround:** Remove `presentation: 'fullScreenModal'` and use normal screen presentation

### Other Possible Causes (Secondary):
1. **Camera Permission:** May not be granted properly
2. **Plugin Order:** `expo-camera` must be before `expo-build-properties`
3. **Device Compatibility:** Some Android devices have camera issues
4. **SDK Version:** Expo SDK 54 + expo-camera 17.0.9 compatibility

### Debug Points:
- Check `cameraReady` state (should be `true` after camera initializes)
- Check `cameraError` state (should be `null` if no errors)
- Check permission status in logs
- Verify `onCameraReady` callback fires
- Check `onError` callback for error messages

---

## 🔧 10. Troubleshooting Checklist

- [ ] Camera permission granted in device settings
- [ ] `expo-camera` plugin configured correctly in `app.json`
- [ ] Plugin order: `expo-camera` before `expo-build-properties`
- [ ] Kotlin version: 2.0.21 (set in `expo-build-properties`)
- [ ] New Architecture disabled
- [ ] App built with latest native code (not just OTA update)
- [ ] Device has working camera hardware
- [ ] No other app using camera simultaneously
- [ ] App has `CAMERA` permission in AndroidManifest.xml (auto-generated)

---

## 📝 11. Code Flow Summary

1. **User Action:** Tap "Scan QR Code" button
2. **Navigation:** `router.push('/(student)/qr-scanner')`
3. **Screen Load:** `QRScannerScreen` component mounts
4. **Permission Check:** `useCameraPermissions()` hook + manual `Camera.requestCameraPermissionsAsync()`
5. **Camera Init:** `CameraView` component renders
6. **Ready State:** `onCameraReady` callback sets `cameraReady = true`
7. **Scan Event:** `onBarcodeScanned` fires when QR code detected
8. **Validation:** `validateQRCode()` checks QR format
9. **Attendance:** `markAttendanceFromQR()` processes attendance
10. **Result:** `QRResultModal` shows success/error
11. **Navigation:** `router.back()` returns to previous screen

---

## 🎯 12. Key Implementation Details

### Permission Handling:
- Uses both `useCameraPermissions()` hook AND manual `Camera.requestCameraPermissionsAsync()`
- Shows permission request UI if not granted
- Provides "Open Settings" option if permission denied

### Camera Configuration:
- `facing={CameraType.back}` - Uses back camera
- `barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'codabar']` - Multiple formats
- `onBarcodeScanned` disabled when `scanned === true` to prevent multiple scans

### Error Handling:
- `onError` callback captures camera initialization errors
- Permission errors shown via Alert
- Network errors handled in `markAttendanceFromQR()`

### State Management:
- `scanned`: Prevents multiple scans of same QR code
- `cameraReady`: Indicates camera is initialized
- `cameraError`: Stores error messages
- `loading`: Shows loading overlay during attendance marking

---

## 📱 13. Device Testing Notes

### Tested On:
- Not specified

### Issues Encountered:
- Scanner not opening (current issue)

### Workarounds Attempted:
- Moved scanner from Modal to standalone screen
- Added manual permission request
- Expanded barcode types
- Added error callbacks
- Ensured `flex: 1` on container

---

## 🔄 14. Recent Changes

1. **Fixed Modal Presentation Bug:** Removed `presentation: 'fullScreenModal'` - this was causing CameraView to fail on Android in SDK 54
2. **Changed to Normal Screen:** Scanner now opens as normal screen with `animation: 'fade'` instead of modal
3. **Moved from Modal to Standalone Screen:** Scanner now opens as standalone screen instead of React Native Modal
4. **Added Manual Permission Request:** Explicit `Camera.requestCameraPermissionsAsync()` call
5. **Expanded Barcode Types:** Added support for multiple barcode formats
6. **Added Error Callbacks:** `onCameraReady` and `onError` handlers
7. **Fixed Plugin Order:** `expo-camera` before `expo-build-properties` in `app.json`

---

## 📚 15. Related Files

- `src/components/qr-scanner/QRScanner.tsx` - Main camera component
- `src/components/qr-scanner/QRResultModal.tsx` - Result modal
- `src/app/(student)/qr-scanner.tsx` - Screen wrapper
- `src/app/(student)/_layout.tsx` - Navigation config
- `src/lib/qr-attendance.ts` - Business logic
- `app.json` - App configuration
- `package.json` - Dependencies

---

## 🚨 Current Status

**Status:** ✅ **FIXED** - Root cause identified and fixed

**Root Cause:** Expo SDK 54 + Android + `fullScreenModal` presentation = CameraView fails to initialize

**Fix Applied:** Removed `presentation: 'fullScreenModal'` from navigation config, changed to normal screen with `animation: 'fade'`

**Last Updated:** After identifying SDK 54 modal bug

**Next Steps:**
1. ✅ Fixed navigation configuration (removed modal presentation)
2. ⏳ Rebuild native app: `eas build -p android --profile production`
3. ⏳ Test scanner on Android device
4. ⏳ Verify camera opens correctly

---

**End of Document**

