import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Modal, Text, Button, Checkbox, Portal } from 'react-native-paper'
import type { StudentAttendance } from '@/lib/attendance'

interface BulkMarkModalProps {
  visible: boolean
  onDismiss: () => void
  students: StudentAttendance[]
  currentMeal: 'breakfast' | 'lunch' | 'dinner'
  onMark: (studentIds: number[]) => void
  loading?: boolean
}

export function BulkMarkModal({
  visible,
  onDismiss,
  students,
  currentMeal,
  onMark,
  loading = false,
}: BulkMarkModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleSelection = (studentId: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map((s) => s.studentId)))
    }
  }

  const handleMark = () => {
    onMark(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Mark {mealLabels[currentMeal]} for Multiple Students
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Select students to mark attendance
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleSelectAll}
            style={styles.selectAllButton}
          >
            {selectedIds.size === students.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Text variant="bodySmall" style={styles.count}>
            {selectedIds.size} selected
          </Text>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {students.map((student) => {
            const isSelected = selectedIds.has(student.studentId)
            const isEligible = student.plan.meals.some((m) =>
              m.toLowerCase().includes(currentMeal)
            )

            if (!isEligible) return null

            return (
              <View key={student.studentId} style={styles.item}>
                <Checkbox
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => toggleSelection(student.studentId)}
                />
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge" style={styles.itemName}>
                    {student.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemRoll}>
                    {student.rollNumber || 'No Roll Number'}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>

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
            onPress={handleMark}
            style={styles.markButton}
            disabled={loading || selectedIds.size === 0}
            loading={loading}
          >
            Mark {selectedIds.size} Student{selectedIds.size !== 1 ? 's' : ''}
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
    maxHeight: '80%',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectAllButton: {
    borderRadius: 8,
  },
  count: {
    color: '#6366F1',
    fontWeight: '600',
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    padding: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  itemRoll: {
    color: '#666',
    marginTop: 2,
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
  markButton: {
    flex: 2,
    backgroundColor: '#6366F1',
  },
})


