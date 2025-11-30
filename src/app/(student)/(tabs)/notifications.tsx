import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native'
import { Text, Card, ActivityIndicator, Button } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, formatDistanceToNow } from 'date-fns'
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'

interface AdminNotification {
  id: number
  notification: {
    id: number
    title: string
    message: string
    imageUrl: string | null
    sentAt: string
  }
  read: boolean
  readAt: string | null
}

export default function StudentNotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [studentId, setStudentId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  // Get student ID
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user?.id) return
      const result = await getStudentByUserId(user.id)
      if (result.student) {
        setStudentId(result.student.id)
      }
    }
    fetchStudentId()
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!studentId) {
      logger.debug('No studentId available for fetching notifications')
      setLoading(false)
      return
    }

    try {
      logger.debug('Fetching notifications', { studentId })
      
      // First, let's check if we can query the table at all
      const { data: testData, error: testError } = await supabase
        .from('AdminNotificationRecipient')
        .select('id, studentId')
        .eq('studentId', studentId)
        .limit(1)

      if (testError) {
        logger.error('Error testing AdminNotificationRecipient query', testError as Error, { 
          studentId,
          errorCode: testError.code,
          errorMessage: testError.message,
        })
      } else {
        logger.debug('Test query successful', { 
          studentId,
          hasRecords: (testData?.length || 0) > 0,
        })
      }

      // Now fetch with full details
      // Note: Can't order by nested relation field, so we'll fetch and sort in memory
      const { data, error } = await supabase
        .from('AdminNotificationRecipient')
        .select(`
          id,
          read,
          readAt,
          notification:AdminNotification (
            id,
            title,
            message,
            imageUrl,
            sentAt
          )
        `)
        .eq('studentId', studentId)

      if (error) {
        logger.error('Error fetching notifications', error as Error, { 
          studentId,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        })
        throw error
      }

      logger.debug('Notifications fetched successfully', { 
        studentId, 
        count: data?.length || 0,
        notifications: data?.map(n => ({
          id: n.id,
          read: n.read,
          notificationId: n.notification?.id,
          title: n.notification?.title,
        })),
      })

      // Filter out any records where notification is null (shouldn't happen, but just in case)
      let validNotifications = (data || []).filter(n => n.notification !== null)
      
      // Sort by notification sentAt date (newest first) since we can't order by nested field in query
      validNotifications = validNotifications.sort((a, b) => {
        const dateA = a.notification?.sentAt ? new Date(a.notification.sentAt).getTime() : 0
        const dateB = b.notification?.sentAt ? new Date(b.notification.sentAt).getTime() : 0
        return dateB - dateA // Descending order (newest first)
      })
      
      logger.debug('Valid notifications after filtering and sorting', {
        studentId,
        validCount: validNotifications.length,
      })

      setNotifications(validNotifications as AdminNotification[])
      
      // Invalidate unread count query to refresh badge
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', studentId] })
    } catch (error) {
      logger.error('Unexpected error fetching notifications', error as Error, { studentId })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [studentId, queryClient])

  useFocusEffect(
    useCallback(() => {
      if (studentId) {
        fetchNotifications()
      }
    }, [studentId, fetchNotifications])
  )

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const handleNotificationPress = async (notification: AdminNotification) => {
    if (!notification.read) {
      // Mark as read
      try {
        await supabase
          .from('AdminNotificationRecipient')
          .update({
            read: true,
            readAt: new Date().toISOString(),
          })
          .eq('id', notification.id)

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        )
        
        // Invalidate unread count query to refresh badge
        if (studentId) {
          queryClient.invalidateQueries({ queryKey: ['unread-notifications', studentId] })
        }
      } catch (error) {
        logger.error('Error marking notification as read', error as Error, {
          notificationId: notification.id,
        })
      }
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } else if (daysDiff === 1) {
      return 'Yesterday'
    } else if (daysDiff < 7) {
      return format(new Date(date), 'EEEE')
    } else {
      return format(new Date(date), 'MMM dd, yyyy')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    if (!studentId || unreadCount === 0) return

    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      await supabase
        .from('AdminNotificationRecipient')
        .update({
          read: true,
          readAt: new Date().toISOString(),
        })
        .in('id', unreadIds)

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      )
      
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', studentId] })
    } catch (error) {
      logger.error('Error marking all notifications as read', error as Error)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.title}>
            Announcements
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text variant="labelSmall" style={styles.badgeText}>
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <View style={styles.actionBar}>
          <Button
            mode="text"
            onPress={handleMarkAllRead}
            textColor="#7B2CBF"
            icon="check-all"
            compact
          >
            Mark All Read
          </Button>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-outline" size={64} color="#D1D5DB" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Announcements
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            You'll see announcements from admin here
          </Text>
          {studentId && (
            <Text variant="bodySmall" style={[styles.emptyText, { marginTop: 8, fontSize: 11 }]}>
              Student ID: {studentId}
            </Text>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((item) => {
            const notification = item.notification
            const icon = 'bullhorn'
            const colors = ['#6366F1', '#4F46E5'] as [string, string]
            const timeAgo = notification.sentAt && !isNaN(new Date(notification.sentAt).getTime())
              ? formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })
              : 'Recently'

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
                style={styles.notificationContainer}
              >
                <LinearGradient
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.notificationBanner}
                >
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerLeft}>
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name={icon as any} size={24} color="#fff" />
                      </View>
                      <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                          <Text variant="titleMedium" style={styles.notificationTitle} numberOfLines={2}>
                            {notification.title}
                          </Text>
                          {!item.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <Text variant="bodyMedium" style={styles.notificationMessage} numberOfLines={3}>
                          {notification.message}
                        </Text>
                        <Text variant="labelSmall" style={styles.notificationTime}>
                          {timeAgo}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bannerRight}>
                      {notification.imageUrl && (
                        <Image
                          source={{ uri: notification.imageUrl }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )
          })}
          <View style={styles.bottomPadding} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  actionBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  notificationContainer: {
    marginBottom: 12,
  },
  notificationBanner: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 2,
  },
  notificationTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  notificationMessage: {
    color: '#fff',
    opacity: 0.95,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  notificationTime: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 11,
    marginTop: 4,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  bottomPadding: {
    height: 20,
  },
})

