import React, { useState } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { Button, Modal, Portal, Text } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'

interface SimpleDatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  label?: string
  minimumDate?: Date
  maximumDate?: Date
  disabled?: boolean
}

// Helper function to format date using native JavaScript (reliable in production)
const formatDateNative = (date: Date, includeWeekday: boolean = false): string => {
  try {
    const day = String(date.getDate()).padStart(2, '0')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    
    if (includeWeekday) {
      const weekday = weekdayNames[date.getDay()]
      return `${day} ${month} ${year} (${weekday})`
    }
    return `${day} ${month} ${year}`
  } catch {
    return date.toLocaleDateString()
  }
}

export function SimpleDatePicker({
  value,
  onChange,
  label = 'Select Date',
  minimumDate,
  maximumDate,
  disabled = false,
}: SimpleDatePickerProps) {
  const [visible, setVisible] = useState(false)
  
  const currentDate = value ? new Date(value) : new Date()
  const [selectedDate, setSelectedDate] = useState(currentDate)

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date'
    try {
      return formatDateNative(new Date(dateStr), false)
    } catch {
      return dateStr
    }
  }

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleConfirm = () => {
    // Validate against minimumDate and maximumDate if provided
    if (minimumDate && selectedDate < minimumDate) {
      // If selected date is before minimum, use minimum date
      const dateStr = formatDateLocal(minimumDate)
      onChange(dateStr)
    } else if (maximumDate && selectedDate > maximumDate) {
      // If selected date is after maximum, use maximum date
      const dateStr = formatDateLocal(maximumDate)
      onChange(dateStr)
    } else {
      const dateStr = formatDateLocal(selectedDate)
      onChange(dateStr)
    }
    setVisible(false)
  }

  // Generate date options (last 30 days to next 365 days)
  const today = new Date()
  const minDate = minimumDate || new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
  const maxDate = maximumDate || new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
  
  const dates: Date[] = []
  const current = new Date(minDate)
  while (current <= maxDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  // Find closest date index
  const getClosestDateIndex = (targetDate: Date) => {
    let closestIndex = 0
    let closestDiff = Infinity
    
    // Ensure target date is within bounds
    const clampedDate = new Date(targetDate)
    if (minimumDate && clampedDate < minimumDate) {
      clampedDate.setTime(minimumDate.getTime())
    }
    if (maximumDate && clampedDate > maximumDate) {
      clampedDate.setTime(maximumDate.getTime())
    }
    
    dates.forEach((date, index) => {
      const diff = Math.abs(date.getTime() - clampedDate.getTime())
      if (diff < closestDiff) {
        closestDiff = diff
        closestIndex = index
      }
    })
    return closestIndex
  }

  const [selectedIndex, setSelectedIndex] = useState(() => getClosestDateIndex(selectedDate))

  const handleOpen = () => {
    if (value) {
      setSelectedDate(new Date(value))
    } else {
      // If no value, start with minimumDate or today
      setSelectedDate(minimumDate || new Date())
    }
    // Reset selected index to match the selected date
    const dateToUse = value ? new Date(value) : (minimumDate || new Date())
    setSelectedIndex(getClosestDateIndex(dateToUse))
    setVisible(true)
  }

  return (
    <>
      <Button
        mode="outlined"
        onPress={handleOpen}
        icon="calendar"
        style={styles.button}
        contentStyle={styles.buttonContent}
        disabled={disabled}
      >
        {formatDisplayDate(value)}
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
            <Picker
              selectedValue={selectedIndex}
              onValueChange={(index) => {
                setSelectedIndex(index)
                setSelectedDate(dates[index])
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {dates.map((date, index) => (
                <Picker.Item
                  key={index}
                  label={formatDateNative(date, true)}
                  value={index}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setVisible(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.confirmButton}
            >
              Select
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    marginBottom: 0,
    borderColor: '#7B2CBF',
    height: 48,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  pickerContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  picker: {
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
})

