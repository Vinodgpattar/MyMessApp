import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native'
import { Text, Card, ActivityIndicator } from 'react-native-paper'
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
      setLoading(false)
      return
    }

    try {
      logger.debug('Fetching notifications', { studentId })
      
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
        .order('notification.sentAt', { ascending: false })

      if (error) {
        logger.error('Error fetching notifications', error as Error, { studentId })
        throw error
      }

      logger.debug('Notifications fetched successfully', { 
        studentId, 
        count: data?.length || 0 
      })

      setNotifications((data || []) as AdminNotification[])
      
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
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.notificationCard,
                    !item.read && styles.unreadCard,
                  ]}
                  mode="outlined"
                >
                  <Card.Content>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationIcon}>
                        <MaterialCommunityIcons
                          name="megaphone"
                          size={20}
                          color="#7B2CBF"
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text variant="titleSmall" style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        <Text variant="bodySmall" style={styles.notificationTime}>
                          {formatTime(notification.sentAt)}
                        </Text>
                      </View>
                      {!item.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text variant="bodyMedium" style={styles.notificationBody}>
                      {notification.message}
                    </Text>
                    {notification.imageUrl && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: notification.imageUrl }}
                          style={styles.notificationImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </Card.Content>
                </Card>
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
  content: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7B2CBF',
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B2CBF',
    marginTop: 4,
  },
  notificationBody: {
    color: '#374151',
    lineHeight: 20,
    marginTop: 4,
  },
  imageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  notificationImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  bottomPadding: {
    height: 20,
  },
})

