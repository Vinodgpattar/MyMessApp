import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useDashboardData } from '@/hooks/useDashboard'
import { NotificationStatusCard } from '@/components/dashboard/NotificationStatusCard'
import { CurrentMealBanner } from '@/components/dashboard/CurrentMealBanner'
import { TodaySummaryCards } from '@/components/dashboard/TodaySummaryCards'
import { EnhancedQuickActions } from '@/components/dashboard/EnhancedQuickActions'
import { AlertsCard } from '@/components/dashboard/AlertsCard'
import { AttendanceTrendCard } from '@/components/dashboard/AttendanceTrendCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickStatsCards } from '@/components/dashboard/QuickStatsCards'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotifications } from '@/context/NotificationContext'

export default function ModernDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const { data, isLoading, error, refetch, isRefetching } = useDashboardData()
  const [refreshing, setRefreshing] = useState(false)
  const { isEnabled, permissionsGranted } = useNotifications()

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const today = format(new Date(), 'EEEE, MMM dd, yyyy')
  const time = format(new Date(), 'h:mm a')

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#7B2CBF" />
            </View>
            <Text variant="headlineSmall" style={styles.brandName}>
              Mess Manager
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(admin)/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#1F2937" />
            {/* Show red dot if notifications disabled or no permissions */}
            {(!isEnabled || !permissionsGranted) && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(admin)/(tabs)/more')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-circle" size={28} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Meal Banner (only shows when active) */}
      {data?.currentMeal && (
        <CurrentMealBanner data={data.currentMeal} loading={isLoading} />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Status Card (only show if disabled or no permissions) */}
        {(!isEnabled || !permissionsGranted) && (
          <NotificationStatusCard />
        )}

        {/* Today's Performance */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📊 Today's Performance
          </Text>
          <TodaySummaryCards data={data?.todaySummary || null} loading={isLoading} />
        </View>

        {/* Quick Actions */}
        <EnhancedQuickActions />

        {/* Attendance Trend */}
        {data?.attendanceTrend && (
          <AttendanceTrendCard
            todayPercentage={data.attendanceTrend.todayPercentage}
            yesterdayPercentage={data.attendanceTrend.yesterdayPercentage}
            loading={isLoading}
          />
        )}

        {/* Alerts */}
        <AlertsCard alerts={data?.alerts || []} loading={isLoading} />

        {/* Recent Activity */}
        {data?.activities && data.activities.length > 0 && (
          <ActivityFeed activities={data.activities} loading={isLoading} />
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📊 Key Metrics
          </Text>
          <QuickStatsCards data={data?.quickStats || null} loading={isLoading} />
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 0, // Banner provides spacing
    paddingBottom: 80, // Space for tab bar
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
})
