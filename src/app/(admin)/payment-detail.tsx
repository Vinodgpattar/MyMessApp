import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Snackbar } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { usePayment, useDeletePayment } from '@/hooks/usePayments'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StudentBalanceDisplay } from '@/components/payments/StudentBalanceDisplay'

export default function PaymentDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const paymentId = id ? parseInt(id) : 0

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const { data: payment, isLoading, error } = usePayment(paymentId)
  const deleteMutation = useDeletePayment()

  const handleDelete = () => {
    setDeleteConfirmVisible(true)
  }

  const confirmDelete = async () => {
    if (!paymentId) return

    try {
      await deleteMutation.mutateAsync(paymentId)
      setDeleteConfirmVisible(false)
      setSnackbarMessage('✅ Payment deleted successfully!')
      setSnackbarVisible(true)
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (error: any) {
      setSnackbarMessage(`⚠️ ${error.message || 'Failed to delete payment'}`)
      setSnackbarVisible(true)
    }
  }

  const getMethodIcon = (method: string | null) => {
    switch (method) {
      case 'Cash':
        return 'cash'
      case 'UPI':
        return 'cellphone'
      case 'Online':
        return 'credit-card'
      default:
        return 'currency-inr'
    }
  }

  const getMethodColor = (method: string | null) => {
    switch (method) {
      case 'Cash':
        return '#10B981'
      case 'UPI':
        return '#6366F1'
      case 'Online':
        return '#8B5CF6'
      default:
        return '#6B7280'
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading payment details...
        </Text>
      </View>
    )
  }

  if (error || !payment) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Payment Details
          </Text>
        </View>

        {/* Payment Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.paymentHeader}>
              <Text variant="headlineMedium" style={styles.amount}>
                ₹{Number(payment.amount).toFixed(2)}
              </Text>
              <View style={styles.methodBadge}>
                <MaterialCommunityIcons
                  name={getMethodIcon(payment.method) as any}
                  size={20}
                  color={getMethodColor(payment.method)}
                />
                <Text variant="bodyMedium" style={[styles.method, { color: getMethodColor(payment.method) }]}>
                  {payment.method || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Payment Date:
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Recorded On:
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Student Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Student Information
            </Text>
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Name:
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {payment.student.name}
                </Text>
              </View>
              {payment.student.rollNumber && (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Roll Number:
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {payment.student.rollNumber}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Email:
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {payment.student.email}
                </Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => router.push(`/(admin)/student-detail?id=${payment.studentId}`)}
              style={styles.viewStudentButton}
            >
              View Student Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Student Balance */}
        <StudentBalanceDisplay
          student={{
            name: payment.student.name,
            rollNumber: payment.student.rollNumber,
            paid: Number(payment.student.paid),
            balance: Number(payment.student.balance),
            price: Number(payment.student.paid) + Number(payment.student.balance),
          }}
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => router.push(`/(admin)/edit-payment?id=${payment.id}`)}
            style={styles.editButton}
            icon="pencil"
          >
            Edit Payment
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            icon="delete"
            textColor="#EF4444"
          >
            Delete Payment
          </Button>
        </View>
      </ScrollView>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This will update the student's balance. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        loading={deleteMutation.isPending}
        confirmColor="#EF4444"
      />

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
    </View>
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
  },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontWeight: 'bold',
    color: '#10B981',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  method: {
    fontWeight: '600',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '500',
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  viewStudentButton: {
    marginTop: 12,
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  editButton: {
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
  },
  deleteButton: {
    borderRadius: 8,
    borderColor: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
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

