import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native'
import { Text, TextInput, Button, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, addDays } from 'date-fns'
import { SimpleDatePicker } from '@/components/shared/SimpleDatePicker'
import type { Student } from '@/lib/students'
import type { Plan } from '@/hooks/usePlans'

interface RenewPlanModalProps {
  visible: boolean
  onDismiss: () => void
  student: Student | null
  plans: Plan[]
  onRenew: (data: { planId: number; paid: number; extendFromCurrent: boolean }) => void
  loading?: boolean
}

export function RenewPlanModal({
  visible,
  onDismiss,
  student,
  plans,
  onRenew,
  loading = false,
}: RenewPlanModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [paid, setPaid] = useState('0')
  const [startDate, setStartDate] = useState<string>('')
  const [planDropdownVisible, setPlanDropdownVisible] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const planSelectorRef = useRef<View>(null)

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    if (visible && student) {
      // Reset form when modal opens
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      setSelectedPlanId('')
      setPaid('0')
      setStartDate(formatDateLocal(today))
      setPlanDropdownVisible(false)
      setError('')
      setShowConfirm(false)
    }
  }, [visible, student])

  if (!student) return null

  const selectedPlan = plans.find(p => p.id.toString() === selectedPlanId)
  const paidNum = parseFloat(paid) || 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateLocal(today)
  const currentEndDate = new Date(student.endDate)
  currentEndDate.setHours(0, 0, 0, 0)
  const currentEndDateStr = formatDateLocal(currentEndDate)
  
  const startDateObj = startDate ? new Date(startDate) : today
  startDateObj.setHours(0, 0, 0, 0)
  const newEndDate = selectedPlan ? addDays(startDateObj, selectedPlan.durationDays) : null
  const extendFromCurrent = startDate === currentEndDateStr

  const handlePlanSelect = (planId: string) => {
    // Prevent selecting same plan
    if (planId === student.planId.toString()) {
      setError('Cannot renew with the same plan. Please select a different plan.')
      return
    }
    setSelectedPlanId(planId)
    setPlanDropdownVisible(false)
    setError('')
  }

  const handlePlanToggle = () => {
    setPlanDropdownVisible(!planDropdownVisible)
  }

  const handleDateChange = (date: string) => {
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    // Ensure date is not before today
    if (selectedDate < today) {
      setError('Start date cannot be in the past')
      return
    }
    setStartDate(date)
    setError('')
  }

  const validate = (): boolean => {
    if (!selectedPlanId) {
      setError('Please select a plan')
      return false
    }
    if (selectedPlanId === student.planId.toString()) {
      setError('Cannot renew with the same plan. Please select a different plan.')
      return false
    }
    if (paidNum < 0) {
      setError('Payment cannot be negative')
      return false
    }
    if (startDate && new Date(startDate) < today) {
      setError('Start date cannot be in the past')
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
    onRenew({
      planId: parseInt(selectedPlanId),
      paid: paidNum,
      extendFromCurrent,
    })
  }

  // Filter out current plan from options
  const availablePlans = plans.filter(p => p.id !== student.planId)

  const totalAmount = selectedPlan ? selectedPlan.price : 0
  const balanceAfterPayment = totalAmount - paidNum - student.credit

  return (
    <>
      <RNModal
        visible={visible && !showConfirm}
        onRequestClose={() => {
          setPlanDropdownVisible(false)
          onDismiss()
        }}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
          <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.header}>
              <MaterialCommunityIcons name="refresh" size={20} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.title}>
                Renew Plan
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.studentName}>
              {student.name} • {student.plan.name} • Ends: {format(new Date(student.endDate), 'dd MMM yyyy')}
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

              {/* Plan Selection */}
              <Text variant="labelMedium" style={styles.label}>
                Select New Plan *
              </Text>
              {availablePlans.length === 0 ? (
                <View style={styles.noPlansContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#F59E0B" />
                  <Text variant="bodySmall" style={styles.noPlansText}>
                    No other plans available
                  </Text>
                </View>
              ) : (
                <View ref={planSelectorRef}>
                  <TouchableOpacity
                    onPress={handlePlanToggle}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <View style={styles.planSelectorButton}>
                      <View style={styles.planSelectorContent}>
                        {selectedPlan ? (
                          <>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#7B2CBF" />
                            <View style={styles.planSelectorText}>
                              <Text variant="bodyLarge" style={styles.planSelectorName}>
                                {selectedPlan.name}
                              </Text>
                              <Text variant="bodySmall" style={styles.planSelectorDetails}>
                                ₹{selectedPlan.price.toFixed(2)} • {selectedPlan.durationDays} days
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                            <Text variant="bodyLarge" style={styles.planSelectorPlaceholder}>
                              Select a plan
                            </Text>
                          </>
                        )}
                      </View>
                      <MaterialCommunityIcons 
                        name={planDropdownVisible ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {planDropdownVisible && (
                    <View style={styles.dropdownContainer}>
                      {availablePlans.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => handlePlanSelect(item.id.toString())}
                          style={[
                            styles.dropdownItem,
                            selectedPlan?.id === item.id && styles.dropdownItemSelected
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownItemContent}>
                            {selectedPlan?.id === item.id && (
                              <MaterialCommunityIcons name="check-circle" size={20} color="#7B2CBF" />
                            )}
                            <View style={styles.dropdownItemText}>
                              <Text variant="bodyLarge" style={[
                                styles.dropdownItemTitle,
                                selectedPlan?.id === item.id && styles.dropdownItemTitleSelected
                              ]}>
                                {item.name}
                              </Text>
                              <Text variant="bodySmall" style={styles.dropdownItemDetails}>
                                ₹{item.price.toFixed(2)} • {item.durationDays} days
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Start Date and Payment Row */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text variant="labelMedium" style={styles.label}>
                    Start Date *
                  </Text>
                  <SimpleDatePicker
                    value={startDate || todayStr}
                    onChange={handleDateChange}
                    label="Select Date"
                    minimumDate={today}
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

              {/* Quick Date Buttons */}
              <View style={styles.quickButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setStartDate(todayStr)
                    setError('')
                  }}
                  disabled={loading}
                  style={[
                    styles.quickButtonTouchable,
                    startDate === todayStr && styles.quickButtonSelected
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickButtonText,
                    startDate === todayStr && styles.quickButtonTextSelected
                  ]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setStartDate(currentEndDateStr)
                    setError('')
                  }}
                  disabled={loading}
                  style={[
                    styles.quickButtonTouchable,
                    extendFromCurrent && styles.quickButtonSelected
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickButtonText,
                    extendFromCurrent && styles.quickButtonTextSelected
                  ]}>
                    From End Date
                  </Text>
                </TouchableOpacity>
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
              {selectedPlan && newEndDate && (
                <View style={styles.summaryCompact}>
                  <View style={styles.summaryRow}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Plan:
                    </Text>
                    <Text variant="bodySmall" style={styles.summaryValue}>
                      {selectedPlan.name} (₹{selectedPlan.price.toFixed(2)})
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      End Date:
                    </Text>
                    <Text variant="bodySmall" style={[styles.summaryValue, styles.highlightValue]}>
                      {format(newEndDate, 'dd MMM yyyy')}
                    </Text>
                  </View>
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
                disabled={loading || !selectedPlanId || availablePlans.length === 0}
                style={styles.submitButton}
                buttonColor="#7B2CBF"
              >
                Renew Plan
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
                    Confirm Renewal
                  </Text>
                </View>
                {selectedPlan && (
                  <>
                    <Text variant="bodyMedium" style={styles.confirmText}>
                      Renew plan to {selectedPlan.name}?
                    </Text>
                    <Text variant="bodySmall" style={styles.confirmSubtext}>
                      Start: {startDate ? format(new Date(startDate), 'dd MMM yyyy') : format(today, 'dd MMM yyyy')} • End: {newEndDate ? format(newEndDate, 'dd MMM yyyy') : ''}
                    </Text>
                  </>
                )}
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
  noPlansContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  noPlansText: {
    flex: 1,
    color: '#92400E',
    fontStyle: 'italic',
  },
  planSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 72,
    marginBottom: 10,
  },
  planSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planSelectorText: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  planSelectorName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    fontSize: 16,
    lineHeight: 20,
  },
  planSelectorDetails: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    includeFontPadding: false,
  },
  planSelectorPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: 16,
  },
  dropdownContainer: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginTop: -10,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3E8FF',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontSize: 15,
  },
  dropdownItemTitleSelected: {
    color: '#7B2CBF',
  },
  dropdownItemDetails: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
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
