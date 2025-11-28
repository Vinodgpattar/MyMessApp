import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface MealSelectorProps {
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | null
  onSelectMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | null) => void
  stats: {
    breakfast: { present: number; total: number }
    lunch: { present: number; total: number }
    dinner: { present: number; total: number }
  }
}

export function MealSelector({ selectedMeal, onSelectMeal, stats }: MealSelectorProps) {
  const meals = [
    {
      key: 'breakfast' as const,
      label: 'Breakfast',
      icon: 'weather-sunny',
      color: '#F59E0B',
      lightBg: '#FEF3C7',
      defaultBg: '#FFFFFF',
      borderColor: '#FCD34D',
      gradient: ['#FEF3C7', '#FDE68A'],
    },
    {
      key: 'lunch' as const,
      label: 'Lunch',
      icon: 'weather-sunset',
      color: '#3B82F6',
      lightBg: '#DBEAFE',
      defaultBg: '#FFFFFF',
      borderColor: '#93C5FD',
      gradient: ['#DBEAFE', '#BFDBFE'],
    },
    {
      key: 'dinner' as const,
      label: 'Dinner',
      icon: 'weather-night',
      color: '#6366F1',
      lightBg: '#E0E7FF',
      defaultBg: '#FFFFFF',
      borderColor: '#A5B4FC',
      gradient: ['#E0E7FF', '#C7D2FE'],
    },
  ]

  const formatPercentage = (present: number, total: number) => {
    if (total === 0) return 0
    return Math.round((present / total) * 100)
  }

  return (
    <View style={styles.container}>
      {meals.map((meal) => {
        const isSelected = selectedMeal === meal.key
        const mealStats = stats[meal.key]
        const percentage = formatPercentage(mealStats.present, mealStats.total)

        return (
          <TouchableOpacity
            key={meal.key}
            style={[
              styles.mealCard,
              {
                backgroundColor: isSelected ? meal.lightBg : meal.defaultBg,
                borderColor: isSelected ? meal.color : meal.borderColor,
                borderWidth: isSelected ? 2.5 : 1.5,
                shadowColor: isSelected ? meal.color : '#000',
                shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
                shadowOpacity: isSelected ? 0.2 : 0.05,
                shadowRadius: isSelected ? 4 : 2,
                elevation: isSelected ? 4 : 1,
              },
            ]}
            onPress={() => onSelectMeal(meal.key)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { 
                backgroundColor: isSelected ? meal.color : `${meal.color}20`,
              }]}>
                <MaterialCommunityIcons
                  name={meal.icon}
                  size={22}
                  color={isSelected ? '#FFFFFF' : meal.color}
                />
              </View>
              
              <View style={styles.textSection}>
                <Text
                  variant="labelMedium"
                  style={[
                    styles.mealLabel,
                    { 
                      color: isSelected ? meal.color : '#1F2937',
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {meal.label}
                </Text>
                <View style={styles.statsRow}>
                  <View style={[styles.countBadge, { 
                    backgroundColor: isSelected ? `${meal.color}20` : `${meal.color}15`,
                    borderColor: `${meal.color}30`,
                    borderWidth: 1,
                  }]}>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.statsText,
                        { 
                          color: meal.color,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {mealStats.present}/{mealStats.total}
                    </Text>
                  </View>
                  <View style={[styles.percentageBadge, { 
                    backgroundColor: isSelected ? meal.color : `${meal.color}CC`,
                  }]}>
                    <Text
                      variant="labelSmall"
                      style={styles.percentageText}
                    >
                      {percentage}%
                    </Text>
                  </View>
                </View>
              </View>

              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: meal.color }]}>
                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                </View>
              )}
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
    gap: 10,
    marginBottom: 20,
  },
  mealCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textSection: {
    flex: 1,
  },
  mealLabel: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  statsText: {
    fontSize: 11,
    textAlign: 'center',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
