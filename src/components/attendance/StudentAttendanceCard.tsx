import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card, IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { StudentAttendance } from '@/lib/attendance'

interface StudentAttendanceCardProps {
  student: StudentAttendance
  currentMeal: 'breakfast' | 'lunch' | 'dinner' | null
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function StudentAttendanceCard({
  student,
  currentMeal,
  onToggle,
  onEdit,
  onDelete,
}: StudentAttendanceCardProps) {
  // Helper to check if meal is in plan
  const isMealInPlan = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    return student.plan.meals.some((m) => m.toLowerCase().includes(meal))
  }

  const getStatus = () => {
    const { breakfast, lunch, dinner } = student.attendance
    const planMeals = student.plan.meals.map((m) => m.toLowerCase())
    
    // Only count meals that are in the student's plan
    const eligibleMeals = []
    if (planMeals.some(m => m.includes('breakfast'))) eligibleMeals.push(breakfast)
    if (planMeals.some(m => m.includes('lunch'))) eligibleMeals.push(lunch)
    if (planMeals.some(m => m.includes('dinner'))) eligibleMeals.push(dinner)
    
    const mealCount = eligibleMeals.filter(Boolean).length
    const totalEligibleMeals = eligibleMeals.length
    
    if (mealCount === totalEligibleMeals && totalEligibleMeals > 0) {
      return { text: 'Full', color: '#FFFFFF', bg: '#10B981', icon: 'check-circle' }
    }
    if (mealCount > 0) {
      return { text: 'Partial', color: '#FFFFFF', bg: '#F59E0B', icon: 'alert-circle' }
    }
    return { text: 'None', color: '#FFFFFF', bg: '#EF4444', icon: 'close-circle' }
  }

  const status = getStatus()
  const isEligible = currentMeal 
    ? isMealInPlan(currentMeal)
    : true

  const isPresent = currentMeal 
    ? student.attendance[currentMeal]
    : (() => {
        // Check only meals that are in the student's plan
        if (isMealInPlan('breakfast') && student.attendance.breakfast) return true
        if (isMealInPlan('lunch') && student.attendance.lunch) return true
        if (isMealInPlan('dinner') && student.attendance.dinner) return true
        return false
      })()

  if (!isEligible) {
    return (
      <Card style={[styles.card, styles.ineligibleCard]}>
        <Card.Content>
          <View style={styles.content}>
            <View style={styles.info}>
              <Text variant="titleMedium" style={styles.name}>
                {student.name}
              </Text>
              <Text variant="bodySmall" style={styles.rollNumber}>
                {student.rollNumber || 'No Roll Number'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                <MaterialCommunityIcons name="information" size={12} color="#6B7280" />
                <Text variant="labelSmall" style={styles.statusText}>
                  Not eligible for {currentMeal}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card
      style={[
        styles.card,
        isPresent && styles.presentCard,
        !isPresent && styles.missingCard,
      ]}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.content}>
          <View style={styles.info}>
            <View style={styles.headerRow}>
              <View style={styles.nameContainer}>
                <Text variant="titleMedium" style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                  {student.name}
                </Text>
                <Text variant="bodySmall" style={styles.rollNumber}>
                  {student.rollNumber || 'No Roll Number'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <MaterialCommunityIcons name={status.icon} size={12} color={status.color} />
                <Text variant="labelSmall" style={[styles.statusText, { color: status.color }]}>
                  {status.text}
                </Text>
              </View>
            </View>

            {/* Meal indicators - Only show meals in student's plan */}
            <View style={styles.meals}>
              {isMealInPlan('breakfast') && (
                <View style={[styles.mealBadge, student.attendance.breakfast && styles.mealBadgeActive]}>
                  <MaterialCommunityIcons
                    name={student.attendance.breakfast ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={student.attendance.breakfast ? '#10B981' : '#9CA3AF'}
                  />
                  <Text variant="labelSmall" style={[styles.mealLabel, student.attendance.breakfast && styles.mealLabelActive]}>
                    B
                  </Text>
                </View>
              )}
              {isMealInPlan('lunch') && (
                <View style={[styles.mealBadge, student.attendance.lunch && styles.mealBadgeActive]}>
                  <MaterialCommunityIcons
                    name={student.attendance.lunch ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={student.attendance.lunch ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text variant="labelSmall" style={[styles.mealLabel, student.attendance.lunch && styles.mealLabelActive]}>
                    L
                  </Text>
                </View>
              )}
              {isMealInPlan('dinner') && (
                <View style={[styles.mealBadge, student.attendance.dinner && styles.mealBadgeActive]}>
                  <MaterialCommunityIcons
                    name={student.attendance.dinner ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={student.attendance.dinner ? '#6366F1' : '#9CA3AF'}
                  />
                  <Text variant="labelSmall" style={[styles.mealLabel, student.attendance.dinner && styles.mealLabelActive]}>
                    D
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isPresent ? styles.presentButton : styles.missingButton,
              ]}
              onPress={onToggle}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isPresent ? 'check' : 'plus'}
                size={18}
                color="#FFF"
              />
              <Text style={styles.toggleText}>
                {isPresent ? 'Present' : 'Mark'}
              </Text>
            </TouchableOpacity>

            {onEdit && (student.attendance.id && student.attendance.id > 0) && (
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#6366F1"
                onPress={onEdit}
                style={styles.actionIcon}
              />
            )}
            {onDelete && (student.attendance.id && student.attendance.id > 0) && (
              <IconButton
                icon="delete"
                size={20}
                iconColor="#EF4444"
                onPress={onDelete}
                style={styles.actionIcon}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  presentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  missingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  ineligibleCard: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: '#9CA3AF',
  },
  cardContent: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '700',
    color: '#1A1A1A',
    fontSize: 16,
    marginBottom: 4,
  },
  rollNumber: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  meals: {
    flexDirection: 'row',
    gap: 8,
  },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  mealBadgeActive: {
    backgroundColor: '#E0F2FE',
  },
  mealLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  mealLabelActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presentButton: {
    backgroundColor: '#10B981',
  },
  missingButton: {
    backgroundColor: '#6366F1',
  },
  toggleText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionIcon: {
    margin: 0,
  },
})
