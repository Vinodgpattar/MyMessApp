import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'

interface ProgressBarProps {
  percentage: number
  color?: string
  height?: number
  showLabel?: boolean
}

export function ProgressBar({ 
  percentage, 
  color = '#6366f1', 
  height = 8,
  showLabel = true 
}: ProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  // Determine gradient colors based on percentage
  const getGradientColors = () => {
    if (percentage >= 80) return ['#10b981', '#059669'] // Green
    if (percentage >= 60) return ['#6366f1', '#4f46e5'] // Blue
    if (percentage >= 40) return ['#f59e0b', '#d97706'] // Orange
    return ['#ef4444', '#dc2626'] // Red
  }

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill,
            {
              width: `${clampedPercentage}%`,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text variant="bodySmall" style={styles.label}>
          {clampedPercentage}%
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  label: {
    color: '#64748B',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
})


