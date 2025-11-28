import React, { useState } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { Button, Modal, Portal, Text } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'

interface DatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  label?: string
  minimumDate?: Date
  maximumDate?: Date
}

export function DatePicker({
  value,
  onChange,
  label = 'Select Date',
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [visible, setVisible] = useState(false)
  const [tempDate, setTempDate] = useState(() => {
    if (value) {
      const date = new Date(value)
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }
    }
    const today = new Date()
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    }
  })

  const minYear = minimumDate ? minimumDate.getFullYear() : 2020
  const maxYear = maximumDate ? maximumDate.getFullYear() : new Date().getFullYear() + 10
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const handleConfirm = () => {
    const dateStr = `${tempDate.year}-${String(tempDate.month).padStart(2, '0')}-${String(tempDate.day).padStart(2, '0')}`
    onChange(dateStr)
    setVisible(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        icon="calendar"
        style={styles.button}
      >
        {formatDate(value)}
      </Button>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              {label}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            {/* Year Picker */}
            <View style={styles.pickerWrapper}>
              <Text variant="labelSmall" style={styles.pickerLabel}>Year</Text>
              <Picker
                selectedValue={tempDate.year}
                onValueChange={(year) => {
                  setTempDate({ ...tempDate, year })
                  // Adjust day if needed
                  const daysInNewMonth = new Date(year, tempDate.month, 0).getDate()
                  if (tempDate.day > daysInNewMonth) {
                    setTempDate({ ...tempDate, year, day: daysInNewMonth })
                  }
                }}
                style={styles.picker}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>

            {/* Month Picker */}
            <View style={styles.pickerWrapper}>
              <Text variant="labelSmall" style={styles.pickerLabel}>Month</Text>
              <Picker
                selectedValue={tempDate.month}
                onValueChange={(month) => {
                  setTempDate({ ...tempDate, month })
                  // Adjust day if needed
                  const daysInNewMonth = new Date(tempDate.year, month, 0).getDate()
                  if (tempDate.day > daysInNewMonth) {
                    setTempDate({ ...tempDate, month, day: daysInNewMonth })
                  }
                }}
                style={styles.picker}
              >
                {months.map((month) => (
                  <Picker.Item
                    key={month}
                    label={new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                    value={month}
                  />
                ))}
              </Picker>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerWrapper}>
              <Text variant="labelSmall" style={styles.pickerLabel}>Day</Text>
              <Picker
                selectedValue={tempDate.day}
                onValueChange={(day) => setTempDate({ ...tempDate, day })}
                style={styles.picker}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setVisible(false)} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleConfirm} style={styles.confirmButton}>
              Confirm
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    minHeight: 200,
  },
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    marginBottom: 8,
    color: '#666',
  },
  picker: {
    width: '100%',
    height: 150,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
})

