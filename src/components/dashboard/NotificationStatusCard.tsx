import { View, StyleSheet } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNotifications } from '@/context/NotificationContext'
import { useRouter } from 'expo-router'
import { formatDistanceToNow } from 'date-fns'

export function NotificationStatusCard() {
  const { isEnabled, permissionsGranted, config, lastNotificationTime } = useNotifications()
  const router = useRouter()

  const statusColor = isEnabled && permissionsGranted ? '#10b981' : '#ef4444'
  const statusIcon = isEnabled && permissionsGranted ? 'check-circle' : 'close-circle'
  const statusText = isEnabled && permissionsGranted ? 'Active' : 'Inactive'

  const lastNotificationText = lastNotificationTime
    ? formatDistanceToNow(lastNotificationTime, { addSuffix: true })
    : 'Never'

  return (
    <Card
      style={[
        styles.card,
        isEnabled && permissionsGranted && styles.activeCard,
      ]}
    >
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="bell" size={24} color="#6366f1" />
          <Text variant="titleMedium" style={styles.title}>
            Notifications
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <View style={styles.statusIndicator}>
              <MaterialCommunityIcons
                name={statusIcon}
                size={20}
                color={statusColor}
              />
              <Text variant="bodyLarge" style={[styles.statusText, { color: statusColor }]}>
                Status: {statusText}
              </Text>
            </View>
            {isEnabled && permissionsGranted && (
              <>
                <Text variant="bodySmall" style={styles.detailText}>
                  Frequency: Every {config.frequency} minutes
                </Text>
                {lastNotificationTime && (
                  <Text variant="bodySmall" style={styles.detailText}>
                    Last sent: {lastNotificationText}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        <Button
          mode="text"
          onPress={() => router.push('/(admin)/(tabs)/settings')}
          icon="cog"
          style={styles.settingsButton}
          labelStyle={styles.settingsButtonLabel}
        >
          Settings
        </Button>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  activeCard: {
    backgroundColor: '#f0f9ff',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusRow: {
    marginBottom: 12,
  },
  statusInfo: {
    gap: 6,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontWeight: '600',
  },
  detailText: {
    color: '#666',
    marginLeft: 28,
  },
  settingsButton: {
    marginTop: 4,
  },
  settingsButtonLabel: {
    fontSize: 12,
  },
})


