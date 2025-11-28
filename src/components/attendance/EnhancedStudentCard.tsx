import React from 'react'
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Text, Card, IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { StudentAttendance } from '@/lib/attendance'

interface EnhancedStudentCardProps {
  student: StudentAttendance
  onToggleMeal: (meal: 'breakfast' | 'lunch' | 'dinner') => void
  onMarkAll?: () => void
  onEdit?: () => void
  onDelete?: () => void
  loading?: boolean
  mealLoading?: 'breakfast' | 'lunch' | 'dinner' | null
}

export function EnhancedStudentCard({
  student,
  onToggleMeal,
  onMarkAll,
  onEdit,
  onDelete,
  loading = false,
  mealLoading = null,
}: EnhancedStudentCardProps) {
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
      return { text: 'Full', color: '#FFFFFF', bg: '#10B981' }
    }
    if (mealCount > 0) {
      return { text: 'Partial', color: '#FFFFFF', bg: '#F59E0B' }
    }
    return { text: 'None', color: '#FFFFFF', bg: '#EF4444' }
  }

  const status = getStatus()
  const eligibleMeals = ['breakfast', 'lunch', 'dinner'].filter(m => 
    isMealInPlan(m as 'breakfast' | 'lunch' | 'dinner')
  )
  const allMarked = eligibleMeals.every(meal => 
    student.attendance[meal as 'breakfast' | 'lunch' | 'dinner']
  )
  const hasAnyMarked = eligibleMeals.some(meal => 
    student.attendance[meal as 'breakfast' | 'lunch' | 'dinner']
  )

  const mealConfig = {
    breakfast: { label: 'B', color: '#F59E0B', bg: '#FEF3C7' },
    lunch: { label: 'L', color: '#3B82F6', bg: '#DBEAFE' },
    dinner: { label: 'D', color: '#6366F1', bg: '#E0E7FF' },
  }

  return (
    <Card
      style={[
        styles.card,
        hasAnyMarked && styles.hasAttendanceCard,
      ]}
      elevation={0}
    >
      <Card.Content style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
              {student.name}
            </Text>
            <Text variant="bodySmall" style={styles.rollNumber}>
              {student.rollNumber || 'No Roll Number'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text variant="labelSmall" style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        {/* Inline Meal Toggles */}
        <View style={styles.mealsContainer}>
          {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
            const isEligible = isMealInPlan(meal)
            const isMarked = student.attendance[meal]
            const isLoading = mealLoading === meal
            const config = mealConfig[meal]

            if (!isEligible) {
              return (
                <View
                  key={meal}
                  style={[styles.mealBadge, styles.mealBadgeIneligible]}
                >
                  <Text variant="labelSmall" style={styles.mealLabelIneligible}>
                    {config.label}
                  </Text>
                </View>
              )
            }

            return (
              <TouchableOpacity
                key={meal}
                style={[
                  styles.mealBadge,
                  isMarked ? [styles.mealBadgeMarked, { backgroundColor: config.color }] : [styles.mealBadgeUnmarked, { borderColor: config.color, backgroundColor: config.bg }],
                ]}
                onPress={() => !isLoading && onToggleMeal(meal)}
                activeOpacity={0.7}
                disabled={loading || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size={12} color={isMarked ? '#FFFFFF' : config.color} />
                ) : (
                  <>
                    {isMarked && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color="#FFFFFF"
                        style={styles.mealCheckIcon}
                      />
                    )}
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.mealLabel,
                        isMarked ? styles.mealLabelMarked : { color: config.color, fontWeight: '700' },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {onMarkAll && eligibleMeals.length > 1 && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.markAllButton]}
              onPress={onMarkAll}
              disabled={loading || allMarked}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.quickActionText,
                  allMarked && styles.quickActionTextDisabled,
                ]}
              >
                {allMarked ? 'All Marked' : 'Mark All'}
              </Text>
            </TouchableOpacity>
          )}

          {onEdit && (student.attendance.id && student.attendance.id > 0) && (
            <IconButton
              icon="pencil"
              size={18}
              iconColor="#6B7280"
              onPress={onEdit}
              style={styles.actionIcon}
            />
          )}

          {onDelete && (student.attendance.id && student.attendance.id > 0) && (
            <IconButton
              icon="delete"
              size={18}
              iconColor="#6B7280"
              onPress={onDelete}
              style={styles.actionIcon}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 0,
  },
  hasAttendanceCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  cardContent: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 14,
    marginBottom: 2,
  },
  rollNumber: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mealsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 44,
  },
  mealBadgeMarked: {
    borderColor: 'transparent',
  },
  mealBadgeUnmarked: {
    borderWidth: 2,
  },
  mealBadgeIneligible: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.4,
  },
  mealCheckIcon: {
    marginRight: -1,
  },
  mealLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  mealLabelMarked: {
    color: '#FFFFFF',
  },
  mealLabelUnmarked: {
    fontWeight: '700',
  },
  mealLabelIneligible: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  markAllButton: {
    flex: 1,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },
  quickActionTextDisabled: {
    color: '#9CA3AF',
  },
  actionIcon: {
    margin: 0,
  },
})

