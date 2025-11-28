import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { TrendIndicator } from './TrendIndicator'

interface StatCardWithTrendProps {
  icon: string
  iconColor: string
  value: string | number
  label: string
  trend?: number
  trendLabel?: string
  onPress?: () => void
  gradient?: boolean
}

export function StatCardWithTrend({
  icon,
  iconColor,
  value,
  label,
  trend,
  trendLabel,
  onPress,
  gradient = false,
}: StatCardWithTrendProps) {
  const CardComponent = onPress ? TouchableOpacity : View

  return (
    <CardComponent onPress={onPress} activeOpacity={0.7}>
      <Card
        style={[
          styles.card,
          gradient && styles.gradientCard,
          { borderLeftColor: iconColor },
        ]}
      >
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon as any} size={28} color={iconColor} />
          </View>
          <Text variant="headlineMedium" style={[styles.value, { color: iconColor }]}>
            {value}
          </Text>
          <Text variant="bodySmall" style={styles.label}>
            {label}
          </Text>
          {trend !== undefined && (
            <View style={styles.trendContainer}>
              <TrendIndicator value={trend} label={trendLabel} size="small" />
              <Text variant="bodySmall" style={styles.trendLabel}>
                vs yesterday
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </CardComponent>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    elevation: 2,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  gradientCard: {
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    color: '#64748B',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
})


