import React, { useState, useEffect, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import { Text, TextInput, Button, ActivityIndicator, Snackbar, Card } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useStudents } from '@/hooks/useStudents'
import { useCreatePayment } from '@/hooks/usePayments'
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector'
import { StudentBalanceDisplay } from '@/components/payments/StudentBalanceDisplay'
import { SimpleDatePicker } from '@/components/shared/SimpleDatePicker'

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AddPaymentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ studentId?: string; amount?: string }>()
  const [selectedStudentId, setSelectedStudentId] = useState<string>(params.studentId || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [amount, setAmount] = useState(params.amount || '')
  const [paymentDate, setPaymentDate] = useState(formatDateLocal(new Date()))
  const [method, setMethod] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Auto-select student if provided in params
  useEffect(() => {
    if (params.studentId) {
      setSelectedStudentId(params.studentId)
    }
  }, [params.studentId])

  const { data: studentsData, isLoading: studentsLoading } = useStudents({ 
    active: true,
    limit: 1000, // Get all active students for search
  })
  const createMutation = useCreatePayment()

  const allStudents = studentsData?.students || []
  const selectedStudent = allStudents.find((s) => s.id === parseInt(selectedStudentId))

  // Filter students based on search query - only show results when user types
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return [] // Don't show any results if no search query
    }
    const query = searchQuery.toLowerCase()
    return allStudents.filter((student) =>
      student.name.toLowerCase().includes(query) ||
      student.rollNumber?.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.contactNumber?.toLowerCase().includes(query)
    )
  }, [allStudents, searchQuery])

  const handleSubmit = async () => {
    // Validation
    const newErrors: Record<string, string> = {}

    if (!selectedStudentId) {
      newErrors.student = 'Please select a student'
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Please select a payment date'
    }

    if (!method) {
      newErrors.method = 'Please select a payment method'
    }

    // Validate payment doesn't exceed balance
    if (selectedStudent && amount) {
      const amountNum = parseFloat(amount)
      const currentBalance = Number(selectedStudent.balance)
      if (amountNum > currentBalance) {
        newErrors.amount = `Amount exceeds remaining balance (₹${currentBalance.toFixed(2)}). Maximum allowed: ₹${currentBalance.toFixed(2)}`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    try {
      await createMutation.mutateAsync({
        studentId: parseInt(selectedStudentId),
        amount: parseFloat(amount),
        paymentDate,
        method,
      })

      setSnackbarMessage('✅ Payment recorded successfully!')
      setSnackbarVisible(true)

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (error: any) {
      setSnackbarMessage(`⚠️ ${error.message || 'Failed to record payment'}`)
      setSnackbarVisible(true)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {/* Modern Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="cash-plus" size={28} color="#7B2CBF" />
            </View>
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.title}>
                Record Payment
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Add a new payment transaction
              </Text>
            </View>
          </View>
        </View>

        {/* Student Search Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-search" size={20} color="#6366F1" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Select Student *
              </Text>
            </View>
            <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              value={selectedStudent && !showResults 
                ? `${selectedStudent.name}${selectedStudent.rollNumber ? ` (${selectedStudent.rollNumber})` : ''}`
                : searchQuery
              }
              onChangeText={(text) => {
                setSearchQuery(text)
                // Only show results when user has typed something
                setShowResults(text.trim().length > 0)
                if (selectedStudentId) {
                  setSelectedStudentId('')
                }
                if (errors.student) {
                  setErrors({ ...errors, student: '' })
                }
              }}
              onFocus={() => {
                if (selectedStudentId) {
                  setSearchQuery('')
                  setSelectedStudentId('')
                }
                // Don't show results on focus, only when user types
              }}
              placeholder="Search by name, roll number, email, or phone..."
              left={<TextInput.Icon icon="magnify" />}
              right={
                selectedStudentId ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() => {
                      setSelectedStudentId('')
                      setSearchQuery('')
                      setShowResults(false)
                    }}
                  />
                ) : searchQuery ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() => {
                      setSearchQuery('')
                      setShowResults(false)
                    }}
                  />
                ) : null
              }
              error={!!errors.student}
              style={styles.input}
            />
          </View>
          {errors.student && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
              <Text variant="bodySmall" style={styles.error}>
                {errors.student}
              </Text>
            </View>
          )}
          </Card.Content>
        </Card>

        {/* Search Results - Instagram style: appears below search card in scroll view */}
        {showResults && searchQuery.trim().length > 0 && (
          <Card style={styles.searchResultsCard}>
            <Card.Content style={styles.searchResultsContent}>
              {studentsLoading ? (
                <View style={styles.resultsLoading}>
                  <ActivityIndicator size="small" color="#7B2CBF" />
                  <Text variant="bodySmall" style={styles.resultsLoadingText}>
                    Loading students...
                  </Text>
                </View>
              ) : filteredStudents.length === 0 ? (
                <View style={styles.resultsEmpty}>
                  <Text variant="bodySmall" style={styles.resultsEmptyText}>
                    No students found
                  </Text>
                </View>
              ) : (
                <View style={styles.resultsListContainer}>
                  {filteredStudents.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultItem}
                      onPress={() => {
                        setSelectedStudentId(item.id.toString())
                        setSearchQuery('')
                        setShowResults(false)
                        setErrors({ ...errors, student: '' })
                      }}
                    >
                      <View style={styles.resultItemContent}>
                        <Text variant="bodyLarge" style={styles.resultItemName}>
                          {item.name}
                        </Text>
                        <View style={styles.resultItemDetails}>
                          {item.rollNumber && (
                            <Text variant="bodySmall" style={styles.resultItemDetail}>
                              Roll: {item.rollNumber}
                            </Text>
                          )}
                          <Text variant="bodySmall" style={styles.resultItemDetail}>
                            {item.email}
                          </Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Student Balance Display */}
        {selectedStudent && (
          <StudentBalanceDisplay
            student={{
              name: selectedStudent.name,
              rollNumber: selectedStudent.rollNumber,
              paid: Number(selectedStudent.paid),
              balance: Number(selectedStudent.balance),
              price: Number(selectedStudent.price),
            }}
          />
        )}

        {/* Amount Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#10B981" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Payment Amount *
              </Text>
            </View>
            <TextInput
              mode="outlined"
              value={amount}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.]/g, '')
                setAmount(cleaned)
                if (errors.amount) {
                  setErrors({ ...errors, amount: '' })
                }
              }}
              placeholder="Enter amount (e.g., 5000.00)"
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon="currency-inr" />}
              error={!!errors.amount}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {/* Quick Amount Buttons */}
            <View style={styles.quickButtons}>
              {[500, 1000, 2000, 5000].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  onPress={() => {
                    setAmount(quickAmount.toString())
                    if (errors.amount) {
                      setErrors({ ...errors, amount: '' })
                    }
                  }}
                  style={[
                    styles.quickButtonTouchable,
                    amount === quickAmount.toString() && styles.quickButtonSelected
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickButtonText,
                    amount === quickAmount.toString() && styles.quickButtonTextSelected
                  ]}>
                    ₹{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.amount && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.amount}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Date Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={20} color="#F59E0B" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Payment Date *
              </Text>
            </View>
            <SimpleDatePicker
              value={paymentDate}
              onChange={(date) => {
                setPaymentDate(date)
                if (errors.paymentDate) {
                  setErrors({ ...errors, paymentDate: '' })
                }
              }}
              label="Select Payment Date"
            />
            {errors.paymentDate && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.paymentDate}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Method Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <PaymentMethodSelector
              selectedMethod={method}
              onSelect={(selectedMethod) => {
                setMethod(selectedMethod)
                if (errors.method) {
                  setErrors({ ...errors, method: '' })
                }
              }}
              error={errors.method}
            />
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Submit Button - Fixed at bottom */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 8 }]}>
        <Button
          mode="contained"
          onPress={() => {
            Keyboard.dismiss()
            handleSubmit()
          }}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          buttonColor="#7B2CBF"
          icon="check-circle"
        >
          {createMutation.isPending ? 'Recording...' : 'Record Payment'}
        </Button>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickButtonTouchable: {
    flex: 1,
    minWidth: '22%',
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
  },
  quickButtonTextSelected: {
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
  },
  label: {
    marginBottom: 8,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchResultsCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 400,
  },
  searchResultsContent: {
    padding: 0,
  },
  resultsListContainer: {
    maxHeight: 400,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  resultItemContent: {
    flex: 1,
    marginRight: 8,
  },
  resultItemName: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  resultItemDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  resultItemDetail: {
    color: '#666',
  },
  resultsLoading: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  resultsLoadingText: {
    color: '#666',
  },
  resultsEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  resultsEmptyText: {
    color: '#999',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    elevation: 0,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
})

