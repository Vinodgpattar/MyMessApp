import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Text, FAB, ActivityIndicator, Searchbar, Card } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePlans, useDeletePlan } from '@/hooks/usePlans'
import { PlanCard } from '@/components/plans/PlanCard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PlansScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const { data, isLoading, error, refetch } = usePlans()
  const deleteMutation = useDeletePlan()

  const allPlans = data?.plans || []
  
  // Search results - only when typing (Instagram-style)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return allPlans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.meals.toLowerCase().includes(query)
    )
  }, [allPlans, searchQuery])
  
  // Filter plans based on search query (for main list)
  const plans = React.useMemo(() => {
    if (!searchQuery.trim()) return allPlans
    const query = searchQuery.toLowerCase()
    return allPlans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.meals.toLowerCase().includes(query)
    )
  }, [allPlans, searchQuery])

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

  if (isLoading && plans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading plans...
        </Text>
      </View>
    )
  }

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
            Plans Management
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Create and manage meal plans for students
          </Text>
        </View>
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#dc2626" />
          <Text variant="titleMedium" style={styles.errorTitle}>
            Error loading plans
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error.message || 'Failed to load plans. Please try again.'}
          </Text>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={64} color="#9ca3af" />
          <Text variant="titleLarge" style={styles.emptyTitle}>
            No plans created yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Click the + button to create your first meal plan
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(admin)/add-plan')}
            style={styles.emptyActionButton}
            buttonColor="#7B2CBF"
            icon="plus"
          >
            Create First Plan
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search plans by name or meals..."
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
                      Loading plans...
                    </Text>
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={styles.resultsEmpty}>
                    <Text variant="bodySmall" style={styles.resultsEmptyText}>
                      No plans found
                    </Text>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.resultsListContainer}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {searchResults.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={styles.resultItem}
                        onPress={() => {
                          setSearchQuery('')
                          setShowSearchResults(false)
                          router.push(`/(admin)/edit-plan?id=${plan.id}`)
                        }}
                      >
                        <View style={styles.resultItemContent}>
                          <Text variant="bodyLarge" style={styles.resultItemName}>
                            {plan.name}
                          </Text>
                          <View style={styles.resultItemDetails}>
                            <Text variant="bodySmall" style={styles.resultItemDetail}>
                              {plan.meals}
                            </Text>
                            <Text variant="bodySmall" style={styles.resultItemDetail}>
                              ₹{plan.price.toFixed(2)}
                            </Text>
                            <Text variant="bodySmall" style={styles.resultItemDetail}>
                              {plan.durationDays} days
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

          {/* Plans Count - Hidden when showing search results */}
          {!showSearchResults && plans.length > 0 && (
            <View style={styles.countContainer}>
              <Text variant="bodySmall" style={styles.countText}>
                {plans.length} {plans.length === 1 ? 'plan' : 'plans'} found
              </Text>
            </View>
          )}

          {/* Plans List - Hidden when showing search results */}
          {!showSearchResults && plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              onPress={() => router.push(`/(admin)/edit-plan?id=${plan.id}`)}
              onEdit={() => router.push(`/(admin)/edit-plan?id=${plan.id}`)}
              onDelete={() => setDeleteConfirm(plan.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/(admin)/add-plan')}
        label="Add Plan"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteConfirm}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
        confirmColor="#dc2626"
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    paddingBottom: 100, // Space for FAB and tab bar
  },
  searchContainer: {
    marginBottom: 16,
  },
  search: {
    elevation: 0,
    backgroundColor: '#fff',
  },
  countContainer: {
    marginBottom: 12,
  },
  countText: {
    color: '#6B7280',
    fontWeight: '500',
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
    margin: 16,
    right: 0,
    backgroundColor: '#7B2CBF',
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
})


