import { View, StyleSheet } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ProgressBar } from './ProgressBar'
import { TrendIndicator } from './TrendIndicator'
import { useRouter } from 'expo-router'

interface AttendanceTrendCardProps {
  todayPercentage: number
  yesterdayPercentage: number
  loading?: boolean
}

export function AttendanceTrendCard({
  todayPercentage,
  yesterdayPercentage,
  loading,
}: AttendanceTrendCardProps) {
  const router = useRouter()
  const difference = todayPercentage - yesterdayPercentage

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading trend...
          </Text>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#6366f1" />
          <Text variant="titleMedium" style={styles.title}>
            📈 Attendance Trend
          </Text>
        </View>

        <View style={styles.trendContainer}>
          <View style={styles.trendItem}>
            <View style={styles.trendHeader}>
              <Text variant="bodyMedium" style={styles.trendLabel}>
                Today
              </Text>
              <Text variant="titleLarge" style={styles.trendPercentage}>
                {todayPercentage}%
              </Text>
            </View>
            <ProgressBar percentage={todayPercentage} height={10} showLabel={false} />
          </View>

          <View style={styles.trendItem}>
            <View style={styles.trendHeader}>
              <Text variant="bodyMedium" style={styles.trendLabel}>
                Yesterday
              </Text>
              <Text variant="titleLarge" style={[styles.trendPercentage, styles.yesterdayPercentage]}>
                {yesterdayPercentage}%
              </Text>
            </View>
            <ProgressBar percentage={yesterdayPercentage} height={10} showLabel={false} />
          </View>
        </View>

        <View style={styles.comparisonContainer}>
          <TrendIndicator value={difference} label="%" size="medium" />
          <Text variant="bodySmall" style={styles.comparisonText}>
            vs yesterday
          </Text>
        </View>

        <View style={styles.targetContainer}>
          <MaterialCommunityIcons name="target" size={16} color="#f59e0b" />
          <Text variant="bodySmall" style={styles.targetText}>
            Target: 95%
          </Text>
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
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
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
  trendContainer: {
    gap: 16,
    marginBottom: 16,
  },
  trendItem: {
    gap: 8,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  trendPercentage: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  yesterdayPercentage: {
    color: '#94a3b8',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  comparisonText: {
    color: '#94a3b8',
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  targetText: {
    color: '#64748B',
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
})


