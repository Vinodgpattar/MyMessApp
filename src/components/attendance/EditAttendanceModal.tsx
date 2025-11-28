import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Modal, Text, Button, Checkbox, Portal } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { StudentAttendance } from '@/lib/attendance'

interface EditAttendanceModalProps {
  visible: boolean
  onDismiss: () => void
  student: StudentAttendance | null
  date: string
  onSave: (data: { breakfast: boolean; lunch: boolean; dinner: boolean }) => void
  loading?: boolean
}

export function EditAttendanceModal({
  visible,
  onDismiss,
  student,
  date,
  onSave,
  loading = false,
}: EditAttendanceModalProps) {
  const [breakfast, setBreakfast] = useState(false)
  const [lunch, setLunch] = useState(false)
  const [dinner, setDinner] = useState(false)

  React.useEffect(() => {
    if (student) {
      setBreakfast(student.attendance.breakfast)
      setLunch(student.attendance.lunch)
      setDinner(student.attendance.dinner)
    }
  }, [student])

  // Helper function to check meal eligibility
  const isMealEligible = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    if (!student) return false
    return student.plan.meals.some((m) => m.toLowerCase().includes(meal))
  }

  const handleSave = () => {
    // Only save meals that are eligible for the student's plan
    onSave({ 
      breakfast: isMealEligible('breakfast') ? breakfast : false,
      lunch: isMealEligible('lunch') ? lunch : false,
      dinner: isMealEligible('dinner') ? dinner : false,
    })
  }

  const handleMarkAll = () => {
    setBreakfast(isMealEligible('breakfast'))
    setLunch(isMealEligible('lunch'))
    setDinner(isMealEligible('dinner'))
  }

  const handleUnmarkAll = () => {
    setBreakfast(false)
    setLunch(false)
    setDinner(false)
  }

  if (!student) return null

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Edit Attendance
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {student.name} - {new Date(date).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              onPress={handleMarkAll}
              style={styles.quickActionButton}
              compact
            >
              Mark All
            </Button>
            <Button
              mode="outlined"
              onPress={handleUnmarkAll}
              style={styles.quickActionButton}
              compact
            >
              Unmark All
            </Button>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              status={breakfast ? 'checked' : 'unchecked'}
              onPress={() => {
                if (isMealEligible('breakfast')) {
                  setBreakfast(!breakfast)
                }
              }}
              disabled={!isMealEligible('breakfast')}
            />
            <View style={styles.checkboxInfo}>
              <View style={styles.checkboxHeader}>
                <Text variant="bodyLarge" style={[styles.checkboxLabel, !isMealEligible('breakfast') && styles.disabledText]}>
                  Breakfast
                </Text>
                {isMealEligible('breakfast') && (
                  <View style={[styles.mealBadge, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="weather-sunny" size={14} color="#6B7280" />
                  </View>
                )}
              </View>
              <Text variant="bodySmall" style={styles.checkboxDesc}>
                {isMealEligible('breakfast') ? 'Morning meal attendance' : 'Not included in plan'}
              </Text>
            </View>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              status={lunch ? 'checked' : 'unchecked'}
              onPress={() => {
                if (isMealEligible('lunch')) {
                  setLunch(!lunch)
                }
              }}
              disabled={!isMealEligible('lunch')}
            />
            <View style={styles.checkboxInfo}>
              <View style={styles.checkboxHeader}>
                <Text variant="bodyLarge" style={[styles.checkboxLabel, !isMealEligible('lunch') && styles.disabledText]}>
                  Lunch
                </Text>
                {isMealEligible('lunch') && (
                  <View style={[styles.mealBadge, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="weather-sunset" size={14} color="#6B7280" />
                  </View>
                )}
              </View>
              <Text variant="bodySmall" style={styles.checkboxDesc}>
                {isMealEligible('lunch') ? 'Afternoon meal attendance' : 'Not included in plan'}
              </Text>
            </View>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              status={dinner ? 'checked' : 'unchecked'}
              onPress={() => {
                if (isMealEligible('dinner')) {
                  setDinner(!dinner)
                }
              }}
              disabled={!isMealEligible('dinner')}
            />
            <View style={styles.checkboxInfo}>
              <View style={styles.checkboxHeader}>
                <Text variant="bodyLarge" style={[styles.checkboxLabel, !isMealEligible('dinner') && styles.disabledText]}>
                  Dinner
                </Text>
                {isMealEligible('dinner') && (
                  <View style={[styles.mealBadge, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="weather-night" size={14} color="#6B7280" />
                  </View>
                )}
              </View>
              <Text variant="bodySmall" style={styles.checkboxDesc}>
                {isMealEligible('dinner') ? 'Evening meal attendance' : 'Not included in plan'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading}
            loading={loading}
          >
            Save Changes
          </Button>
        </View>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  content: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkboxInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  checkboxLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
    fontSize: 16,
  },
  checkboxDesc: {
    color: '#666',
    fontSize: 13,
  },
  mealBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#374151',
  },
})

