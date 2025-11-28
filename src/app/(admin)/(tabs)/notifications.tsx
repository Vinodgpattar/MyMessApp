import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Text, Card, Button, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useNotifications } from '@/context/NotificationContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, formatDistanceToNow } from 'date-fns'
import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'

export default function NotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { notificationHistory, clearHistory, isEnabled, permissionsGranted } = useNotifications()
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen is focused
    }, [])
  )

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleNotificationPress = (notification: typeof notificationHistory[0]) => {
    // Navigate to attendance screen if date is available
    if (notification.date) {
      router.push(`/(admin)/(tabs)/attendance?date=${notification.date}`)
    } else {
      router.push('/(admin)/(tabs)/attendance')
    }
  }

  const handleClearHistory = async () => {
    await clearHistory()
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
      return formatDistanceToNow(timestamp, { addSuffix: true })
    } else if (daysDiff === 1) {
      return 'Yesterday'
    } else if (daysDiff < 7) {
      return format(timestamp, 'EEEE')
    } else {
      return format(timestamp, 'MMM dd, yyyy')
    }
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.title}>
            Notifications
          </Text>
        </View>
        <View style={styles.headerActions}>
          {notificationHistory.length > 0 && (
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(admin)/(tabs)/settings')}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Banner */}
      {(!isEnabled || !permissionsGranted) && (
        <View style={styles.statusBanner}>
          <MaterialCommunityIcons name="bell-off" size={20} color="#f59e0b" />
          <Text style={styles.statusText}>
            Notifications are {!permissionsGranted ? 'disabled' : 'inactive'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.statusLink}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {notificationHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-outline" size={64} color="#D1D5DB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Attendance update notifications will appear here
            </Text>
            {(!isEnabled || !permissionsGranted) && (
              <Button
                mode="contained"
                onPress={() => router.push('/(admin)/(tabs)/settings')}
                style={styles.enableButton}
                buttonColor="#7B2CBF"
              >
                Enable Notifications
              </Button>
            )}
          </View>
        ) : (
          <>
            {notificationHistory.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <Card style={styles.notificationCard} mode="outlined">
                  <Card.Content>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationIcon}>
                        <MaterialCommunityIcons name="bell" size={20} color="#7B2CBF" />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text variant="titleSmall" style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        <Text variant="bodySmall" style={styles.notificationTime}>
                          {formatTime(notification.timestamp)}
                        </Text>
                      </View>
                    </View>
                    <Text variant="bodyMedium" style={styles.notificationBody}>
                      {notification.body}
                    </Text>
                    {notification.timeWindow && (
                      <View style={styles.timeWindow}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                        <Text variant="bodySmall" style={styles.timeWindowText}>
                          {notification.timeWindow.start} - {notification.timeWindow.end}
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
                {index < notificationHistory.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            ))}
          </>
        )}
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
  title: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    padding: 4,
  },
  settingsButton: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  statusText: {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
  },
  statusLink: {
    color: '#7B2CBF',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  enableButton: {
    marginTop: 16,
  },
  notificationCard: {
    marginBottom: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  notificationTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  notificationBody: {
    color: '#374151',
    lineHeight: 20,
    marginTop: 4,
  },
  timeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeWindowText: {
    color: '#6B7280',
    fontSize: 12,
  },
  divider: {
    height: 8,
  },
  bottomPadding: {
    height: 20,
  },
})
