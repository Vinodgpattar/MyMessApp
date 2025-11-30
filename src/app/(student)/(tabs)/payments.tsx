import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { getPayments, Payment } from '@/lib/payments'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { logger } from '@/lib/logger'

type DateFilter = 'all' | 'today' | 'week' | 'month'

export default function StudentPaymentsScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Get student data
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const result = await getStudentByUserId(user.id)
      if (result.error) throw result.error
      return result.student
    },
    enabled: !!user?.id,
  })

  // Calculate date range based on filter
  const getDateRange = () => {
    // Use local date to avoid timezone issues
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    
    // Create date at midnight local time
    const todayLocal = new Date(year, month, day)
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    switch (dateFilter) {
      case 'today':
        return {
          startDate: todayStr,
          endDate: todayStr,
        }
      case 'week':
        // Last 7 days including today
        const weekStart = new Date(year, month, day - 7)
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
        return {
          startDate: weekStartStr,
          endDate: todayStr,
        }
      case 'month':
        // Current month from 1st to today
        const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
        return {
          startDate: monthStartStr,
          endDate: todayStr,
        }
      default:
        // All time - no date filter
        return {
          startDate: undefined,
          endDate: undefined,
        }
    }
  }

  const dateRange = getDateRange()

  // Fetch payments for this student
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    refetch,
    error: paymentsError,
  } = useQuery({
    queryKey: ['student-payments', studentData?.id, dateFilter],
    queryFn: async () => {
      if (!studentData?.id) return null
      
      logger.debug('Fetching payments', {
        studentId: studentData.id,
        filter: dateFilter,
        dateRange,
      })
      
      const result = await getPayments({
        studentId: studentData.id,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      
      if (result.error) {
        logger.error('Error fetching payments', result.error, {
          studentId: studentData.id,
          filter: dateFilter,
        })
        throw result.error
      }
      
      logger.debug('Payments fetched successfully', {
        studentId: studentData.id,
        filter: dateFilter,
        count: result.payments?.length || 0,
      })
      
      return result.payments || []
    },
    enabled: !!studentData?.id,
  })

  const payments = paymentsData || []

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Calculate totals
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const thisMonthTotal = payments
    .filter((p) => {
      const paymentDate = new Date(p.paymentDate)
      const today = new Date()
      return (
        paymentDate.getMonth() === today.getMonth() &&
        paymentDate.getFullYear() === today.getFullYear()
      )
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Payments
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          View your payment history
        </Text>
      </View>

      {studentLoading || paymentsLoading ? (
        <View style={styles.inlineLoadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading payments...
          </Text>
        </View>
      ) : !studentData ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text variant="titleMedium" style={styles.errorText}>
            Student profile not found
          </Text>
        </View>
      ) : (
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7B2CBF" />
        }
      >
        {/* Balance Summary Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="wallet" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Payment Summary
              </Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Total Paid
                </Text>
                <Text variant="headlineSmall" style={styles.summaryValue}>
                  ₹{Number(studentData.paid || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Remaining Balance
                </Text>
                <Text
                  variant="headlineSmall"
                  style={[
                    styles.summaryValue,
                    { color: Number(studentData.balance || 0) > 0 ? '#EF4444' : '#10B981' },
                  ]}
                >
                  ₹{Number(studentData.balance || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Plan Total
              </Text>
              <Text variant="headlineSmall" style={styles.summaryValue}>
                ₹{Number(studentData.price || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <Chip
            selected={dateFilter === 'all'}
            onPress={() => setDateFilter('all')}
            style={[styles.chip, dateFilter === 'all' && styles.chipSelected]}
            mode={dateFilter === 'all' ? 'flat' : 'outlined'}
            selectedColor="#7B2CBF"
          >
            All
          </Chip>
          <Chip
            selected={dateFilter === 'today'}
            onPress={() => setDateFilter('today')}
            style={[styles.chip, dateFilter === 'today' && styles.chipSelected]}
            mode={dateFilter === 'today' ? 'flat' : 'outlined'}
            selectedColor="#7B2CBF"
          >
            Today
          </Chip>
          <Chip
            selected={dateFilter === 'week'}
            onPress={() => setDateFilter('week')}
            style={[styles.chip, dateFilter === 'week' && styles.chipSelected]}
            mode={dateFilter === 'week' ? 'flat' : 'outlined'}
            selectedColor="#7B2CBF"
          >
            This Week
          </Chip>
          <Chip
            selected={dateFilter === 'month'}
            onPress={() => setDateFilter('month')}
            style={[styles.chip, dateFilter === 'month' && styles.chipSelected]}
            mode={dateFilter === 'month' ? 'flat' : 'outlined'}
            selectedColor="#7B2CBF"
          >
            This Month
          </Chip>
        </View>

        {/* Payment History */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Payment History
          </Text>
          {dateFilter !== 'all' && (
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'} found
            </Text>
          )}
        </View>

        {paymentsError ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
              <Text variant="titleMedium" style={[styles.emptyTitle, { color: '#EF4444' }]}>
                Error loading payments
              </Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                {paymentsError instanceof Error ? paymentsError.message : 'Failed to load payments'}
              </Text>
            </Card.Content>
          </Card>
        ) : payments.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="cash-off" size={64} color="#D1D5DB" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No payments found
              </Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                {dateFilter !== 'all'
                  ? 'No payments found for the selected period'
                  : 'Your payment history will appear here'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} style={styles.paymentCard}>
              <Card.Content>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <View style={styles.amountRow}>
                      <Text variant="headlineSmall" style={styles.amount}>
                        ₹{Number(payment.amount).toLocaleString('en-IN')}
                      </Text>
                      <View
                        style={[
                          styles.methodBadge,
                          { backgroundColor: getMethodColor(payment.method) + '20' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={getMethodIcon(payment.method)}
                          size={14}
                          color={getMethodColor(payment.method)}
                        />
                        <Text
                          variant="labelSmall"
                          style={[styles.methodText, { color: getMethodColor(payment.method) }]}
                        >
                          {payment.method || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dateRow}>
                      <MaterialCommunityIcons name="calendar" size={16} color="#9CA3AF" />
                      <Text variant="bodyMedium" style={styles.dateText}>
                        {format(new Date(payment.paymentDate), 'dd MMMM yyyy')}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {/* This Month Summary */}
        {dateFilter === 'all' && thisMonthTotal > 0 && (
          <Card style={[styles.card, styles.summaryCard]}>
            <Card.Content>
              <View style={styles.monthSummary}>
                <MaterialCommunityIcons name="calendar-month" size={20} color="#7B2CBF" />
                <Text variant="bodyMedium" style={styles.monthSummaryText}>
                  This month: ₹{thisMonthTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inlineLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 8,
    fontSize: 12,
  },
  summaryValue: {
    fontWeight: '700',
    color: '#1A1A1A',
    fontSize: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 0,
  },
  chipSelected: {
    backgroundColor: '#7B2CBF',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#666',
  },
  paymentCard: {
    marginBottom: 12,
    elevation: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontWeight: '700',
    color: '#10B981',
    fontSize: 24,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#6B7280',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  monthSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthSummaryText: {
    color: '#374151',
    fontWeight: '600',
  },
})
