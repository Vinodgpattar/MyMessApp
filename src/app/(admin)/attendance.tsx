import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import {
  Text,
  Button,
  ActivityIndicator,
  Snackbar,
  Card,
  Chip,
  Divider,
  SegmentedButtons,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAttendanceView, useMarkAttendance, useUpdateAttendance, useDeleteAttendance, useMarkBulkAttendance } from '@/hooks/useAttendance'
import { getCurrentMeal } from '@/lib/attendance'
import { MealSelector } from '@/components/attendance/MealSelector'
import { EnhancedStudentCard } from '@/components/attendance/EnhancedStudentCard'
import { QuickFiltersBar, MealFilter, StatusFilter } from '@/components/attendance/QuickFiltersBar'
import { BulkMarkModal } from '@/components/attendance/BulkMarkModal'
import { EditAttendanceModal } from '@/components/attendance/EditAttendanceModal'
import { SimpleDatePicker } from '@/components/shared/SimpleDatePicker'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function AttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | null>(
    getCurrentMeal()
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [mealFilter, setMealFilter] = useState<MealFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [bulkMarkVisible, setBulkMarkVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [mealLoading, setMealLoading] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null)
  const [showMealSelector, setShowMealSelector] = useState(true)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const { data: attendanceView, isLoading, refetch } = useAttendanceView(selectedDate, selectedMeal)
  const markMutation = useMarkAttendance()
  const updateMutation = useUpdateAttendance()
  const deleteMutation = useDeleteAttendance()
  const bulkMarkMutation = useMarkBulkAttendance()

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Get status for a student
  const getStudentStatus = (student: any): 'full' | 'partial' | 'none' => {
    const { breakfast, lunch, dinner } = student.attendance
    const planMeals = student.plan.meals.map((m: string) => m.toLowerCase())
    
    const eligibleMeals = []
    if (planMeals.some(m => m.includes('breakfast'))) eligibleMeals.push(breakfast)
    if (planMeals.some(m => m.includes('lunch'))) eligibleMeals.push(lunch)
    if (planMeals.some(m => m.includes('dinner'))) eligibleMeals.push(dinner)
    
    const mealCount = eligibleMeals.filter(Boolean).length
    const totalEligibleMeals = eligibleMeals.length
    
    if (mealCount === totalEligibleMeals && totalEligibleMeals > 0) return 'full'
    if (mealCount > 0) return 'partial'
    return 'none'
  }

  // Check if student has meal marked
  const hasMealMarked = (student: any, meal: 'breakfast' | 'lunch' | 'dinner' | null) => {
    if (!meal) return false
    return student.attendance[meal]
  }

  // Check if student is eligible for meal
  const isEligibleForMeal = (student: any, meal: 'breakfast' | 'lunch' | 'dinner') => {
    return student.plan.meals.some((m: string) => m.toLowerCase().includes(meal))
  }

  // Search results - only when typing (Instagram-style)
  const searchResults = useMemo(() => {
    if (!attendanceView || !searchQuery.trim()) return []
    
    const allStudents = [...attendanceView.students.present, ...attendanceView.students.missing]
    const query = searchQuery.toLowerCase()
    return allStudents.filter((student) =>
      student.name.toLowerCase().includes(query) ||
      student.rollNumber?.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    )
  }, [attendanceView, searchQuery])

  // Filter students based on all filters (for main list)
  const filteredStudents = useMemo(() => {
    if (!attendanceView) return []

    // Combine present and missing students
    const allStudents = [...attendanceView.students.present, ...attendanceView.students.missing]

    let filtered = allStudents

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((student) =>
        student.name.toLowerCase().includes(query) ||
        student.rollNumber?.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      )
    }

    // Apply meal filter
    if (selectedMeal && mealFilter !== 'all') {
      filtered = filtered.filter((student) => {
        const hasMeal = hasMealMarked(student, selectedMeal)
        const isEligible = isEligibleForMeal(student, selectedMeal)
        
        if (!isEligible) return false
        
        if (mealFilter === 'present') return hasMeal
        if (mealFilter === 'missing') return !hasMeal
        return true
      })
    } else if (!selectedMeal && mealFilter !== 'all') {
      filtered = filtered.filter((student) => {
        const hasAny = student.attendance.breakfast || 
                      student.attendance.lunch || 
                      student.attendance.dinner
        
        if (mealFilter === 'present') return hasAny
        if (mealFilter === 'missing') return !hasAny
        return true
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => {
        const status = getStudentStatus(student)
        return status === statusFilter
      })
    }

    return filtered
  }, [attendanceView, searchQuery, mealFilter, statusFilter, selectedMeal])

  const handleToggleMeal = async (student: any, meal: 'breakfast' | 'lunch' | 'dinner') => {
    if (!isEligibleForMeal(student, meal)) {
      setSnackbarMessage(`Student plan does not include ${meal.charAt(0).toUpperCase() + meal.slice(1)}`)
      setSnackbarVisible(true)
      return
    }

    setMealLoading(meal)
    const currentStatus = student.attendance[meal]
    
    try {
      if (student.attendance.id && student.attendance.id > 0) {
        await updateMutation.mutateAsync({
          id: student.attendance.id,
          data: { [meal]: !currentStatus },
        })
      } else {
        await markMutation.mutateAsync({
          studentId: student.studentId,
          date: selectedDate,
          [meal]: !currentStatus,
        })
      }
      
      await refetch()
      setSnackbarMessage(`${meal.charAt(0).toUpperCase() + meal.slice(1)} attendance ${!currentStatus ? 'marked' : 'unmarked'}`)
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to mark attendance')
      setSnackbarVisible(true)
    } finally {
      setMealLoading(null)
    }
  }

  const handleMarkAll = async (student: any) => {
    const eligibleMeals = (['breakfast', 'lunch', 'dinner'] as const).filter(m => 
      isEligibleForMeal(student, m)
    )

    if (eligibleMeals.length === 0) {
      setSnackbarMessage('Student has no eligible meals in their plan')
      setSnackbarVisible(true)
      return
    }

    const mealsToMark = eligibleMeals.filter(meal => !student.attendance[meal])

    if (mealsToMark.length === 0) {
      setSnackbarMessage('All eligible meals are already marked')
      setSnackbarVisible(true)
      return
    }

    try {
      const attendanceData: { breakfast?: boolean; lunch?: boolean; dinner?: boolean } = {}
      mealsToMark.forEach(meal => {
        attendanceData[meal] = true
      })

      if (student.attendance.id && student.attendance.id > 0) {
        await updateMutation.mutateAsync({
          id: student.attendance.id,
          data: attendanceData,
        })
      } else {
        await markMutation.mutateAsync({
          studentId: student.studentId,
          date: selectedDate,
          ...attendanceData,
        })
      }
      
      await refetch()
      setSnackbarMessage(`Marked ${mealsToMark.length} meal${mealsToMark.length !== 1 ? 's' : ''} for ${student.name}`)
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to mark attendance')
      setSnackbarVisible(true)
    }
  }

  const handleEdit = (student: any) => {
    setSelectedStudent(student)
    setEditModalVisible(true)
  }

  const handleSaveEdit = async (data: { breakfast: boolean; lunch: boolean; dinner: boolean }) => {
    if (!selectedStudent) {
      setSnackbarMessage('No student selected')
      setSnackbarVisible(true)
      return
    }

    const planMeals = selectedStudent.plan.meals.map((m: string) => m.toLowerCase())
    if (data.breakfast && !planMeals.some(m => m.includes('breakfast'))) {
      setSnackbarMessage('Student plan does not include Breakfast')
      setSnackbarVisible(true)
      return
    }
    if (data.lunch && !planMeals.some(m => m.includes('lunch'))) {
      setSnackbarMessage('Student plan does not include Lunch')
      setSnackbarVisible(true)
      return
    }
    if (data.dinner && !planMeals.some(m => m.includes('dinner'))) {
      setSnackbarMessage('Student plan does not include Dinner')
      setSnackbarVisible(true)
      return
    }

    try {
      if (selectedStudent.attendance.id && selectedStudent.attendance.id > 0) {
        await updateMutation.mutateAsync({
          id: selectedStudent.attendance.id,
          data,
        })
      } else {
        await markMutation.mutateAsync({
          studentId: selectedStudent.studentId,
          date: selectedDate,
          breakfast: data.breakfast,
          lunch: data.lunch,
          dinner: data.dinner,
        })
      }
      
      setEditModalVisible(false)
      setSelectedStudent(null)
      await refetch()
      setSnackbarMessage(`Attendance updated for ${selectedStudent.name}`)
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to save attendance')
      setSnackbarVisible(true)
    }
  }

  const handleDelete = (student: any) => {
    if (!student.attendance.id || student.attendance.id === 0) {
      setSnackbarMessage('No attendance record found to delete')
      setSnackbarVisible(true)
      return
    }
    setDeleteId(student.attendance.id)
    setDeleteConfirmVisible(true)
  }

  const confirmDelete = async () => {
    if (!deleteId || deleteId <= 0) {
      setSnackbarMessage('No attendance record selected for deletion')
      setSnackbarVisible(true)
      setDeleteConfirmVisible(false)
      setDeleteId(null)
      return
    }

    try {
      await deleteMutation.mutateAsync({ id: deleteId, date: selectedDate })
      await refetch()
      setDeleteConfirmVisible(false)
      setDeleteId(null)
      setSnackbarMessage('Attendance record deleted')
      setSnackbarVisible(true)
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Failed to delete attendance'
      setSnackbarMessage(errorMessage)
      setSnackbarVisible(true)
    }
  }

  const handleBulkMark = async (studentIds: number[]) => {
    if (studentIds.length === 0) {
      setSnackbarMessage('Please select at least one student')
      setSnackbarVisible(true)
      return
    }

    let mealToUse = selectedMeal
    
    if (!mealToUse) {
      const currentMeal = getCurrentMeal()
      if (currentMeal) {
        mealToUse = currentMeal
        setSelectedMeal(currentMeal)
      } else {
        mealToUse = 'breakfast'
        setSelectedMeal('breakfast')
      }
    }

    try {
      await bulkMarkMutation.mutateAsync({
        studentIds,
        date: selectedDate,
        meal: mealToUse,
      })
      
      await refetch()
      setBulkMarkVisible(false)
      setSnackbarMessage(`Marked ${studentIds.length} student${studentIds.length !== 1 ? 's' : ''} for ${mealToUse.charAt(0).toUpperCase() + mealToUse.slice(1)}`)
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to mark attendance')
      setSnackbarVisible(true)
    }
  }

  const handleMarkAllMissing = async () => {
    if (!selectedMeal) {
      setSnackbarMessage('Please select a meal first')
      setSnackbarVisible(true)
      return
    }

    const missingStudents = filteredStudents.filter(student => {
      const isEligible = isEligibleForMeal(student, selectedMeal)
      const hasMeal = hasMealMarked(student, selectedMeal)
      return isEligible && !hasMeal
    })

    if (missingStudents.length === 0) {
      setSnackbarMessage('All eligible students are already marked')
      setSnackbarVisible(true)
      return
    }

    const studentIds = missingStudents.map(s => s.studentId)
    await handleBulkMark(studentIds)
  }

  const handleMarkAllPresent = async () => {
    if (!selectedMeal) {
      setSnackbarMessage('Please select a meal first')
      setSnackbarVisible(true)
      return
    }

    const presentStudents = filteredStudents.filter(student => {
      const isEligible = isEligibleForMeal(student, selectedMeal)
      const hasMeal = hasMealMarked(student, selectedMeal)
      return isEligible && hasMeal
    })

    if (presentStudents.length === 0) {
      setSnackbarMessage('No students are currently marked for this meal')
      setSnackbarVisible(true)
      return
    }

    try {
      const promises = presentStudents.map(async (student) => {
        if (student.attendance.id && student.attendance.id > 0) {
          return updateMutation.mutateAsync({
            id: student.attendance.id,
            data: { [selectedMeal]: false },
          })
        } else {
          return markMutation.mutateAsync({
            studentId: student.studentId,
            date: selectedDate,
            [selectedMeal]: false,
          })
        }
      })

      await Promise.all(promises)
      await refetch()
      setSnackbarMessage(`Unmarked ${presentStudents.length} student${presentStudents.length !== 1 ? 's' : ''} for ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}`)
      setSnackbarVisible(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to unmark attendance')
      setSnackbarVisible(true)
    }
  }

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const current = new Date(selectedDate)
    if (direction === 'prev') {
      current.setDate(current.getDate() - 1)
    } else if (direction === 'next') {
      current.setDate(current.getDate() + 1)
    } else {
      current.setTime(Date.now())
    }
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const insets = useSafeAreaInsets()

  // Calculate stats
  const totalStudents = filteredStudents.length
  const missingCount = filteredStudents.filter(s => {
    if (!selectedMeal) return !(s.attendance.breakfast || s.attendance.lunch || s.attendance.dinner)
    return isEligibleForMeal(s, selectedMeal) && !hasMealMarked(s, selectedMeal)
  }).length
  const presentCount = totalStudents - missingCount

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {/* Professional Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineSmall" style={styles.title}>
              Attendance
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {totalStudents} students • {presentCount} present • {missingCount} missing
            </Text>
          </View>
          <Button
            mode="text"
            icon={showMealSelector ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowMealSelector(!showMealSelector)}
            textColor="#7B2CBF"
            compact
          >
            {showMealSelector ? 'Hide' : 'Meals'}
          </Button>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7B2CBF" />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Navigation Card */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <View style={styles.dateHeader}>
              <View style={styles.dateHeaderLeft}>
                <MaterialCommunityIcons name="calendar" size={20} color="#7B2CBF" />
                <Text variant="titleMedium" style={styles.dateTitle}>
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              {!isToday && (
                <Button
                  mode="text"
                  icon="calendar-today"
                  onPress={() => navigateDate('today')}
                  compact
                  textColor="#7B2CBF"
                >
                  Today
                </Button>
              )}
            </View>
            <Divider style={styles.divider} />
            <View style={styles.dateControls}>
              <Button
                mode="outlined"
                icon="chevron-left"
                onPress={() => navigateDate('prev')}
                style={styles.dateButton}
                contentStyle={styles.dateButtonContent}
                buttonColor="#FFFFFF"
                textColor="#7B2CBF"
              >
                Previous
              </Button>
              <View style={styles.datePickerContainer}>
                <SimpleDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  label=""
                />
              </View>
              <Button
                mode="outlined"
                icon="chevron-right"
                iconPosition="right"
                onPress={() => navigateDate('next')}
                style={styles.dateButton}
                contentStyle={styles.dateButtonContent}
                buttonColor="#FFFFFF"
                textColor="#7B2CBF"
              >
                Next
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Meal Selector Card */}
        {showMealSelector && attendanceView && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <MealSelector
                selectedMeal={selectedMeal}
                onSelectMeal={setSelectedMeal}
                stats={attendanceView.stats}
              />
            </Card.Content>
          </Card>
        )}

        {/* Quick Filters Card */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <QuickFiltersBar
              searchQuery={searchQuery}
              onSearchChange={(text) => {
                setSearchQuery(text)
                setShowSearchResults(text.trim().length > 0)
              }}
              onSearchFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowSearchResults(true)
                }
              }}
              onSearchBlur={() => {
                setTimeout(() => setShowSearchResults(false), 200)
              }}
              mealFilter={mealFilter}
              onMealFilterChange={setMealFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              selectedMeal={selectedMeal}
            />
          </Card.Content>
        </Card>

        {/* Search Results - Instagram style: appears below search card */}
        {showSearchResults && searchQuery.trim().length > 0 && (
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
                      key={student.studentId}
                      style={styles.resultItem}
                      onPress={() => {
                        setSearchQuery('')
                        setShowSearchResults(false)
                        // Scroll to student in main list or highlight
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

        {/* Loading State */}
        {isLoading && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7B2CBF" />
                <Text variant="bodyMedium" style={styles.loadingText}>
                  Loading attendance...
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Students List - Hidden when showing search results */}
        {!isLoading && !showSearchResults && (
          <View style={styles.list}>
            {filteredStudents.length === 0 ? (
              <Card style={styles.sectionCard} mode="elevated" elevation={1}>
                <Card.Content>
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="account-off" size={64} color="#9CA3AF" />
                    <Text variant="titleMedium" style={styles.emptyTitle}>
                      No students found
                    </Text>
                    <Text variant="bodySmall" style={styles.emptyText}>
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : 'No students match the current filters'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ) : (
              filteredStudents.map((student) => (
                <EnhancedStudentCard
                  key={student.studentId}
                  student={student}
                  onToggleMeal={(meal) => handleToggleMeal(student, meal)}
                  onMarkAll={() => handleMarkAll(student)}
                  onEdit={() => handleEdit(student)}
                  onDelete={() => handleDelete(student)}
                  loading={markMutation.isPending || updateMutation.isPending}
                  mealLoading={mealLoading}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar - Mobile First */}
      {!isLoading && attendanceView && filteredStudents.length > 0 && selectedMeal && (
        <Card style={[styles.actionBar, { paddingBottom: insets.bottom + 8 }]} mode="elevated" elevation={4}>
          <Card.Content style={styles.actionBarContent}>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="check-all"
                onPress={handleMarkAllMissing}
                disabled={markMutation.isPending || updateMutation.isPending || bulkMarkMutation.isPending}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                buttonColor="#10B981"
                textColor="#FFFFFF"
                compact
              >
                Mark All Missing
              </Button>
              <Button
                mode="outlined"
                icon="close-circle"
                onPress={handleMarkAllPresent}
                disabled={markMutation.isPending || updateMutation.isPending || bulkMarkMutation.isPending}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                textColor="#EF4444"
                compact
              >
                Unmark All
              </Button>
              <Button
                mode="contained"
                icon="account-multiple-plus"
                onPress={() => {
                  if (!selectedMeal) {
                    const currentMeal = getCurrentMeal()
                    if (currentMeal) {
                      setSelectedMeal(currentMeal)
                    } else {
                      setSelectedMeal('breakfast')
                    }
                  }
                  setBulkMarkVisible(true)
                }}
                disabled={markMutation.isPending || updateMutation.isPending || bulkMarkMutation.isPending}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                buttonColor="#7B2CBF"
                textColor="#FFFFFF"
                compact
              >
                Bulk Select
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Bulk Mark Modal */}
      {attendanceView && (
        <BulkMarkModal
          visible={bulkMarkVisible}
          onDismiss={() => setBulkMarkVisible(false)}
          students={filteredStudents.filter(s => {
            if (!selectedMeal) return true
            return isEligibleForMeal(s, selectedMeal) && !hasMealMarked(s, selectedMeal)
          })}
          currentMeal={selectedMeal || 'breakfast'}
          onMark={handleBulkMark}
          loading={bulkMarkMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      <EditAttendanceModal
        visible={editModalVisible}
        onDismiss={() => {
          setEditModalVisible(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        date={selectedDate}
        onSave={handleSaveEdit}
        loading={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete Attendance"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
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
          label: 'OK',
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Space for action bar
  },
  searchResultsCard: {
    marginBottom: 16,
    marginHorizontal: 16,
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
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#E0E0E0',
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    borderRadius: 8,
    borderColor: '#7B2CBF',
  },
  dateButtonContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  datePickerContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666666',
  },
  list: {
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#666666',
    fontWeight: '600',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionBarContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
})
