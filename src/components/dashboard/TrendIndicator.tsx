import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface TrendIndicatorProps {
  value: number
  label?: string
  size?: 'small' | 'medium' | 'large'
}

export function TrendIndicator({ value, label, size = 'small' }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const color = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#94a3b8'
  const icon = isPositive ? 'trending-up' : isNegative ? 'trending-down' : 'minus'

  const textSize = size === 'large' ? 'bodyLarge' : size === 'medium' ? 'bodyMedium' : 'bodySmall'

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text variant={textSize} style={[styles.text, { color }]}>
        {isPositive ? '+' : ''}{value}{label || '%'}
      </Text>
      {label && (
        <Text variant="bodySmall" style={styles.label}>
          {label}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontWeight: '600',
  },
  label: {
    color: '#94a3b8',
    marginLeft: 4,
  },
})


