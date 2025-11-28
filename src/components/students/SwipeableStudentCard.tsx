import React from 'react'
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Swipeable } from 'react-native-gesture-handler'
import { EnhancedStudentCard } from './EnhancedStudentCard'
import { Student } from '@/lib/students'

interface SwipeableStudentCardProps {
  student: Student
  onPress?: () => void
  onQuickPay?: () => void
  onQuickEmail?: () => void
  onQuickAttendance?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
}

export function SwipeableStudentCard({
  student,
  onPress,
  onQuickPay,
  onQuickEmail,
  onQuickAttendance,
  onEdit,
  onDelete,
  onViewDetails,
}: SwipeableStudentCardProps) {
  // Right actions (swipe left) - Quick actions menu
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    })

    return (
      <View style={styles.rightActions}>
        {onQuickEmail && (
          <TouchableOpacity
            style={[styles.actionButton, styles.emailAction]}
            onPress={onQuickEmail}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <MaterialCommunityIcons name="email" size={24} color="#FFFFFF" />
              <Text style={styles.actionLabel}>Email</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editAction]}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
              <Text style={styles.actionLabel}>Edit</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
        {onViewDetails && (
          <TouchableOpacity
            style={[styles.actionButton, styles.viewAction]}
            onPress={onViewDetails}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <MaterialCommunityIcons name="eye" size={24} color="#FFFFFF" />
              <Text style={styles.actionLabel}>View</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // Left actions (swipe right) - Quick payment
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    })

    if (!onQuickPay) return null

    return (
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.payAction]}
          onPress={onQuickPay}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <MaterialCommunityIcons name="cash-multiple" size={28} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Pay</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      rightThreshold={40}
      leftThreshold={40}
    >
      <EnhancedStudentCard
        student={student}
        onPress={onPress}
        onQuickPay={onQuickPay}
        onQuickEmail={onQuickEmail}
        onQuickAttendance={onQuickAttendance}
      />
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingRight: 16,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingLeft: 16,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  emailAction: {
    backgroundColor: '#10B981',
  },
  editAction: {
    backgroundColor: '#6366F1',
  },
  viewAction: {
    backgroundColor: '#7B2CBF',
  },
  payAction: {
    backgroundColor: '#7B2CBF',
    width: 100,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
})

