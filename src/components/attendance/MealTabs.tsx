import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface MealTabsProps {
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | null
  onSelectMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | null) => void
  stats: {
    breakfast: { present: number; total: number }
    lunch: { present: number; total: number }
    dinner: { present: number; total: number }
  }
}

export function MealTabs({ selectedMeal, onSelectMeal, stats }: MealTabsProps) {
  const meals = [
    {
      key: 'breakfast' as const,
      label: 'Breakfast',
      icon: 'food-croissant',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      stats: stats.breakfast,
    },
    {
      key: 'lunch' as const,
      label: 'Lunch',
      icon: 'food',
      color: '#22C55E',
      bgColor: '#D1FAE5',
      stats: stats.lunch,
    },
    {
      key: 'dinner' as const,
      label: 'Dinner',
      icon: 'silverware-fork-knife',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      stats: stats.dinner,
    },
  ]

  return (
    <View style={styles.container}>
      {meals.map((meal) => {
        const isSelected = selectedMeal === meal.key
        const percentage = meal.stats.total > 0 
          ? Math.round((meal.stats.present / meal.stats.total) * 100)
          : 0

        return (
          <TouchableOpacity
            key={meal.key}
            style={[
              styles.tab,
              isSelected && { backgroundColor: meal.bgColor, borderColor: meal.color },
            ]}
            onPress={() => onSelectMeal(meal.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <MaterialCommunityIcons
                name={meal.icon}
                size={24}
                color={isSelected ? meal.color : '#666'}
              />
              <View style={styles.tabText}>
                <Text
                  variant="labelMedium"
                  style={[
                    styles.tabLabel,
                    isSelected && { color: meal.color, fontWeight: 'bold' },
                  ]}
                >
                  {meal.label}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.tabStats, isSelected && { color: meal.color }]}
                >
                  {meal.stats.present}/{meal.stats.total} ({percentage}%)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    color: '#666',
    fontSize: 12,
  },
  tabStats: {
    color: '#999',
    fontSize: 11,
  },
})


