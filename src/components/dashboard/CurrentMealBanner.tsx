import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { CurrentMealStatus } from '@/lib/dashboard'
import { LinearGradient } from 'expo-linear-gradient'

interface CurrentMealBannerProps {
  data: CurrentMealStatus
  loading?: boolean
}

export function CurrentMealBanner({ data, loading }: CurrentMealBannerProps) {
  const router = useRouter()

  // Don't show if no active meal
  if (!data.meal || loading) {
    return null
  }

  const mealIcons = {
    breakfast: 'weather-sunset-up',
    lunch: 'weather-sunny',
    dinner: 'weather-night',
  }

  const mealColors = {
    breakfast: ['#f59e0b', '#d97706'],
    lunch: ['#10b981', '#059669'],
    dinner: ['#6366f1', '#4f46e5'],
  }

  const icon = mealIcons[data.meal]
  const colors = mealColors[data.meal]

  return (
    <TouchableOpacity
      onPress={() => router.push('/(admin)/(tabs)/attendance')}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <MaterialCommunityIcons name={icon} size={24} color="#fff" />
            <View style={styles.bannerText}>
              <Text variant="titleMedium" style={styles.mealName}>
                {data.mealName}
              </Text>
              <Text variant="bodySmall" style={styles.attendanceText}>
                {data.present}/{data.total} students ({data.percentage}%)
              </Text>
            </View>
          </View>
          <View style={styles.bannerRight}>
            <Text variant="bodyMedium" style={styles.actionText}>
              Mark
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerText: {
    flex: 1,
  },
  mealName: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 2,
  },
  attendanceText: {
    color: '#fff',
    opacity: 0.95,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
})

