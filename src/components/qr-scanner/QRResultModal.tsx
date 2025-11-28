import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Modal as RNModal } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { MarkAttendanceResult } from '@/lib/qr-attendance'

interface QRResultModalProps {
  visible: boolean
  result: MarkAttendanceResult | null
  onClose: () => void
}

export function QRResultModal({ visible, result, onClose }: QRResultModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible && result) {
      scaleAnim.setValue(0)
      opacityAnim.setValue(0)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, result])

  if (!result) return null

  const isSuccess = result.success
  const iconColor = isSuccess ? '#10B981' : '#EF4444'
  const bgColor = isSuccess ? '#F0FDF4' : '#FEF2F2'
  const borderColor = isSuccess ? '#10B981' : '#EF4444'

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.card, { backgroundColor: bgColor, borderColor }]}>
          <View style={styles.iconContainer}>
            {isSuccess ? (
              <View style={styles.successIcon}>
                <MaterialCommunityIcons name="check-circle" size={64} color={iconColor} />
              </View>
            ) : (
              <View style={styles.errorIcon}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={iconColor} />
              </View>
            )}
          </View>

          <Text variant="headlineSmall" style={[styles.title, { color: iconColor }]}>
            {isSuccess ? 'Attendance Marked!' : 'Unable to Mark Attendance'}
          </Text>

          <Text variant="bodyLarge" style={styles.message}>
            {result.message}
          </Text>

          {isSuccess && result.meal && (
            <View style={styles.mealInfo}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#10B981" />
              <Text variant="bodyMedium" style={styles.mealText}>
                {result.meal.charAt(0).toUpperCase() + result.meal.slice(1)} marked
              </Text>
            </View>
          )}

          <Button mode="contained" onPress={onClose} style={styles.button} buttonColor={iconColor}>
            {isSuccess ? 'Done' : 'OK'}
          </Button>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#374151',
    lineHeight: 24,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  mealText: {
    color: '#10B981',
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    minWidth: 120,
  },
})
