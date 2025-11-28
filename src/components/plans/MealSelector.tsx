import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Checkbox } from 'react-native-paper'

export interface MealSelection {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

interface MealSelectorProps {
  selectedMeals: MealSelection
  onChange: (meals: MealSelection) => void
  error?: string
}

const meals = [
  {
    key: 'breakfast' as const,
    label: 'Breakfast',
    time: '7:30 AM - 10:30 AM',
    color: '#f97316',
    icon: 'B',
  },
  {
    key: 'lunch' as const,
    label: 'Lunch',
    time: '12:30 PM - 3:30 PM',
    color: '#eab308',
    icon: 'L',
  },
  {
    key: 'dinner' as const,
    label: 'Dinner',
    time: '7:30 PM - 10:30 PM',
    color: '#6366f1',
    icon: 'D',
  },
]

export function MealSelector({ selectedMeals, onChange, error }: MealSelectorProps) {
  const handleMealChange = (key: keyof MealSelection, checked: boolean) => {
    onChange({
      ...selectedMeals,
      [key]: checked,
    })
  }

  const getSelectedMealsString = () => {
    return meals
      .filter((meal) => selectedMeals[meal.key])
      .map((meal) => meal.label)
      .join(', ')
  }

  return (
    <View style={styles.container}>
      <View style={styles.checkboxContainer}>
        {meals.map((meal) => {
          const isSelected = selectedMeals[meal.key]
          return (
            <TouchableOpacity
              key={meal.key}
              onPress={() => handleMealChange(meal.key, !isSelected)}
              style={[
                styles.mealOption,
                isSelected && styles.mealOptionSelected,
                { borderColor: isSelected ? meal.color : '#e5e7eb' },
              ]}
              activeOpacity={0.7}
            >
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => handleMealChange(meal.key, !isSelected)}
                color={meal.color}
              />
              <View style={styles.mealInfo}>
                <Text variant="bodyMedium" style={styles.mealLabel}>
                  {meal.label}
                </Text>
                <Text variant="bodySmall" style={styles.mealTime}>
                  {meal.time}
                </Text>
              </View>
              <View
                style={[
                  styles.mealIcon,
                  {
                    backgroundColor: `${meal.color}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.mealIconText,
                    {
                      color: meal.color,
                    },
                  ]}
                >
                  {meal.icon}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {getSelectedMealsString() && (
        <Text variant="bodySmall" style={styles.selectedText}>
          Selected: <Text style={styles.selectedValue}>{getSelectedMealsString()}</Text>
        </Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!selectedMeals.breakfast && !selectedMeals.lunch && !selectedMeals.dinner && (
        <Text style={styles.hintText}>Please select at least one meal</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  checkboxContainer: {
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  mealOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  mealInfo: {
    flex: 1,
  },
  mealLabel: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mealTime: {
    color: '#6b7280',
    fontSize: 12,
  },
  mealIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectedValue: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
})


