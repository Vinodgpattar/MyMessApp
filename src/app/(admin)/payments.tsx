import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import {
  Text,
  Button,
  FAB,
  ActivityIndicator,
  Snackbar,
  Chip,
  Menu,
  Searchbar,
  Card,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePayments, usePaymentStats, useDeletePayment } from '@/hooks/usePayments'
import { PaymentCard } from '@/components/payments/PaymentCard'
import { PaymentStatsCards } from '@/components/payments/PaymentStatsCards'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type DateFilter = 'all' | 'today' | 'week' | 'month'

export default function PaymentsScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [methodMenuVisible, setMethodMenuVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      default:
        return {}
    }
  }

  const dateRange = getDateRange()
  const { data: paymentsData, isLoading, refetch } = usePayments({
    search: searchQuery || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    method: methodFilter !== 'all' ? methodFilter : undefined,
  })

  const { data: stats, isLoading: statsLoading } = usePaymentStats()
  const deleteMutation = useDeletePayment()

  const payments = paymentsData?.payments || []

  // Search results - only when typing (Instagram-style)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return payments.filter((payment) =>
      payment.student.name.toLowerCase().includes(query) ||
      payment.student.rollNumber?.toLowerCase().includes(query) ||
      payment.student.email.toLowerCase().includes(query) ||
      payment.amount.toString().includes(query)
    )
  }, [payments, searchQuery])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleDelete = (paymentId: number) => {
    setDeleteId(paymentId)
    setDeleteConfirmVisible(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      await refetch()
      setDeleteConfirmVisible(false)
      setDeleteId(null)
      setSnackbarMessage('✅ Payment deleted successfully!')
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(`⚠️ ${error.message || 'Failed to delete payment'}`)
      setSnackbarVisible(true)
    }
  }

  const handleStatPress = (stat: 'total' | 'today' | 'month') => {
    switch (stat) {
      case 'today':
        setDateFilter('today')
        break
      case 'month':
        setDateFilter('month')
        break
      default:
        setDateFilter('all')
    }
  }

  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>
            Payments
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Record and track student payments
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        keyboardShouldPersistTaps="handled"
      >

        {/* Stats Cards */}
        {stats && <PaymentStatsCards stats={stats} onStatPress={handleStatPress} />}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by student name or roll number..."
            onChangeText={(text) => {
              setSearchQuery(text)
              setShowSearchResults(text.trim().length > 0)
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setShowSearchResults(true)
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowSearchResults(false), 200)
            }}
            value={searchQuery}
            style={styles.search}
          />
        </View>

        {/* Search Results - Instagram style */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <Card style={styles.searchResultsCard}>
            <Card.Content style={styles.searchResultsContent}>
              {isLoading ? (
                <View style={styles.resultsLoading}>
                  <ActivityIndicator size="small" color="#7B2CBF" />
                  <Text variant="bodySmall" style={styles.resultsLoadingText}>
                    Loading payments...
                  </Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.resultsEmpty}>
                  <Text variant="bodySmall" style={styles.resultsEmptyText}>
                    No payments found
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.resultsListContainer}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResults.map((payment) => (
                    <TouchableOpacity
                      key={payment.id}
                      style={styles.resultItem}
                      onPress={() => {
                        setSearchQuery('')
                        setShowSearchResults(false)
                        router.push(`/(admin)/payment-detail?id=${payment.id}`)
                      }}
                    >
                      <View style={styles.resultItemContent}>
                        <Text variant="bodyLarge" style={styles.resultItemName}>
                          {payment.student.name}
                        </Text>
                        <View style={styles.resultItemDetails}>
                          {payment.student.rollNumber && (
                            <Text variant="bodySmall" style={styles.resultItemDetail}>
                              Roll: {payment.student.rollNumber}
                            </Text>
                          )}
                          <Text variant="bodySmall" style={styles.resultItemDetail}>
                            ₹{payment.amount.toFixed(2)}
                          </Text>
                          <Text variant="bodySmall" style={styles.resultItemDetail}>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <MaterialCommunityIcons name="filter" size={16} color="#6B7280" />
              <Text variant="labelMedium" style={styles.filterSectionTitle}>
                Filters
              </Text>
            </View>
            
            <View style={styles.filters}>
              <View style={styles.filterGroup}>
                <Text variant="labelSmall" style={styles.filterLabel}>
                  Date Range
                </Text>
                <View style={styles.chipContainer}>
                  <Chip
                    selected={dateFilter === 'all'}
                    onPress={() => setDateFilter('all')}
                    style={[styles.chip, dateFilter === 'all' && styles.chipSelected]}
                    selectedColor="#7B2CBF"
                    mode={dateFilter === 'all' ? 'flat' : 'outlined'}
                  >
                    All
                  </Chip>
                  <Chip
                    selected={dateFilter === 'today'}
                    onPress={() => setDateFilter('today')}
                    style={[styles.chip, dateFilter === 'today' && styles.chipSelected]}
                    selectedColor="#10B981"
                    mode={dateFilter === 'today' ? 'flat' : 'outlined'}
                  >
                    Today
                  </Chip>
                  <Chip
                    selected={dateFilter === 'week'}
                    onPress={() => setDateFilter('week')}
                    style={[styles.chip, dateFilter === 'week' && styles.chipSelected]}
                    selectedColor="#3B82F6"
                    mode={dateFilter === 'week' ? 'flat' : 'outlined'}
                  >
                    Week
                  </Chip>
                  <Chip
                    selected={dateFilter === 'month'}
                    onPress={() => setDateFilter('month')}
                    style={[styles.chip, dateFilter === 'month' && styles.chipSelected]}
                    selectedColor="#F59E0B"
                    mode={dateFilter === 'month' ? 'flat' : 'outlined'}
                  >
                    Month
                  </Chip>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text variant="labelSmall" style={styles.filterLabel}>
                  Payment Method
                </Text>
                <Menu
                  visible={methodMenuVisible}
                  onDismiss={() => setMethodMenuVisible(false)}
                  anchor={
                    <Chip
                      onPress={() => setMethodMenuVisible(true)}
                      style={[styles.chip, methodFilter !== 'all' && styles.chipSelected]}
                      icon="chevron-down"
                      selectedColor="#6366F1"
                      mode={methodFilter !== 'all' ? 'flat' : 'outlined'}
                    >
                      {methodFilter === 'all' ? 'All Methods' : methodFilter}
                    </Chip>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setMethodFilter('all')
                      setMethodMenuVisible(false)
                    }}
                    title="All Methods"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMethodFilter('Cash')
                      setMethodMenuVisible(false)
                    }}
                    title="Cash"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMethodFilter('UPI')
                      setMethodMenuVisible(false)
                    }}
                    title="UPI"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMethodFilter('Online')
                      setMethodMenuVisible(false)
                    }}
                    title="Online"
                  />
                </Menu>
              </View>
            </View>
          </View>
        </View>

        {/* Loading State */}
        {(isLoading || statsLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading payments...
            </Text>
          </View>
        )}

        {/* Payments List - Hidden when showing search results */}
        {!isLoading && !statsLoading && !showSearchResults && (
          <View style={styles.list}>
            {payments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons name="cash-off" size={64} color="#D1D5DB" />
                </View>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No payments found
                </Text>
                <Text variant="bodySmall" style={styles.emptyText}>
                  {searchQuery || dateFilter !== 'all' || methodFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by recording a payment using the + button'}
                </Text>
                {!searchQuery && dateFilter === 'all' && methodFilter === 'all' && (
                  <Button
                    mode="contained"
                    onPress={() => router.push('/(admin)/add-payment')}
                    style={styles.emptyActionButton}
                    buttonColor="#7B2CBF"
                    icon="plus"
                  >
                    Record First Payment
                  </Button>
                )}
              </View>
            ) : (
              <>
                <View style={styles.resultsHeader}>
                  <Text variant="bodySmall" style={styles.resultsCount}>
                    {payments.length} {payments.length === 1 ? 'payment' : 'payments'} found
                  </Text>
                </View>
                {payments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    onPress={() => router.push(`/(admin)/payment-detail?id=${payment.id}`)}
                    onEdit={() => router.push(`/(admin)/edit-payment?id=${payment.id}`)}
                    onDelete={() => handleDelete(payment.id)}
                  />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        label="Record Payment"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/(admin)/add-payment')}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This will update the student's balance. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmVisible(false)
          setDeleteId(null)
        }}
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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB and tab bar
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
  emptyActionButton: {
    marginTop: 16,
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
  searchContainer: {
    marginBottom: 16,
  },
  search: {
    elevation: 0,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 14,
  },
  filters: {
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 8,
  },
  chipSelected: {
    borderWidth: 0,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
  },
  list: {
    gap: 12,
  },
  resultsHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  resultsCount: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 8,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 18,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#7B2CBF',
  },
})


