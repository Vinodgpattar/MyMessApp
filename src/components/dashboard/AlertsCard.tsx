import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Alert } from '@/lib/dashboard'

interface AlertsCardProps {
  alerts: Alert[]
  loading?: boolean
}

export function AlertsCard({ alerts, loading }: AlertsCardProps) {
  const router = useRouter()

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading alerts...
          </Text>
        </Card.Content>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card style={[styles.card, styles.noAlertsCard]}>
        <Card.Content style={styles.noAlertsContent}>
          <MaterialCommunityIcons name="check-circle" size={32} color="#10b981" />
          <Text variant="bodyMedium" style={styles.noAlertsText}>
            All good! No alerts
          </Text>
        </Card.Content>
      </Card>
    )
  }

  const getAlertIcon = (type: Alert['type']) => {
    return type === 'expiring' ? 'calendar-alert' : 'alert-circle'
  }

  const getAlertColor = (type: Alert['type']) => {
    return type === 'expiring' ? '#ef4444' : '#f59e0b'
  }

  const getAlertText = (alert: Alert) => {
    if (alert.type === 'expiring') {
      return `${alert.count} student${alert.count !== 1 ? 's' : ''} expiring in 3 days`
    } else {
      return `${alert.count} student${alert.count !== 1 ? 's' : ''} with low balance`
    }
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="alert" size={24} color="#ef4444" />
          <Text variant="titleMedium" style={styles.title}>
            ⚠️ Attention Needed
          </Text>
        </View>

        <View style={styles.alertsList}>
          {alerts.map((alert, index) => {
            const icon = getAlertIcon(alert.type)
            const color = getAlertColor(alert.type)

            return (
              <View key={index} style={styles.alertItem}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
                <Text variant="bodyMedium" style={styles.alertText}>
                  {getAlertText(alert)}
                </Text>
              </View>
            )
          })}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/(tabs)/students')}
          activeOpacity={0.7}
        >
          <View style={styles.viewAllButton}>
            <Text variant="bodyMedium" style={styles.viewAllText}>
              View Details
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#7B2CBF" />
          </View>
        </TouchableOpacity>
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
    borderLeftColor: '#ef4444',
  },
  noAlertsCard: {
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4',
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
  alertsList: {
    gap: 12,
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  alertText: {
    flex: 1,
    color: '#1A1A1A',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  viewAllText: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noAlertsContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAlertsText: {
    marginTop: 12,
    color: '#10b981',
    fontWeight: '500',
  },
})


