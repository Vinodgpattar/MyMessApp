import React from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { useQuery } from '@tanstack/react-query'
import { getCurrentMeal } from '@/lib/qr-attendance'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'

export default function StudentDashboardScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const router = useRouter()

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

  const currentMeal = getCurrentMeal()
  const student = studentData
  const { unreadCount } = useUnreadNotifications()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          {isLoading ? (
            <>
              <Text variant="headlineSmall" style={styles.title}>
                Dashboard
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Loading...
              </Text>
            </>
          ) : student ? (
            <>
              <Text variant="headlineSmall" style={styles.title}>
                Welcome, {student.name}
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                {student.rollNumber || 'Student Dashboard'}
              </Text>
            </>
          ) : (
            <>
              <Text variant="headlineSmall" style={styles.title}>
                Dashboard
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Student profile not found
              </Text>
            </>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.inlineLoadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading dashboard...
          </Text>
        </View>
      ) : !student ? (
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
        >
        {/* Notification Banner */}
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(student)/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <Card style={styles.notificationBanner}>
              <Card.Content style={styles.notificationBannerContent}>
                <View style={styles.notificationBannerLeft}>
                  <MaterialCommunityIcons name="bell" size={24} color="#7B2CBF" />
                  <View style={styles.notificationBannerText}>
                    <Text variant="titleSmall" style={styles.notificationBannerTitle}>
                      {unreadCount} New Announcement{unreadCount > 1 ? 's' : ''}
                    </Text>
                    <Text variant="bodySmall" style={styles.notificationBannerSubtitle}>
                      Tap to view
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#7B2CBF" />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}

        {/* Profile Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account-circle" size={48} color="#7B2CBF" />
              </View>
              <View style={styles.profileInfo}>
                <Text variant="titleLarge" style={styles.profileName}>
                  {student.name}
                </Text>
                <Text variant="bodyMedium" style={styles.profileEmail}>
                  {student.email}
                </Text>
                {student.rollNumber && (
                  <Text variant="bodySmall" style={styles.profileRoll}>
                    Roll: {student.rollNumber}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Plan Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Plan Details
              </Text>
            </View>
            <View style={styles.planInfo}>
              <View style={styles.planRow}>
                <Text variant="bodyMedium" style={styles.planLabel}>Plan:</Text>
                <Text variant="bodyLarge" style={styles.planValue}>
                  {student.plan.name}
                </Text>
              </View>
              <View style={styles.planRow}>
                <Text variant="bodyMedium" style={styles.planLabel}>Meals:</Text>
                <Text variant="bodyLarge" style={styles.planValue}>
                  {student.plan.meals}
                </Text>
              </View>
              <View style={styles.planRow}>
                <Text variant="bodyMedium" style={styles.planLabel}>Status:</Text>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.planValue,
                    student.isActive ? styles.activeStatus : styles.inactiveStatus,
                  ]}
                >
                  {student.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* QR Scanner Card - Quick Access */}
        <Card style={[styles.card, styles.qrCard]}>
          <Card.Content style={styles.qrCardContent}>
            <MaterialCommunityIcons name="qrcode-scan" size={56} color="#7B2CBF" />
            <Text variant="titleLarge" style={styles.qrTitle}>
              Mark Attendance
            </Text>
            <Text variant="bodyMedium" style={styles.qrDescription}>
              Scan the QR code at the mess to mark your attendance quickly
            </Text>
            {currentMeal && (
              <View style={styles.currentMealBadge}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#7B2CBF" />
                <Text variant="bodySmall" style={styles.currentMealText}>
                  Current: {currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)}
                </Text>
              </View>
            )}
            <Button
              mode="contained"
              onPress={() => router.push('/(student)/qr-scanner')}
              style={styles.qrButton}
              buttonColor="#7B2CBF"
              icon="qrcode-scan"
              contentStyle={styles.qrButtonContent}
            >
              Scan QR Code
            </Button>
          </Card.Content>
        </Card>

        {/* Balance Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="wallet" size={24} color="#10B981" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Balance
              </Text>
            </View>
            <View style={styles.balanceInfo}>
              <View style={styles.balanceRow}>
                <Text variant="bodyMedium" style={styles.balanceLabel}>Balance:</Text>
                <Text variant="headlineSmall" style={styles.balanceValue}>
                  ₹{student.balance.toFixed(2)}
                </Text>
              </View>
              {student.credit > 0 && (
                <View style={styles.balanceRow}>
                  <Text variant="bodyMedium" style={styles.balanceLabel}>Credit:</Text>
                  <Text variant="headlineSmall" style={styles.creditValue}>
                    ₹{student.credit.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Info
          </Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="calendar-start" size={32} color="#6366F1" />
                <Text variant="bodySmall" style={styles.statLabel}>Start Date</Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {new Date(student.joinDate).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="calendar-end" size={32} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.statLabel}>End Date</Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {new Date(student.endDate).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#666',
    marginBottom: 4,
  },
  profileRoll: {
    color: '#9CA3AF',
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
  planInfo: {
    gap: 12,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    color: '#666',
  },
  planValue: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activeStatus: {
    color: '#10B981',
  },
  inactiveStatus: {
    color: '#EF4444',
  },
  balanceInfo: {
    gap: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#666',
  },
  balanceValue: {
    fontWeight: '700',
    color: '#EF4444',
  },
  creditValue: {
    fontWeight: '700',
    color: '#10B981',
  },
  statsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statLabel: {
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
    color: '#1A1A1A',
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
  qrCard: {
    backgroundColor: '#F9FAFF',
    borderColor: '#E0E7FF',
    borderWidth: 2,
  },
  qrCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  qrTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  qrDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  currentMealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    marginBottom: 16,
  },
  currentMealText: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  qrButton: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
  qrButtonContent: {
    paddingVertical: 8,
  },
  notificationBanner: {
    marginBottom: 16,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 12,
  },
  notificationBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  notificationBannerText: {
    flex: 1,
  },
  notificationBannerTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  notificationBannerSubtitle: {
    color: '#6B7280',
    fontSize: 12,
  },
})

