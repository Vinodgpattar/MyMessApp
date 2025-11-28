import { View, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { QuickStats } from '@/lib/dashboard'

interface QuickStatsCardsProps {
  data: QuickStats
  loading?: boolean
}

export function QuickStatsCards({ data, loading }: QuickStatsCardsProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2].map((i) => (
          <Card key={i} style={styles.card}>
            <Card.Content style={styles.content}>
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading...
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialCommunityIcons name="account-check" size={24} color="#6366f1" />
          <Text variant="headlineSmall" style={styles.number}>
            {data.activeStudents}
          </Text>
          <Text variant="bodySmall" style={styles.label}>
            Active Students
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#7B2CBF" />
          <Text variant="headlineSmall" style={[styles.number, { color: '#7B2CBF' }]}>
            {data.totalPlans}
          </Text>
          <Text variant="bodySmall" style={styles.label}>
            Plans
          </Text>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  number: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
  },
})


