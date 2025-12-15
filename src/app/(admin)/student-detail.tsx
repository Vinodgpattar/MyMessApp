import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Button, Card, ActivityIndicator, Chip, Snackbar } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useStudent, useDeleteStudent, useSendCredentialsEmail, useExtendPlan, useRenewPlan } from '@/hooks/useStudents'
import { usePlans } from '@/hooks/usePlans'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ExtendPlanModal } from '@/components/students/ExtendPlanModal'
import { RenewPlanModal } from '@/components/students/RenewPlanModal'
import { format } from 'date-fns'

export default function StudentDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const studentId = id ? parseInt(id) : 0

  const { data, isLoading, error } = useStudent(studentId)
  const { data: plansData } = usePlans()
  const plans = plansData?.plans || []
  const deleteMutation = useDeleteStudent()
  const sendEmailMutation = useSendCredentialsEmail()
  const extendMutation = useExtendPlan()
  const renewMutation = useRenewPlan()

  const student = data?.student
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [extendModalVisible, setExtendModalVisible] = useState(false)
  const [renewModalVisible, setRenewModalVisible] = useState(false)

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(studentId)
      router.back()
    } catch (error: any) {
      console.error('Delete error:', error)
    }
  }

  const handleSendEmail = async () => {
    try {
      // For existing students, we don't have the password, so let web app generate one
      await sendEmailMutation.mutateAsync({ studentId })
      setSnackbarMessage('Credentials email sent successfully')
      setSnackbarVisible(true)
    } catch (error: any) {
      // Error message is already user-friendly from the API function
      const errorMessage = error?.message || error?.toString() || 'Failed to send email. Please try again later.'
      setSnackbarMessage(errorMessage)
      setSnackbarVisible(true)
    }
  }

  const handleExtend = async (data: { days: number; startDate: string; paid: number }) => {
    try {
      await extendMutation.mutateAsync({ id: studentId, data })
      setExtendModalVisible(false)
      setSnackbarMessage('Plan extended successfully')
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error?.message || 'Failed to extend plan')
      setSnackbarVisible(true)
    }
  }

  const handleRenew = async (data: { planId: number; paid: number; extendFromCurrent: boolean }) => {
    try {
      await renewMutation.mutateAsync({ id: studentId, data })
      setRenewModalVisible(false)
      setSnackbarMessage('Plan renewed successfully')
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error?.message || 'Failed to renew plan')
      setSnackbarVisible(true)
    }
  }

  // Show inline loading at bottom of content area (keep header visible)
  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Button
            icon="arrow-left"
            onPress={() => router.back()}
            mode="text"
            textColor="#666"
          >
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Student Details
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        >
          <View style={styles.inlineLoadingContainer}>
            <ActivityIndicator size="small" color="#7B2CBF" />
            <Text variant="bodySmall" style={styles.inlineLoadingText}>
              Loading student...
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  if (error || !student) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#dc2626" />
        <Text variant="titleMedium" style={styles.errorTitle}>
          {error?.message || 'Student not found'}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    )
  }

  const isExpired = new Date(student.endDate) < new Date()

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Button
          icon="arrow-left"
          onPress={() => router.back()}
          mode="text"
          textColor="#666"
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          Student Details
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Student Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {student.rollNumber && (
                <Text variant="labelSmall" style={styles.rollNumber}>
                  {student.rollNumber}
                </Text>
              )}
              <Text variant="titleLarge" style={styles.name}>
                {student.name}
              </Text>
            </View>
            <Chip
              style={[
                styles.statusChip,
                student.isActive && !isExpired ? styles.statusActive : styles.statusInactive,
              ]}
              textStyle={styles.statusChipText}
            >
              {student.isActive && !isExpired ? 'Active' : 'Inactive'}
            </Chip>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email" size={20} color="#666" />
            <Text variant="bodyMedium" style={styles.infoText}>
              {student.email}
            </Text>
          </View>

          {student.contactNumber && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.infoText}>
                {student.contactNumber}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Plan Details Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Plan Details
          </Text>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Plan:</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {student.plan.name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Meals:</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {student.plan.meals}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Start Date:</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {formatDate(student.joinDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>End Date:</Text>
            <Text
              variant="bodyMedium"
              style={[styles.detailValue, isExpired && styles.expiredText]}
            >
              {formatDate(student.endDate)}
            </Text>
          </View>
          {isExpired && (
            <View style={styles.expiredWarning}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#F59E0B" />
              <Text variant="bodyMedium" style={styles.expiredWarningText} numberOfLines={1}>
                Plan has expired
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Plan Actions Card - Show only when expired */}
      {isExpired && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Plan Actions
            </Text>
            <View style={styles.planActions}>
              <Button
                mode="contained"
                onPress={() => setExtendModalVisible(true)}
                icon="calendar-plus"
                style={styles.planActionButton}
                buttonColor="#7B2CBF"
              >
                Extend Plan
              </Button>
              <Button
                mode="contained"
                onPress={() => setRenewModalVisible(true)}
                icon="refresh"
                style={styles.planActionButton}
                buttonColor="#10B981"
              >
                Renew Plan
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Financial Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Financial Information
          </Text>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Plan Price:</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {formatCurrency(student.price)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Paid:</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {formatCurrency(student.paid)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Balance:</Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.detailValue,
                student.balance > 0 ? styles.balanceNegative : styles.balancePositive,
              ]}
            >
              {formatCurrency(student.balance)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => router.push(`/(admin)/edit-student?id=${student.id}`)}
          icon="pencil"
          style={styles.actionButton}
        >
          Edit Student
        </Button>
        <Button
          mode="outlined"
          onPress={handleSendEmail}
          icon="send"
          style={styles.actionButton}
          loading={sendEmailMutation.isPending}
        >
          Resend Credentials
        </Button>
        <Button
          mode="outlined"
          onPress={() => setDeleteConfirm(true)}
          icon="delete"
          textColor="#dc2626"
          style={[styles.actionButton, styles.deleteButton]}
        >
          Delete Student
        </Button>
      </View>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteConfirm}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        loading={deleteMutation.isPending}
        confirmColor="#dc2626"
      />

      {/* Extend Plan Modal */}
      <ExtendPlanModal
        visible={extendModalVisible}
        onDismiss={() => setExtendModalVisible(false)}
        student={student}
        onExtend={handleExtend}
        loading={extendMutation.isPending}
      />

      {/* Renew Plan Modal */}
      <RenewPlanModal
        visible={renewModalVisible}
        onDismiss={() => setRenewModalVisible(false)}
        student={student}
        plans={plans}
        onRenew={handleRenew}
        loading={renewMutation.isPending}
      />

      {/* Snackbar for messages */}
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666',
  },
  inlineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  inlineLoadingText: {
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    color: '#dc2626',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  card: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'visible',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  rollNumber: {
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  name: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusChip: {
    height: 32,
    paddingHorizontal: 12,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#9CA3AF',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    color: '#1a1a1a',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expiredText: {
    color: '#f59e0b',
  },
  expiredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  expiredWarningText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  balanceNegative: {
    color: '#dc2626',
  },
  balancePositive: {
    color: '#10b981',
  },
  creditText: {
    color: '#10b981',
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  pinValue: {
    fontWeight: 'bold',
    color: '#7B2CBF',
    letterSpacing: 8,
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
  deleteButton: {
    borderColor: '#dc2626',
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  planActionButton: {
    flex: 1,
    borderRadius: 8,
  },
})

