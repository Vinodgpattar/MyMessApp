import { View, StyleSheet } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { CurrentMealStatus } from '@/lib/dashboard'
import { ProgressBar } from './ProgressBar'
import { TrendIndicator } from './TrendIndicator'

interface CurrentMealCardProps {
  data: CurrentMealStatus
  loading?: boolean
}

export function CurrentMealCard({ data, loading }: CurrentMealCardProps) {
  const router = useRouter()

  const mealIcons = {
    breakfast: 'weather-sunset-up',
    lunch: 'weather-sunny',
    dinner: 'weather-night',
  }

  const mealColors = {
    breakfast: '#f59e0b',
    lunch: '#10b981',
    dinner: '#6366f1',
  }

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading meal status...
          </Text>
        </Card.Content>
      </Card>
    )
  }

  if (!data.meal) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#9ca3af" />
            <Text variant="titleMedium" style={styles.title}>
              Current Meal Status
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.noMealText}>
            No active meal at this time
          </Text>
        </Card.Content>
      </Card>
    )
  }

  const icon = mealIcons[data.meal]
  const color = mealColors[data.meal]

  return (
    <Card style={[styles.card, { borderLeftColor: color }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <Text variant="titleMedium" style={styles.title}>
            Current Meal Status
          </Text>
        </View>

        <View style={styles.mealInfo}>
          <Text variant="headlineSmall" style={[styles.mealName, { color }]}>
            {data.mealName}
          </Text>
          <Text variant="bodySmall" style={styles.timeWindow}>
            ⏰ {data.timeWindow}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statNumber, { color }]}>
              {data.present}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              / {data.total} students
            </Text>
          </View>
          <View style={styles.percentageContainer}>
            <MaterialCommunityIcons name="chart-line" size={20} color={color} />
            <Text variant="titleLarge" style={[styles.percentage, { color }]}>
              {data.percentage}%
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar percentage={data.percentage} height={12} showLabel={false} />
        </View>

        <Button
          mode="contained"
          onPress={() => router.push('/(admin)/(tabs)/attendance')}
          icon="clipboard-check"
          style={[styles.button, { backgroundColor: color }]}
          contentStyle={styles.buttonContent}
        >
          Mark Attendance
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
  },
  content: {
    padding: 16,
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
  loadingText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noMealText: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  mealInfo: {
    marginBottom: 16,
  },
  mealName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeWindow: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentage: {
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})

