import { View, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { TodaySummaryWithTrend } from '@/lib/dashboard'
import { TrendIndicator } from './TrendIndicator'

interface TodaySummaryCardsProps {
  data: TodaySummaryWithTrend | null
  loading?: boolean
}

export function TodaySummaryCards({ data, loading }: TodaySummaryCardsProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
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

  if (!data) {
    return null
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return `₹${amount}`
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-group" size={24} color="#7B2CBF" />
          </View>
          <Text variant="headlineMedium" style={styles.number}>
            {data.totalStudents}
          </Text>
          <Text variant="bodySmall" style={styles.label}>
            Total Students
          </Text>
          {data.trends.totalStudents !== 0 && (
            <View style={styles.trendContainer}>
              <TrendIndicator value={data.trends.totalStudents} size="small" />
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="clipboard-check" size={24} color="#10b981" />
          </View>
          <Text variant="headlineMedium" style={[styles.number, { color: '#10b981' }]}>
            {data.presentToday}
          </Text>
          <Text variant="bodySmall" style={styles.label}>
            Present Today
          </Text>
          {data.trends.presentToday !== 0 && (
            <View style={styles.trendContainer}>
              <TrendIndicator value={data.trends.presentToday} size="small" />
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#f59e0b" />
          </View>
          <Text variant="headlineMedium" style={[styles.number, { color: '#f59e0b' }]}>
            {formatCurrency(data.paidToday)}
          </Text>
          <Text variant="bodySmall" style={styles.label}>
            Paid Today
          </Text>
          {data.trends.paidToday !== 0 && (
            <View style={styles.trendContainer}>
              <TrendIndicator 
                value={Math.round(data.trends.paidToday / 1000)} 
                label="K" 
                size="small" 
              />
            </View>
          )}
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
  iconContainer: {
    marginBottom: 8,
  },
  number: {
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  label: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  trendContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
  },
})

