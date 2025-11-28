import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Modal as RNModal, TouchableOpacity } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, addDays } from 'date-fns'
import type { Student } from '@/lib/students'

interface ExtendPlanModalProps {
  visible: boolean
  onDismiss: () => void
  student: Student | null
  onExtend: (data: { days: number; paid: number; extendFromToday: boolean }) => void
  loading?: boolean
}

export function ExtendPlanModal({
  visible,
  onDismiss,
  student,
  onExtend,
  loading = false,
}: ExtendPlanModalProps) {
  const [days, setDays] = useState('30')
  const [paid, setPaid] = useState('0')
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (visible && student) {
      // Reset form when modal opens
      setDays('30')
      setPaid('0')
      setError('')
      setShowConfirm(false)
    }
  }, [visible, student])

  if (!student) return null

  const daysNum = parseInt(days) || 0
  const paidNum = parseFloat(paid) || 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentEndDate = new Date(student.endDate)
  currentEndDate.setHours(0, 0, 0, 0)
  
  // Always extend from today (toggle removed)
  const extendFromToday = true
  const startDate = today
  const newEndDate = addDays(startDate, daysNum)
  
  // Calculate additional cost if extending from today (when plan hasn't expired yet)
  const planPrice = student.price
  const planDuration = student.plan.durationDays
  const pricePerDay = planDuration > 0 ? planPrice / planDuration : 0
  const daysOverlap = currentEndDate > today ? Math.ceil((currentEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const additionalCost = daysOverlap > 0 && daysNum > daysOverlap ? Math.round(pricePerDay * (daysNum - daysOverlap) * 100) / 100 : 0

  const validate = (): boolean => {
    if (daysNum <= 0) {
      setError('Please enter a valid number of days (minimum 1)')
      return false
    }
    if (daysNum > 365) {
      setError('Days cannot exceed 365')
      return false
    }
    if (paidNum < 0) {
      setError('Payment cannot be negative')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = () => {
    if (!validate()) return
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    onExtend({
      days: daysNum,
      paid: paidNum,
      extendFromToday: true, // Always true now
    })
  }

  const totalAmount = additionalCost
  const balanceAfterPayment = totalAmount - paidNum - student.credit

  return (
    <>
      <RNModal
        visible={visible && !showConfirm}
        onRequestClose={onDismiss}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
          <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.header}>
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.title}>
                Extend Plan
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.studentName}>
              {student.name} • Ends: {format(new Date(student.endDate), 'dd MMM yyyy')}
            </Text>
          </View>

          <ScrollView 
            style={styles.formContent}
            contentContainerStyle={styles.formContentInner}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            <View style={styles.cardContentInner}>

              {/* Days Input */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text variant="labelMedium" style={styles.label}>
                    Days *
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={days}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '')
                      if (cleaned.length <= 3) {
                        setDays(cleaned)
                        setError('')
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="30"
                    style={styles.input}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="calendar-range" size={18} />}
                    disabled={loading}
                    error={error.includes('days') || error.includes('Days')}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="labelMedium" style={styles.label}>
                    Payment (₹)
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={paid}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '')
                      setPaid(cleaned)
                      setError('')
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    style={styles.input}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="currency-inr" size={18} />}
                    disabled={loading}
                    error={error.includes('Payment') || error.includes('payment')}
                  />
                </View>
              </View>

              {/* Quick Days Buttons */}
              <View style={styles.quickButtons}>
                {[7, 15, 30, 60, 90].map((day) => {
                  const isSelected = days === day.toString()
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        setDays(day.toString())
                        setError('')
                      }}
                      disabled={loading}
                      style={[
                        styles.quickButtonTouchable,
                        isSelected && styles.quickButtonSelected
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.quickButtonText,
                        isSelected && styles.quickButtonTextSelected
                      ]}>
                        {day}d
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickButtons}>
                {[500, 1000, 2000, 5000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => {
                      setPaid(amount.toString())
                      setError('')
                    }}
                    disabled={loading}
                    style={styles.quickButtonTouchable}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickButtonText}>
                      ₹{amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                  <Text variant="bodySmall" style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Summary - Compact */}
              {daysNum > 0 && (
                <View style={styles.summaryCompact}>
                  <View style={styles.summaryRow}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      New End:
                    </Text>
                    <Text variant="bodySmall" style={[styles.summaryValue, styles.highlightValue]}>
                      {format(newEndDate, 'dd MMM yyyy')}
                    </Text>
                  </View>
                  {additionalCost > 0 && (
                    <View style={styles.summaryRow}>
                      <Text variant="bodySmall" style={styles.summaryLabel}>
                        Cost:
                      </Text>
                      <Text variant="bodySmall" style={styles.summaryValue}>
                        ₹{additionalCost.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {balanceAfterPayment > 0 && (
                    <View style={styles.summaryRow}>
                      <Text variant="bodySmall" style={styles.balanceLabel}>
                        Balance:
                      </Text>
                      <Text variant="bodySmall" style={styles.balanceValue}>
                        ₹{balanceAfterPayment.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

            </View>
          </ScrollView>
          
          {/* Actions - Fixed at bottom */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                disabled={loading}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || daysNum <= 0}
                style={styles.submitButton}
                buttonColor="#7B2CBF"
              >
                Extend Plan
              </Button>
            </View>
          </View>
        </Card>
          </View>
        </View>
      </RNModal>

      {/* Confirmation Dialog */}
      <RNModal
        visible={showConfirm}
        onRequestClose={() => setShowConfirm(false)}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.confirmHeader}>
                  <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" />
                  <Text variant="titleLarge" style={styles.confirmTitle}>
                    Confirm Extension
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.confirmText}>
                  Extend plan by {daysNum} days starting from {format(today, 'dd MMM yyyy')}?
                </Text>
                <Text variant="bodySmall" style={styles.confirmSubtext}>
                  New end date: {format(newEndDate, 'dd MMM yyyy')}
                </Text>
                <View style={styles.confirmActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowConfirm(false)}
                    style={styles.confirmCancelButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleConfirm}
                    loading={loading}
                    buttonColor="#7B2CBF"
                    style={styles.confirmSubmitButton}
                  >
                    Confirm
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </View>
      </RNModal>
    </>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    width: '100%',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    maxHeight: '100%',
  },
  cardHeader: {
    padding: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  formContent: {
    maxHeight: 450,
  },
  formContentInner: {
    paddingBottom: 8,
  },
  cardContentInner: {
    padding: 12,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    fontSize: 18,
  },
  studentName: {
    fontWeight: '500',
    color: '#6B7280',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  label: {
    marginBottom: 4,
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  input: {
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  inputContent: {
    fontSize: 14,
    paddingVertical: 0,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  quickButton: {
    flex: 1,
    minWidth: '18%',
    minHeight: 40,
    height: 40,
  },
  quickButtonTouchable: {
    flex: 1,
    minWidth: '18%',
    minHeight: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quickButtonSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
    includeFontPadding: false,
  },
  quickButtonTextSelected: {
    color: '#FFFFFF',
  },
  quickButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
    includeFontPadding: false,
    color: '#7B2CBF',
  },
  quickButtonContent: {
    paddingVertical: 0,
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontWeight: '500',
    fontSize: 11,
  },
  summaryCompact: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  summaryValue: {
    fontWeight: '600',
    color: '#1a1a1a',
    fontSize: 11,
  },
  highlightValue: {
    color: '#7B2CBF',
    fontSize: 12,
  },
  balanceLabel: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 11,
  },
  balanceValue: {
    fontWeight: '700',
    color: '#EF4444',
    fontSize: 12,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  confirmTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  confirmText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#374151',
  },
  confirmSubtext: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
  },
  confirmSubmitButton: {
    flex: 1,
  },
})
