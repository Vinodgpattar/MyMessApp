import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator as RNActivityIndicator, Text as RNText, Modal as RNModal, RefreshControl } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Modal, Chip } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentMeal, markAttendanceFromQR, MarkAttendanceResult } from '@/lib/qr-attendance'
import { supabase } from '@/lib/supabase'
import { QRScanner } from '@/components/qr-scanner/QRScanner'
import { QRResultModal } from '@/components/qr-scanner/QRResultModal'
import { format } from 'date-fns'

export default function StudentAttendanceScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // QR Scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MarkAttendanceResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'week' | 'month' | 'all'>('week')

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const result = await getStudentByUserId(user.id)
      if (result.error) throw result.error
      return result.student
    },
    enabled: !!user?.id,
  })

  const { data: todayAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['today-attendance', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return null
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('Attendance')
        .select('breakfast, lunch, dinner')
        .eq('studentId', studentData.id)
        .eq('date', today)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      return data || { breakfast: false, lunch: false, dinner: false }
    },
    enabled: !!studentData?.id,
  })

  const currentMeal = getCurrentMeal()
  const todayStatus = todayAttendance || {
    breakfast: false,
    lunch: false,
    dinner: false,
  }

  // Calculate date range for history
  const getHistoryDateRange = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (historyFilter) {
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
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
        // All time - last 90 days
        const allStart = new Date(today)
        allStart.setDate(today.getDate() - 90)
        return {
          startDate: allStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
    }
  }

  const historyDateRange = getHistoryDateRange()

  // Fetch attendance history
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history', studentData?.id, historyFilter],
    queryFn: async () => {
      if (!studentData?.id) return []
      
      const { data, error } = await supabase
        .from('Attendance')
        .select('date, breakfast, lunch, dinner')
        .eq('studentId', studentData.id)
        .gte('date', historyDateRange.startDate)
        .lte('date', historyDateRange.endDate)
        .order('date', { ascending: false })

      if (error && error.code !== 'PGRST116') throw error
      return (data || []) as Array<{
        date: string
        breakfast: boolean
        lunch: boolean
        dinner: boolean
      }>
    },
    enabled: !!studentData?.id,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['today-attendance', studentData?.id] }),
      queryClient.invalidateQueries({ queryKey: ['attendance-history', studentData?.id] }),
    ])
    setRefreshing(false)
  }

  // Calculate statistics
  const history = attendanceHistory || []
  const totalMeals = history.reduce((sum, record) => {
    return sum + (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)
  }, 0)
  const totalDays = history.length
  const possibleMeals = totalDays * 3 // Assuming 3 meals per day
  const attendancePercentage = possibleMeals > 0 ? Math.round((totalMeals / possibleMeals) * 100) : 0

  const handleScan = useCallback(async (qrData: string) => {
    if (!user?.id) {
      setResult({
        success: false,
        message: 'User not authenticated. Please log in again.',
      })
      setShowResult(true)
      return
    }

    setLoading(true)
    try {
      const result = await markAttendanceFromQR(user.id)
      setResult(result)
      setShowResult(true)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['today-attendance', studentData?.id] }),
        queryClient.invalidateQueries({ queryKey: ['attendance-history', studentData?.id] }),
      ])
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unable to mark attendance. Please try again.',
      })
      setShowResult(true)
    } finally {
      setLoading(false)
    }
  }, [user?.id, studentData?.id, queryClient])

  const handleCloseScanner = useCallback(() => {
    setShowScanner(false)
  }, [])

  const handleCloseResult = useCallback(() => {
    setShowResult(false)
    setResult(null)
    setShowScanner(false)
  }, [])

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Attendance
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Mark your attendance
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.inlineLoadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading attendance...
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
        {/* Today's Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="calendar-today" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Today's Status
              </Text>
            </View>
            {loadingAttendance ? (
              <ActivityIndicator size="small" color="#7B2CBF" style={styles.loadingIndicator} />
            ) : (
              <View style={styles.mealStatus}>
                <View style={styles.mealRow}>
                  <MaterialCommunityIcons
                    name={todayStatus.breakfast ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={todayStatus.breakfast ? '#10B981' : '#9CA3AF'}
                  />
                  <Text variant="bodyMedium" style={styles.mealLabel}>
                    Breakfast
                  </Text>
                  {todayStatus.breakfast && (
                    <Text variant="bodySmall" style={styles.mealStatusText}>
                      Marked
                    </Text>
                  )}
                </View>
                <View style={styles.mealRow}>
                  <MaterialCommunityIcons
                    name={todayStatus.lunch ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={todayStatus.lunch ? '#10B981' : '#9CA3AF'}
                  />
                  <Text variant="bodyMedium" style={styles.mealLabel}>
                    Lunch
                  </Text>
                  {todayStatus.lunch && (
                    <Text variant="bodySmall" style={styles.mealStatusText}>
                      Marked
                    </Text>
                  )}
                </View>
                <View style={styles.mealRow}>
                  <MaterialCommunityIcons
                    name={todayStatus.dinner ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={todayStatus.dinner ? '#10B981' : '#9CA3AF'}
                  />
                  <Text variant="bodyMedium" style={styles.mealLabel}>
                    Dinner
                  </Text>
                  {todayStatus.dinner && (
                    <Text variant="bodySmall" style={styles.mealStatusText}>
                      Marked
                    </Text>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Scan QR Code Button */}
        <Card style={styles.card}>
          <Card.Content style={styles.scanCardContent}>
            <MaterialCommunityIcons name="qrcode-scan" size={48} color="#7B2CBF" />
            <Text variant="titleLarge" style={styles.scanTitle}>
              Scan QR Code
            </Text>
            <Text variant="bodyMedium" style={styles.scanDescription}>
              Scan the QR code at the mess to mark your attendance
            </Text>
            {currentMeal && (
              <Text variant="bodySmall" style={styles.currentMealText}>
                Current meal: {currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)}
              </Text>
            )}
            <Button
              mode="contained"
              onPress={() => setShowScanner(true)}
              style={styles.scanButton}
              buttonColor="#7B2CBF"
              icon="qrcode-scan"
            >
              Open Scanner
            </Button>
          </Card.Content>
        </Card>

        {/* Attendance Statistics Card */}
        {history.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#7B2CBF" />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Attendance Statistics
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total Meals
                  </Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {totalMeals}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Days Attended
                  </Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {totalDays}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Attendance Rate
                  </Text>
                  <Text variant="headlineSmall" style={[styles.statValue, { color: attendancePercentage >= 80 ? '#10B981' : attendancePercentage >= 60 ? '#F59E0B' : '#EF4444' }]}>
                    {attendancePercentage}%
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Attendance History */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="history" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Attendance History
              </Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
              <Chip
                selected={historyFilter === 'week'}
                onPress={() => setHistoryFilter('week')}
                style={[styles.chip, historyFilter === 'week' && styles.chipSelected]}
                mode={historyFilter === 'week' ? 'flat' : 'outlined'}
                selectedColor="#7B2CBF"
              >
                This Week
              </Chip>
              <Chip
                selected={historyFilter === 'month'}
                onPress={() => setHistoryFilter('month')}
                style={[styles.chip, historyFilter === 'month' && styles.chipSelected]}
                mode={historyFilter === 'month' ? 'flat' : 'outlined'}
                selectedColor="#7B2CBF"
              >
                This Month
              </Chip>
              <Chip
                selected={historyFilter === 'all'}
                onPress={() => setHistoryFilter('all')}
                style={[styles.chip, historyFilter === 'all' && styles.chipSelected]}
                mode={historyFilter === 'all' ? 'flat' : 'outlined'}
                selectedColor="#7B2CBF"
              >
                All Time
              </Chip>
            </View>

            {/* History List */}
            {historyLoading ? (
              <ActivityIndicator size="small" color="#7B2CBF" style={styles.loadingIndicator} />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color="#D1D5DB" />
                <Text variant="bodyMedium" style={styles.emptyHistoryText}>
                  No attendance records found
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.map((record) => {
                  const recordDate = new Date(record.date)
                  const isToday = record.date === new Date().toISOString().split('T')[0]
                  const mealsCount = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)

                  return (
                    <View key={record.date} style={styles.historyItem}>
                      <View style={styles.historyDate}>
                        <Text variant="bodyMedium" style={styles.historyDateText}>
                          {isToday ? 'Today' : format(recordDate, 'dd MMM yyyy')}
                        </Text>
                        <Text variant="bodySmall" style={styles.historyDayText}>
                          {format(recordDate, 'EEEE')}
                        </Text>
                      </View>
                      <View style={styles.historyMeals}>
                        <View style={styles.mealBadge}>
                          <MaterialCommunityIcons
                            name={record.breakfast ? 'check-circle' : 'circle-outline'}
                            size={16}
                            color={record.breakfast ? '#10B981' : '#D1D5DB'}
                          />
                          <Text variant="bodySmall" style={[styles.mealBadgeText, record.breakfast && styles.mealBadgeTextActive]}>
                            B
                          </Text>
                        </View>
                        <View style={styles.mealBadge}>
                          <MaterialCommunityIcons
                            name={record.lunch ? 'check-circle' : 'circle-outline'}
                            size={16}
                            color={record.lunch ? '#10B981' : '#D1D5DB'}
                          />
                          <Text variant="bodySmall" style={[styles.mealBadgeText, record.lunch && styles.mealBadgeTextActive]}>
                            L
                          </Text>
                        </View>
                        <View style={styles.mealBadge}>
                          <MaterialCommunityIcons
                            name={record.dinner ? 'check-circle' : 'circle-outline'}
                            size={16}
                            color={record.dinner ? '#10B981' : '#D1D5DB'}
                          />
                          <Text variant="bodySmall" style={[styles.mealBadgeText, record.dinner && styles.mealBadgeTextActive]}>
                            D
                          </Text>
                        </View>
                        <View style={styles.mealsCount}>
                          <Text variant="bodySmall" style={styles.mealsCountText}>
                            {mealsCount}/3
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Instructions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="information" size={24} color="#6366F1" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                How to Mark Attendance
              </Text>
            </View>
            <View style={styles.instructions}>
              <Text variant="bodySmall" style={styles.instructionText}>
                1. Tap "Open Scanner" button{'\n'}
                2. Point camera at QR code at mess{'\n'}
                3. Attendance will be marked automatically{'\n'}
                4. You'll see a confirmation message{'\n\n'}
                Meal Timings:{'\n'}
                Breakfast: 7:00 AM - 11:00 AM{'\n'}
                Lunch: 12:00 PM - 4:00 PM{'\n'}
                Dinner: 7:00 PM - 11:00 PM
              </Text>
            </View>
          </Card.Content>
        </Card>
        </ScrollView>
      )}

      {/* QR Scanner Modal - Using React Native Modal to avoid navigation issues */}
      {showScanner && (
        <RNModal
          visible={showScanner}
          animationType="slide"
          transparent={false}
          onRequestClose={handleCloseScanner}
        >
          <View style={styles.scannerContainer}>
            <QRScanner onScan={handleScan} onClose={handleCloseScanner} />
            {loading && (
              <View style={styles.loadingOverlay}>
                <RNActivityIndicator size="large" color="#7B2CBF" />
                <RNText style={styles.loadingText}>Marking attendance...</RNText>
              </View>
            )}
          </View>
        </RNModal>
      )}

      {/* Result Modal */}
      <QRResultModal visible={showResult} result={result} onClose={handleCloseResult} />
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
  loadingIndicator: {
    marginVertical: 16,
  },
  mealStatus: {
    gap: 12,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealLabel: {
    flex: 1,
    color: '#1A1A1A',
  },
  mealStatusText: {
    color: '#10B981',
    fontWeight: '600',
  },
  scanCardContent: {
    alignItems: 'center',
    padding: 8,
  },
  scanTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scanDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  currentMealText: {
    color: '#7B2CBF',
    fontWeight: '600',
    marginBottom: 16,
  },
  scanButton: {
    marginTop: 8,
    paddingHorizontal: 32,
  },
  instructions: {
    marginTop: 8,
  },
  instructionText: {
    color: '#666',
    lineHeight: 24,
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
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    marginBottom: 8,
    fontSize: 12,
  },
  statValue: {
    fontWeight: '700',
    color: '#1A1A1A',
    fontSize: 24,
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
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyDate: {
    flex: 1,
  },
  historyDateText: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  historyDayText: {
    color: '#6B7280',
    fontSize: 12,
  },
  historyMeals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealBadgeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  mealBadgeTextActive: {
    color: '#10B981',
  },
  mealsCount: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#7B2CBF',
    borderRadius: 6,
  },
  mealsCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
})
