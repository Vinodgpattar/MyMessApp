import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Modal } from 'react-native'
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useFocusEffect } from 'expo-router'
import { getAdminAnnouncements, AdminAnnouncement } from '@/lib/announcements'

export default function AnnouncementsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AdminAnnouncement | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const result = await getAdminAnnouncements()
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
    setSelectedAnnouncement(announcement)
    setModalVisible(true)
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
      return format(new Date(date), 'EEEE')
    } else {
      return format(new Date(date), 'MMM dd, yyyy')
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
        <View style={styles.inlineLoadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#9CA3AF" />
            <Text variant="titleLarge" style={styles.emptyTitle}>
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
          announcements.map((announcement) => {
            const readPercentage = getReadPercentage(announcement.readCount, announcement.totalSent)
            return (
              <TouchableOpacity
                key={announcement.id}
                onPress={() => handleAnnouncementPress(announcement)}
                activeOpacity={0.7}
              >
                <Card style={styles.card}>
                  <Card.Content>
                    {/* Header with image and title */}
                    <View style={styles.cardHeader}>
                      {announcement.imageUrl ? (
                        <Image
                          source={{ uri: announcement.imageUrl }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                          <MaterialCommunityIcons name="text" size={24} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={styles.cardHeaderText}>
                        <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>
                          {announcement.title}
                        </Text>
                        <Text variant="bodySmall" style={styles.cardTime}>
                          {formatTime(announcement.sentAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Message preview */}
                    <Text variant="bodyMedium" style={styles.cardMessage} numberOfLines={2}>
                      {announcement.message}
                    </Text>

                    {/* Stats and target */}
                    <View style={styles.cardFooter}>
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="send" size={16} color="#6B7280" />
                          <Text style={styles.statText}>{announcement.totalSent} sent</Text>
                        </View>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="eye" size={16} color="#6B7280" />
                          <Text style={styles.statText}>{announcement.readCount} read</Text>
                        </View>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="percent" size={16} color="#6B7280" />
                          <Text style={styles.statText}>{readPercentage}%</Text>
                        </View>
                      </View>
                      <Chip
                        mode="outlined"
                        style={styles.targetChip}
                        textStyle={styles.targetChipText}
                      >
                        {getTargetTypeLabel(announcement.targetType)}
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            )
          })
        )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedAnnouncement && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    Announcement Details
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  {/* Image */}
                  {selectedAnnouncement.imageUrl && (
                    <Image
                      source={{ uri: selectedAnnouncement.imageUrl }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Title */}
                  <Text variant="titleLarge" style={styles.modalDetailTitle}>
                    {selectedAnnouncement.title}
                  </Text>

                  {/* Message */}
                  <Text variant="bodyLarge" style={styles.modalDetailMessage}>
                    {selectedAnnouncement.message}
                  </Text>

                  {/* Stats */}
                  <View style={styles.modalStats}>
                    <View style={styles.modalStatCard}>
                      <MaterialCommunityIcons name="send" size={24} color="#7B2CBF" />
                      <Text style={styles.modalStatValue}>{selectedAnnouncement.totalSent}</Text>
                      <Text style={styles.modalStatLabel}>Total Sent</Text>
                    </View>
                    <View style={styles.modalStatCard}>
                      <MaterialCommunityIcons name="eye" size={24} color="#7B2CBF" />
                      <Text style={styles.modalStatValue}>{selectedAnnouncement.readCount}</Text>
                      <Text style={styles.modalStatLabel}>Read</Text>
                    </View>
                    <View style={styles.modalStatCard}>
                      <MaterialCommunityIcons name="percent" size={24} color="#7B2CBF" />
                      <Text style={styles.modalStatValue}>
                        {getReadPercentage(selectedAnnouncement.readCount, selectedAnnouncement.totalSent)}%
                      </Text>
                      <Text style={styles.modalStatLabel}>Read Rate</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Target:</Text>
                      <Chip mode="outlined" style={styles.modalChip}>
                        {getTargetTypeLabel(selectedAnnouncement.targetType)}
                      </Chip>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Sent:</Text>
                      <Text style={styles.modalDetailValue}>
                        {format(new Date(selectedAnnouncement.sentAt), 'MMM dd, yyyy h:mm a')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  inlineLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardTime: {
    color: '#6B7280',
  },
  cardMessage: {
    color: '#4B5563',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  targetChip: {
    height: 28,
  },
  targetChipText: {
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  modalDetailTitle: {
    fontWeight: '700',
    color: '#1F2937',
    margin: 16,
    marginBottom: 8,
  },
  modalDetailMessage: {
    color: '#4B5563',
    marginHorizontal: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  modalStatCard: {
    alignItems: 'center',
    gap: 8,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalDetails: {
    paddingHorizontal: 16,
    gap: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  modalChip: {
    height: 28,
  },
})

