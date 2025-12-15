import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAdminAnnouncementById, deleteAdminAnnouncement, AdminAnnouncement } from '@/lib/announcements'

export default function AdminAnnouncementDetailsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id?: string }>()
  const announcementId = params.id ? parseInt(params.id, 10) : NaN

  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isNaN(announcementId)) {
      void loadData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getAdminAnnouncementById(announcementId)
      if (result.error || !result.announcement) {
        setAnnouncement(null)
        return
      }
      setAnnouncement(result.announcement)
    } catch (error) {
      setAnnouncement(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (!announcement) return

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
                router.back()
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

  const getTargetTypeLabel = (targetType: string): string => {
    switch (targetType) {
      case 'all':
        return 'All Students'
      case 'active':
        return 'Active Only'
      case 'expiring':
        return 'Expiring Soon'
      case 'expired':
        return 'Expired'
      case 'custom':
        return 'Custom Selection'
      default:
        return targetType
    }
  }

  const getReadPercentage = (readCount: number, totalSent: number): number => {
    if (totalSent === 0) return 0
    return Math.round((readCount / totalSent) * 100)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading announcement…</Text>
      </View>
    )
  }

  if (!announcement) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Announcement
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#9CA3AF" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Announcement not found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            This announcement may have been deleted.
          </Text>
        </View>
      </View>
    )
  }

  const sentDate = announcement.sentAt && !isNaN(new Date(announcement.sentAt).getTime())
    ? new Date(announcement.sentAt)
    : null
  const readPercentage = getReadPercentage(announcement.readCount, announcement.totalSent)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Announcement
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Gradient Banner */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconContainer}>
              <MaterialCommunityIcons name="bullhorn" size={36} color="#FFFFFF" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text variant="titleLarge" style={styles.bannerTitle}>
                {announcement.title}
              </Text>
              {sentDate && (
                <View style={styles.bannerMeta}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.bannerMetaText}>
                    {format(sentDate, 'MMM dd, yyyy • hh:mm a')}
                  </Text>
                  <Text style={styles.bannerMetaSubText}>
                    {formatDistanceToNow(sentDate, { addSuffix: true })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Message Card */}
        <View style={styles.messageCard}>
          <Text variant="bodyLarge" style={styles.messageText}>
            {announcement.message}
          </Text>
        </View>

        {/* Optional Image */}
        {announcement.imageUrl && (
          <View style={styles.imageCard}>
            <Image
              source={{ uri: announcement.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="send" size={24} color="#7B2CBF" />
              <Text style={styles.statValue}>{announcement.totalSent}</Text>
              <Text style={styles.statLabel}>Total Sent</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="eye" size={24} color="#7B2CBF" />
              <Text style={styles.statValue}>{announcement.readCount}</Text>
              <Text style={styles.statLabel}>Read</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="percent" size={24} color="#7B2CBF" />
              <Text style={styles.statValue}>{readPercentage}%</Text>
              <Text style={styles.statLabel}>Read Rate</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target:</Text>
            <Text style={styles.detailValue}>{getTargetTypeLabel(announcement.targetType)}</Text>
          </View>
          {sentDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sent:</Text>
              <Text style={styles.detailValue}>
                {format(sentDate, 'MMM dd, yyyy h:mm a')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  deleteButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  bannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  bannerMetaText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  bannerMetaSubText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  messageCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    color: '#111827',
    lineHeight: 22,
  },
  imageCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: 220,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#111827',
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
})




