import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, FAB, ActivityIndicator, Searchbar, Snackbar, Portal, Dialog, Button, Card } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useStudents, useStudentStats, useDeleteStudent, useSendCredentialsEmail } from '@/hooks/useStudents'
import { SwipeableStudentCard } from '@/components/students/SwipeableStudentCard'
import { QuickFilters } from '@/components/students/QuickFilters'
import { StudentStatsCards } from '@/components/students/StudentStatsCards'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { filterStudents, calculateFilterCounts, FilterType } from '@/lib/student-filters'
import { useCurrentMealStatus } from '@/hooks/useDashboard'

export default function StudentsScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [quickPayStudent, setQuickPayStudent] = useState<number | null>(null)
  const [quickPayAmount, setQuickPayAmount] = useState('')

  const { data: statsData } = useStudentStats()
  const stats = statsData?.stats || { totalStudents: 0, activeStudents: 0, inactiveStudents: 0 }
  const { data: currentMeal } = useCurrentMealStatus()

  // Fetch all students (we'll filter client-side for smart filters)
  // Note: For 'inactive' filter, we fetch all students because inactive includes
  // both isActive=false AND students with expired plans (isActive=true but endDate < today)
  const { data, isLoading, error, refetch } = useStudents(
    {
      page: 1,
      limit: 100, // Get more for client-side filtering
      search: searchTerm.trim().length >= 2 ? searchTerm.trim() : undefined,
      // Only filter by active for 'active' filter, not for 'inactive' (needs client-side logic)
      active: activeFilter === 'active' ? true : undefined,
    },
    { enabled: true }
  )

  const deleteMutation = useDeleteStudent()
  const sendEmailMutation = useSendCredentialsEmail()

  // Apply smart filters client-side
  const allStudents = data?.students || []
  const filteredStudents = useMemo(() => {
    return filterStudents(allStudents, activeFilter)
  }, [allStudents, activeFilter])

  // Search results for Instagram-style dropdown
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return []
    const query = searchTerm.toLowerCase()
    return allStudents.filter((student) =>
      student.name.toLowerCase().includes(query) ||
      student.rollNumber?.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    )
  }, [allStudents, searchTerm])

  const filterCounts = useMemo(() => {
    return calculateFilterCounts(allStudents)
  }, [allStudents])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteMutation.mutateAsync(deleteConfirm)
      setDeleteConfirm(null)
    } catch (error: any) {
      // Error is handled by the mutation
    }
  }

  // Hooks must be called before any conditional returns
  const insets = useSafeAreaInsets()

  if (isLoading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading students...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>
            Students
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Manage student registrations
          </Text>
        </View>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <StudentStatsCards stats={stats} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search students..."
          onChangeText={(text) => {
            setSearchTerm(text)
            setShowSearchResults(text.trim().length > 0)
          }}
          onFocus={() => {
            if (searchTerm.trim().length > 0) {
              setShowSearchResults(true)
            }
          }}
          onBlur={() => {
            // Delay hiding to allow tap on results
            setTimeout(() => setShowSearchResults(false), 200)
          }}
          value={searchTerm}
          style={styles.searchbar}
        />
      </View>

      {/* Search Results - Instagram style: appears below search bar */}
      {showSearchResults && searchTerm.trim().length > 0 && (
        <Card style={styles.searchResultsCard}>
          <Card.Content style={styles.searchResultsContent}>
            {isLoading ? (
              <View style={styles.resultsLoading}>
                <ActivityIndicator size="small" color="#7B2CBF" />
                <Text variant="bodySmall" style={styles.resultsLoadingText}>
                  Loading students...
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.resultsEmpty}>
                <Text variant="bodySmall" style={styles.resultsEmptyText}>
                  No students found
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.resultsListContainer}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={styles.resultItem}
                    onPress={() => {
                      setSearchTerm('')
                      setShowSearchResults(false)
                      router.push(`/(admin)/student-detail?id=${student.id}`)
                    }}
                  >
                    <View style={styles.resultItemContent}>
                      <Text variant="bodyLarge" style={styles.resultItemName}>
                        {student.name}
                      </Text>
                      <View style={styles.resultItemDetails}>
                        {student.rollNumber && (
                          <Text variant="bodySmall" style={styles.resultItemDetail}>
                            Roll: {student.rollNumber}
                          </Text>
                        )}
                        <Text variant="bodySmall" style={styles.resultItemDetail}>
                          {student.email}
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

      {/* Quick Filters */}
      <QuickFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {/* Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#dc2626" />
          <Text variant="titleMedium" style={styles.errorTitle}>
            Error loading students
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error.message || 'Failed to load students. Please try again.'}
          </Text>
        </View>
      ) : !showSearchResults && filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off" size={64} color="#9ca3af" />
          <Text variant="titleLarge" style={styles.emptyTitle}>
            No students registered yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Click the + button to register your first student
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(admin)/add-student')}
            style={styles.emptyActionButton}
            buttonColor="#7B2CBF"
            icon="plus"
          >
            Register First Student
          </Button>
        </View>
      ) : !showSearchResults ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          scrollEnabled={true}
        >
          {filteredStudents.map((student) => (
            <SwipeableStudentCard
              key={student.id}
              student={student}
              onPress={() => router.push(`/(admin)/student-detail?id=${student.id}`)}
              onViewDetails={() => router.push(`/(admin)/student-detail?id=${student.id}`)}
              onEdit={() => router.push(`/(admin)/edit-student?id=${student.id}`)}
              onDelete={() => setDeleteConfirm(student.id)}
              onQuickPay={() => {
                setQuickPayStudent(student.id)
                setQuickPayAmount('')
              }}
              onQuickEmail={async () => {
                try {
                  await sendEmailMutation.mutateAsync({ studentId: student.id })
                  setSnackbarMessage('✅ Credentials email sent successfully!')
                  setSnackbarVisible(true)
                } catch (error: any) {
                  setSnackbarMessage(`⚠️ ${error?.message || 'Failed to send email'}`)
                  setSnackbarVisible(true)
                }
              }}
              onQuickAttendance={() => {
                if (currentMeal?.meal) {
                  router.push(`/(admin)/(tabs)/attendance`)
                } else {
                  setSnackbarMessage('No active meal at the moment')
                  setSnackbarVisible(true)
                }
              }}
            />
          ))}
        </ScrollView>
      ) : null}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/(admin)/add-student')}
        label="Add Student"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteConfirm}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
        confirmColor="#dc2626"
      />

      {/* Quick Pay Dialog */}
      <Portal>
        <Dialog
          visible={!!quickPayStudent}
          onDismiss={() => {
            setQuickPayStudent(null)
            setQuickPayAmount('')
          }}
        >
          <Dialog.Title>Quick Payment</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Enter payment amount:
            </Text>
            <Searchbar
              placeholder="Amount (₹)"
              onChangeText={setQuickPayAmount}
              value={quickPayAmount}
              keyboardType="numeric"
              style={{ backgroundColor: '#F9FAFB' }}
            />
            <View style={styles.quickAmountButtons}>
              {[500, 1000, 2000, 5000].map((amount) => (
                <Button
                  key={amount}
                  mode="outlined"
                  onPress={() => setQuickPayAmount(amount.toString())}
                  style={styles.quickAmountButton}
                >
                  ₹{amount}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setQuickPayStudent(null)
              setQuickPayAmount('')
            }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (quickPayStudent && quickPayAmount) {
                  router.push(`/(admin)/add-payment?studentId=${quickPayStudent}&amount=${quickPayAmount}`)
                  setQuickPayStudent(null)
                  setQuickPayAmount('')
                }
              }}
              disabled={!quickPayAmount || parseFloat(quickPayAmount) <= 0}
            >
              Continue
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666',
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  statsContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#fff',
  },
  searchResultsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    elevation: 4,
    borderRadius: 12,
    maxHeight: 400,
  },
  searchResultsContent: {
    padding: 0,
  },
  resultsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  resultsLoadingText: {
    color: '#666',
  },
  resultsEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  resultsEmptyText: {
    color: '#666',
  },
  resultsListContainer: {
    maxHeight: 400,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultItemContent: {
    flex: 1,
  },
  resultItemName: {
    fontWeight: '600',
    color: '#1a1a1a',
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
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB and tab bar
  },
  emptyActionButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'center',
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#7B2CBF',
  },
})

