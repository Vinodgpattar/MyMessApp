import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, ActivityIndicator, Snackbar } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePayment, useUpdatePayment } from '@/hooks/usePayments'
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector'
import { StudentBalanceDisplay } from '@/components/payments/StudentBalanceDisplay'
import { SimpleDatePicker } from '@/components/shared/SimpleDatePicker'

export default function EditPaymentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const paymentId = id ? parseInt(id) : 0

  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [method, setMethod] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const { data: payment, isLoading, error } = usePayment(paymentId)
  const updateMutation = useUpdatePayment()

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString())
      setPaymentDate(payment.paymentDate)
      setMethod(payment.method || '')
    }
  }, [payment])

  const handleSubmit = async () => {
    // Validation
    const newErrors: Record<string, string> = {}

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Please select a payment date'
    }

    if (!method) {
      newErrors.method = 'Please select a payment method'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    try {
      await updateMutation.mutateAsync({
        id: paymentId,
        data: {
          amount: parseFloat(amount),
          paymentDate,
          method,
        },
      })

      setSnackbarMessage('✅ Payment updated successfully!')
      setSnackbarVisible(true)

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (error: any) {
      setSnackbarMessage(`⚠️ ${error.message || 'Failed to update payment'}`)
      setSnackbarVisible(true)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text variant="headlineSmall" style={styles.title}>
            Edit Payment
          </Text>
        </View>
        <View style={styles.inlineLoadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading payment...
          </Text>
        </View>
      </View>
    )
  }

  if (error || !payment) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorTitle}>
          Payment not found
        </Text>
        <Text variant="bodySmall" style={styles.errorText}>
          {error?.message || 'The payment you are looking for does not exist.'}
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text variant="headlineSmall" style={styles.title}>
            Edit Payment
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Update payment details
          </Text>
        </View>

        {/* Student Info (Read-only) */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Student
          </Text>
          <TextInput
            mode="outlined"
            value={`${payment.student.name} (${payment.student.rollNumber || 'No Roll'})`}
            editable={false}
            style={styles.input}
          />
        </View>

        {/* Student Balance Display */}
        <StudentBalanceDisplay
          student={{
            name: payment.student.name,
            rollNumber: payment.student.rollNumber,
            paid: Number(payment.student.paid),
            balance: Number(payment.student.balance),
            price: Number(payment.student.paid) + Number(payment.student.balance),
          }}
        />

        {/* Amount */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Amount (₹) *
          </Text>
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
            placeholder="0.00"
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="currency-inr" />}
            error={!!errors.amount}
            style={styles.input}
          />
          {errors.amount && (
            <Text variant="bodySmall" style={styles.error}>
              {errors.amount}
            </Text>
          )}
        </View>

        {/* Payment Date */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Payment Date *
          </Text>
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
            <Text variant="bodySmall" style={styles.error}>
              {errors.paymentDate}
            </Text>
          )}
        </View>

        {/* Payment Method */}
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

      </ScrollView>

      {/* Sticky Submit Button */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          buttonColor="#7B2CBF"
        >
          Update Payment
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inlineLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#1A1A1A',
  },
  input: {
    marginBottom: 4,
  },
  error: {
    color: '#EF4444',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  loadingText: {
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  errorTitle: {
    color: '#EF4444',
    fontWeight: '600',
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: '#7B2CBF',
  },
})

