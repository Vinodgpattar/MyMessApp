import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useDashboardData } from '@/hooks/useDashboard'
import { NotificationStatusCard } from '@/components/dashboard/NotificationStatusCard'
import { CurrentMealCard } from '@/components/dashboard/CurrentMealCard'
import { TodaySummaryCards } from '@/components/dashboard/TodaySummaryCards'
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid'
import { AlertsCard } from '@/components/dashboard/AlertsCard'
import { QuickStatsCards } from '@/components/dashboard/QuickStatsCards'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch, isRefetching } = useDashboardData()
  const [refreshing, setRefreshing] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace('/(auth)/admin-login')
    } catch (error) {
      // Logout error - silently handle
    }
  }

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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.userInfo}>
              <MaterialCommunityIcons name="account-circle" size={32} color="#7B2CBF" />
              <View style={styles.userText}>
                <Text variant="titleMedium" style={styles.welcomeText}>
                  Welcome, Admin!
                </Text>
                <Text variant="bodySmall" style={styles.emailText}>
                  {user?.email}
                </Text>
              </View>
            </View>
            <Text variant="bodySmall" style={styles.dateText}>
              📅 {today}
            </Text>
          </View>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonLabel}
          >
            Logout
          </Button>
        </View>

        {/* Notifications Status (Top Priority) */}
        <NotificationStatusCard />

        {/* Current Meal Status */}
        <CurrentMealCard data={data?.currentMeal || null} loading={isLoading} />

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📊 Today's Summary
          </Text>
          <TodaySummaryCards data={data?.todaySummary || null} loading={isLoading} />
        </View>

        {/* Quick Actions */}
        <QuickActionsGrid />

        {/* Alerts */}
        <AlertsCard alerts={data?.alerts || []} loading={isLoading} />

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📈 Quick Stats
          </Text>
          <QuickStatsCards data={data?.quickStats || null} loading={isLoading} />
        </View>

        {/* All Features Navigation */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📱 All Features
          </Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureRow}>
              <Button
                mode="outlined"
                onPress={() => router.push('/(admin)/plans')}
                icon="silverware-fork-knife"
                style={styles.featureButton}
                labelStyle={styles.featureButtonLabel}
              >
                Plans
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(admin)/students')}
                icon="account-group"
                style={styles.featureButton}
                labelStyle={styles.featureButtonLabel}
              >
                Students
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(admin)/attendance')}
                icon="clipboard-check"
                style={styles.featureButton}
                labelStyle={styles.featureButtonLabel}
              >
                Attendance
              </Button>
            </View>
            <View style={styles.featureRow}>
              <Button
                mode="outlined"
                onPress={() => router.push('/(admin)/payments')}
                icon="cash-multiple"
                style={styles.featureButton}
                labelStyle={styles.featureButtonLabel}
              >
                Payments
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(admin)/qr-generator')}
                icon="qrcode"
                style={styles.featureButton}
                labelStyle={styles.featureButtonLabel}
              >
                QR Code
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(admin)/notification-settings')}
                icon="bell-settings"
                style={styles.featureButton}
                labelStyle={styles.featureButtonLabel}
              >
                Settings
              </Button>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  userText: {
    flex: 1,
  },
  welcomeText: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  emailText: {
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    color: '#666',
    marginLeft: 44,
  },
  logoutButton: {
    borderRadius: 8,
  },
  logoutButtonLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  featuresGrid: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureButton: {
    flex: 1,
    borderRadius: 8,
  },
  featureButtonLabel: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 20,
  },
})
