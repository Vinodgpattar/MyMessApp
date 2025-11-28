import { View, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'attendance' | 'payment' | 'student' | 'other'
  message: string
  timestamp: Date
  icon?: string
  color?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
  maxItems?: number
}

export function ActivityFeed({ activities, loading, maxItems = 5 }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading activity...
          </Text>
        </Card.Content>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={32} color="#9ca3af" />
            <Text variant="bodyMedium" style={styles.emptyText}>
              No recent activity
            </Text>
          </View>
        </Card.Content>
      </Card>
    )
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'attendance':
        return { icon: 'clipboard-check', color: '#10b981' }
      case 'payment':
        return { icon: 'cash', color: '#f59e0b' }
      case 'student':
        return { icon: 'account-plus', color: '#6366f1' }
      default:
        return { icon: 'information', color: '#94a3b8' }
    }
  }

  const displayActivities = activities.slice(0, maxItems)

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="history" size={24} color="#6366f1" />
          <Text variant="titleMedium" style={styles.title}>
            📋 Recent Activity
          </Text>
        </View>

        <View style={styles.activitiesList}>
          {displayActivities.map((activity, index) => {
            const { icon, color } = activity.icon && activity.color
              ? { icon: activity.icon, color: activity.color }
              : getActivityIcon(activity.type)

            return (
              <View key={activity.id}>
                <View style={styles.activityItem}>
                  <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
                    <MaterialCommunityIcons name={icon as any} size={18} color={color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text variant="bodyMedium" style={styles.activityMessage}>
                      {activity.message}
                    </Text>
                    <Text variant="bodySmall" style={styles.activityTime}>
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
                {index < displayActivities.length - 1 && <View style={styles.divider} />}
              </View>
            )
          })}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activitiesList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    color: '#1A1A1A',
    marginBottom: 4,
  },
  activityTime: {
    color: '#94a3b8',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 48,
    marginVertical: 8,
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 12,
    color: '#9ca3af',
  },
})


