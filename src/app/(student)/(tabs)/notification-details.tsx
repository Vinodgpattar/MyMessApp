import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Image } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface NotificationRecord {
  id: number
  notification: {
    id: number
    title: string
    message: string
    imageUrl: string | null
    sentAt: string
  } | null
  read: boolean
  readAt: string | null
}

export default function StudentNotificationDetailsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string }>()
  const recipientId = params.id ? parseInt(params.id, 10) : NaN

  const [record, setRecord] = useState<NotificationRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isNaN(recipientId)) {
      void loadData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId])

  const loadData = async () => {
    try {
      setLoading(true)

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
        .eq('id', recipientId)
        .single()

      if (error || !data) {
        logger.error('Error loading notification details', error as Error, {
          recipientId,
        })
        setRecord(null)
        return
      }

      setRecord(data as NotificationRecord)

      // Mark as read when viewing
      if (!data.read) {
        await supabase
          .from('AdminNotificationRecipient')
          .update({
            read: true,
            readAt: new Date().toISOString(),
          })
          .eq('id', data.id)
      }
    } catch (error) {
      logger.error('Unexpected error loading notification details', error as Error, {
        recipientId,
      })
      setRecord(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading announcement…</Text>
      </View>
    )
  }

  if (!record || !record.notification) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#4B5563"
            onPress={() => router.back()}
          />
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

  const notification = record.notification
  const sentDate = notification.sentAt && !isNaN(new Date(notification.sentAt).getTime())
    ? new Date(notification.sentAt)
    : null

  return (
    <View style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color="#4B5563"
          onPress={() => router.back()}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Announcement
        </Text>
        <View style={{ width: 24 }} />
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
                {notification.title}
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
            {notification.message}
          </Text>
        </View>

        {/* Optional Image */}
        {notification.imageUrl && (
          <View style={styles.imageCard}>
            <Image
              source={{ uri: notification.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#111827',
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





