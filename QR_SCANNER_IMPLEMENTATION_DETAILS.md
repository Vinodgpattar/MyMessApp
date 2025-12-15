# QR Scanner Implementation - Complete Details

## Overview
This document provides complete implementation details of the QR code scanner for attendance marking in the mess-management-mobile app.

## Table of Contents
1. [Architecture](#architecture)
2. [Dependencies](#dependencies)
3. [File Structure](#file-structure)
4. [Implementation Details](#implementation-details)
5. [QR Code Format](#qr-code-format)
6. [Flow Diagram](#flow-diagram)
7. [Permission Handling](#permission-handling)
8. [Error Handling](#error-handling)
9. [Common Issues](#common-issues)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### Component Hierarchy
```
QRScannerScreen (src/app/(student)/qr-scanner.tsx)
  └── QRScanner (src/components/qr-scanner/QRScanner.tsx)
      └── CameraView (expo-camera)
  └── QRResultModal (src/components/qr-scanner/QRResultModal.tsx)
```

### Data Flow
1. User opens QR scanner screen
2. Camera permission requested
3. CameraView initializes
4. QR code scanned → `handleBarCodeScanned` called
5. QR code validated → `validateQRCode()`
6. Attendance marked → `markAttendanceFromQR()`
7. Result displayed → `QRResultModal`
8. Queries invalidated → Refresh attendance data

---

## Dependencies

### Package Versions
```json
{
  "expo": "~54.0.0",
  "expo-camera": "~17.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5"
}
```

### Key Dependencies
- `expo-camera@~17.0.9` - Camera and barcode scanning
- `@supabase/supabase-js@^2.76.1` - Database operations
- `@tanstack/react-query@^5.90.7` - Data fetching and caching
- `expo-router@^6.0.14` - Navigation

---

## File Structure

```
mess-management-mobile/
├── src/
│   ├── app/
│   │   └── (student)/
│   │       └── qr-scanner.tsx          # Main scanner screen
│   ├── components/
│   │   └── qr-scanner/
│   │       ├── QRScanner.tsx           # Camera component
│   │       └── QRResultModal.tsx       # Result display modal
│   └── lib/
│       └── qr-attendance.ts           # Attendance marking logic
├── app.json                            # Expo configuration
└── package.json                        # Dependencies
```

---

## Implementation Details

### 1. QR Scanner Screen (`src/app/(student)/qr-scanner.tsx`)

**Purpose:** Main screen that orchestrates QR scanning and attendance marking

**Key Features:**
- Handles navigation and router safety checks
- Manages loading state during attendance marking
- Invalidates React Query cache after successful scan
- Displays result modal

**Code Structure:**
```typescript
export default function QRScannerScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MarkAttendanceResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  // Fetch student data
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

  // Handle QR scan
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

  // Navigation handlers with safety checks
  const handleClose = useCallback(() => {
    if (!router) return
    try {
      router.back()
    } catch (error) {
      router.replace('/(student)/(tabs)').catch(() => {})
    }
  }, [router])
}
```

**Important Notes:**
- Router safety checks prevent crashes if router is undefined
- Loading overlay shown during attendance marking
- Query invalidation ensures UI updates after scan

---

### 2. QR Scanner Component (`src/components/qr-scanner/QRScanner.tsx`)

**Purpose:** Camera component that handles QR code scanning

**Key Features:**
- Camera permission management (dual approach)
- QR code scanning with multiple barcode types
- Visual scanning frame overlay
- Error handling and recovery

**Code Structure:**
```typescript
export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Manual permission request (FIX for SDK 54)
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

  // Handle barcode scan
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

  // Render CameraView
  return (
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
      {/* Overlay UI */}
    </CameraView>
  )
}
```

**Important Notes:**
- **Dual Permission Request:** Uses both `useCameraPermissions()` hook AND manual `Camera.requestCameraPermissionsAsync()` (fix for SDK 54)
- **Scanned State:** Prevents multiple scans of same QR code
- **Barcode Types:** Supports multiple types for better compatibility
- **Error Callbacks:** `onCameraReady` and `onError` for debugging

---

### 3. QR Code Validation (`src/lib/qr-attendance.ts`)

**Purpose:** Validates QR code format before processing

**Accepted Formats:**
```typescript
export function validateQRCode(qrData: string): boolean {
  if (!qrData || typeof qrData !== 'string') return false
  
  const trimmed = qrData.trim()
  
  // Primary format
  if (trimmed === 'mess-management://attendance') return true
  
  // Backward compatibility
  if (trimmed === 'mess://attendance') return true
  
  // URL format (backward compatible)
  if (qrData.includes('/attendance/mobile')) return true
  
  return false
}
```

**Valid QR Code Values:**
- `mess-management://attendance` (primary)
- `mess://attendance` (backward compatible)
- Any URL containing `/attendance/mobile` (backward compatible)

---

### 4. Attendance Marking Logic (`src/lib/qr-attendance.ts`)

**Function:** `markAttendanceFromQR(userId: string)`

**Flow:**
1. Get student data by userId
2. Check current meal time (with grace periods)
3. Validate student plan includes meal
4. Check plan is active (not expired, has started)
5. Check if attendance already exists for today
6. Check if meal already marked
7. Insert or update attendance record
8. Return success/error result

**Meal Time Windows:**
```typescript
// Breakfast: 7:00 AM - 11:00 AM (grace: 30 min before/after)
// Normal: 7:30 AM - 10:30 AM
// Grace: 7:00-7:30 AM, 10:30-11:00 AM

// Lunch: 12:00 PM - 4:00 PM (grace: 30 min before/after)
// Normal: 12:30 PM - 3:30 PM
// Grace: 12:00-12:30 PM, 3:30-4:00 PM

// Dinner: 7:00 PM - 11:00 PM (grace: 30 min before/after)
// Normal: 7:30 PM - 10:30 PM
// Grace: 7:00-7:30 PM, 10:30-11:00 PM
```

**Database Operations:**
```typescript
// Check existing attendance
const { data: existing } = await supabase
  .from('Attendance')
  .select('id, breakfast, lunch, dinner')
  .eq('studentId', student.id)
  .eq('date', todayStr)
  .maybeSingle()

// Update existing record
if (existing) {
  await supabase
    .from('Attendance')
    .update(attendanceData)
    .eq('id', existing.id)
} else {
  // Insert new record
  await supabase
    .from('Attendance')
    .insert(attendanceData)
}
```

---

## QR Code Format

### Expected QR Code Content
The QR code should contain one of these values:
- `mess-management://attendance` (recommended)
- `mess://attendance` (backward compatible)
- Any URL containing `/attendance/mobile` (backward compatible)

### QR Code Generation
QR codes can be generated using any QR code generator with the above text content.

**Example using `react-native-qrcode-svg`:**
```typescript
import QRCode from 'react-native-qrcode-svg'

<QRCode
  value="mess-management://attendance"
  size={200}
/>
```

---

## Flow Diagram

```
User Opens Scanner
    ↓
Check Router Available
    ↓
Request Camera Permission
    ↓
Permission Granted? ──No──→ Show Permission UI
    ↓ Yes
Initialize CameraView
    ↓
Camera Ready? ──No──→ Show Error
    ↓ Yes
Wait for QR Scan
    ↓
QR Code Scanned
    ↓
Validate QR Format ──Invalid──→ Show Error, Reset Scan
    ↓ Valid
Call markAttendanceFromQR()
    ↓
Get Student Data
    ↓
Check Meal Time ──Outside──→ Return Error
    ↓ Valid
Check Plan Includes Meal ──No──→ Return Error
    ↓ Yes
Check Plan Active ──No──→ Return Error
    ↓ Yes
Check Existing Attendance
    ↓
Meal Already Marked? ──Yes──→ Return Success (already marked)
    ↓ No
Insert/Update Attendance
    ↓
Success? ──No──→ Return Error
    ↓ Yes
Invalidate Queries
    ↓
Show Success Modal
    ↓
User Closes Modal
    ↓
Navigate Back
```

---

## Permission Handling

### Android Permissions (`app.json`)
```json
{
  "android": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO"
    ]
  }
}
```

### Expo Camera Plugin (`app.json`)
```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan QR codes for attendance."
      }
    ]
  ]
}
```

### Permission Request Flow
1. **Hook-based:** `useCameraPermissions()` - Automatic permission state
2. **Manual:** `Camera.requestCameraPermissionsAsync()` - Explicit request (SDK 54 fix)
3. **Fallback:** Alert with "Open Settings" option if denied

### Permission States
- `null` - Permission status not yet determined
- `granted: false` - Permission denied, show request UI
- `granted: true` - Permission granted, show camera

---

## Error Handling

### Camera Errors
```typescript
onError={(error) => {
  logger.error('Camera error', error as Error)
  setCameraError(error.message || 'Camera failed to initialize')
}}
```

### Common Error Scenarios

1. **Camera Permission Denied**
   - Shows permission request UI
   - Option to open device settings

2. **Camera Initialization Failed**
   - Shows error message
   - Option to close and retry

3. **Invalid QR Code**
   - Alert with "Try Again" option
   - Resets scanned state

4. **Attendance Marking Failed**
   - Shows error in result modal
   - User can retry

5. **Network/Database Errors**
   - Logged with context
   - User-friendly error message shown

---

## Common Issues

### Issue 1: Camera Not Opening
**Symptoms:**
- Black screen
- Camera preview not showing
- `onCameraReady` never fires

**Possible Causes:**
1. Permission not granted
2. Camera hardware issue
3. Another app using camera
4. Expo SDK 54 + modal presentation bug (fixed by removing `fullScreenModal`)

**Solutions:**
- Check permission status in logs
- Verify camera works in other apps
- Close other camera apps
- Ensure no modal presentation wrapper

### Issue 2: QR Code Not Scanning
**Symptoms:**
- Camera shows but QR not detected
- No `handleBarCodeScanned` called

**Possible Causes:**
1. QR code format incorrect
2. Camera focus issue
3. Lighting too dim/bright
4. QR code too small/far

**Solutions:**
- Verify QR code contains `mess-management://attendance`
- Improve lighting
- Move closer to QR code
- Ensure QR code is clear and not damaged

### Issue 3: Attendance Not Marking
**Symptoms:**
- QR scanned successfully
- But attendance not saved

**Possible Causes:**
1. Student not found
2. Meal time outside window
3. Plan expired/not started
4. Database error
5. RLS policy blocking

**Solutions:**
- Check console logs for specific error
- Verify student has `user_id` in Student table
- Check current time is within meal window
- Verify plan dates are correct
- Check RLS policies allow student to insert attendance

### Issue 4: Multiple Scans
**Symptoms:**
- Same QR code scanned multiple times
- Multiple attendance records created

**Solution:**
- `scanned` state prevents multiple scans
- Database check prevents duplicate records
- Already marked check shows message

---

## Troubleshooting

### Step 1: Check Camera Permission
```typescript
// In QRScanner component
console.log('Permission status:', permission)
console.log('Permission granted:', permission?.granted)
```

### Step 2: Check Camera Initialization
```typescript
// Look for these logs:
[DEBUG] Camera permission status { status: 'granted' }
[DEBUG] Camera ready
```

### Step 3: Check QR Code Validation
```typescript
// Test QR code format
validateQRCode('mess-management://attendance') // Should return true
validateQRCode('invalid') // Should return false
```

### Step 4: Check Attendance Marking
```typescript
// Check logs for:
[DEBUG] Marking attendance for user: USER_ID
[ERROR] Error marking attendance: ERROR_MESSAGE
```

### Step 5: Verify Database
```sql
-- Check if attendance was created
SELECT * FROM "Attendance" 
WHERE "studentId" = STUDENT_ID 
AND date = CURRENT_DATE;

-- Check student exists
SELECT id, name, "user_id" FROM "Student" WHERE id = STUDENT_ID;
```

### Step 6: Check RLS Policies
```sql
-- Verify students can insert attendance
SELECT * FROM pg_policies 
WHERE tablename = 'Attendance' 
AND cmd = 'INSERT';
```

---

## Configuration

### app.json - Camera Plugin
```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan QR codes for attendance."
      }
    ]
  ]
}
```

### Android Permissions
```json
{
  "android": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO"
    ]
  }
}
```

### Navigation Route
- Path: `/(student)/qr-scanner`
- No modal presentation (removed to fix SDK 54 camera bug)

---

## Testing Checklist

- [ ] Camera permission requested on first open
- [ ] Camera preview shows correctly
- [ ] QR code scans successfully
- [ ] Invalid QR code shows error
- [ ] Attendance marks successfully
- [ ] Already marked shows message
- [ ] Outside meal time shows error
- [ ] Expired plan shows error
- [ ] Result modal displays correctly
- [ ] Navigation back works
- [ ] Attendance history updates after scan

---

## Known Issues & Workarounds

### Issue: Expo SDK 54 + Modal Presentation
**Problem:** `CameraView` doesn't work inside `fullScreenModal` on Android
**Solution:** Removed modal presentation, use regular navigation

### Issue: Permission Not Requested Automatically
**Problem:** `useCameraPermissions()` hook doesn't always request on SDK 54
**Solution:** Added manual `Camera.requestCameraPermissionsAsync()` call

### Issue: Camera Stays Black
**Problem:** Camera preview doesn't show
**Solution:** Check permission status, ensure no other app using camera

---

## Debugging Commands

### Check Camera Permission
```bash
# Android
adb shell dumpsys package com.messmanagement.mobile | grep permission

# Check logs
npx expo start --clear
```

### Test QR Code
```javascript
// In browser console or test file
validateQRCode('mess-management://attendance') // true
validateQRCode('mess://attendance') // true
validateQRCode('invalid') // false
```

### Check Database
```sql
-- Recent attendance records
SELECT * FROM "Attendance" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Student attendance today
SELECT * FROM "Attendance" 
WHERE "studentId" = STUDENT_ID 
AND date = CURRENT_DATE;
```

---

## Code Snippets

### Complete QR Scanner Component
See: `src/components/qr-scanner/QRScanner.tsx` (272 lines)

### Complete Attendance Marking
See: `src/lib/qr-attendance.ts` (230 lines)

### Complete Scanner Screen
See: `src/app/(student)/qr-scanner.tsx` (136 lines)

---

## Summary

**Key Points:**
1. Uses `expo-camera@17.0.9` with `CameraView` component
2. Dual permission request (hook + manual) for SDK 54 compatibility
3. QR code format: `mess-management://attendance`
4. Attendance marking validates meal time, plan, and student status
5. No modal presentation (fixes SDK 54 camera bug)
6. Comprehensive error handling and logging
7. Query invalidation ensures UI updates

**Critical Configuration:**
- `expo-camera` plugin in `app.json`
- Android `CAMERA` permission
- No `fullScreenModal` presentation
- Manual permission request in `useEffect`

---

## Next Steps for Debugging

1. Check console logs for permission status
2. Verify camera opens in other apps
3. Test QR code format manually
4. Check database for attendance records
5. Verify RLS policies
6. Test with different devices
7. Check Expo SDK 54 + expo-camera compatibility



