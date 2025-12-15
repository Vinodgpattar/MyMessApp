import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { getAdminAnnouncementsWithCleanup, deleteAdminAnnouncement, AdminAnnouncement } from '@/lib/announcements'

export default function AnnouncementsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const result = await getAdminAnnouncementsWithCleanup()
      if (result.error) {
        setAnnouncements([])
      } else {
        setAnnouncements(result.announcements)
      }
    } catch (error) {
      setAnnouncements([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      fetchAnnouncements()
    }, [fetchAnnouncements])
  )

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnnouncements()
  }

  const handleAnnouncementPress = (announcement: AdminAnnouncement) => {
    router.push(`/(admin)/announcement-details?id=${announcement.id}`)
  }

  const handleDeleteAnnouncement = (announcement: AdminAnnouncement, event: any) => {
    event.stopPropagation() // Prevent navigation when clicking delete
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteAdminAnnouncement(announcement.id)
              if (result.success) {
                setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id))
              } else if (result.error) {
                Alert.alert('Error', result.error.message || 'Failed to delete announcement')
              }
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete announcement')
            }
          },
        },
      ]
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } else if (daysDiff === 1) {
      return 'Yesterday'
    } else if (daysDiff < 7) {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } else {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.title}>
          Sent Announcements
        </Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#D1D5DB" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Announcements Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Announcements you send will appear here
          </Text>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => router.push('/(admin)/send-announcement')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Send First Announcement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {announcements.map((announcement) => {
            const icon = 'bullhorn'
            const colors = ['#6366F1', '#4F46E5'] as [string, string]
            const timeAgo = announcement.sentAt && !isNaN(new Date(announcement.sentAt).getTime())
              ? formatTime(announcement.sentAt)
              : 'Recently'

            return (
              <TouchableOpacity
                key={announcement.id}
                onPress={() => handleAnnouncementPress(announcement)}
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
                            {announcement.title}
                          </Text>
                        </View>
                        <Text variant="bodyMedium" style={styles.notificationMessage} numberOfLines={3}>
                          {announcement.message}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text variant="labelSmall" style={styles.notificationTime}>
                            {timeAgo}
                          </Text>
                          <View style={styles.statsRow}>
                            <View style={styles.statBadge}>
                              <MaterialCommunityIcons name="send" size={12} color="#fff" />
                              <Text style={styles.statText}>{announcement.totalSent}</Text>
                            </View>
                            <View style={styles.statBadge}>
                              <MaterialCommunityIcons name="eye" size={12} color="#fff" />
                              <Text style={styles.statText}>{announcement.readCount}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.bannerRight}>
                      {announcement.imageUrl && (
                        <Image
                          source={{ uri: announcement.imageUrl }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                      )}
                      <TouchableOpacity
                        onPress={(e) => handleDeleteAnnouncement(announcement, e)}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#fff" />
                      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 20,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    marginTop: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  sendButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  notificationTime: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
  deleteButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomPadding: {
    height: 20,
  },
})
