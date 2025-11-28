import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Chip, Searchbar, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export type MealFilter = 'all' | 'missing' | 'present'
export type StatusFilter = 'all' | 'full' | 'partial' | 'none'

interface QuickFiltersBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchFocus?: () => void
  onSearchBlur?: () => void
  mealFilter: MealFilter
  onMealFilterChange: (filter: MealFilter) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | null
}

export function QuickFiltersBar({
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  mealFilter,
  onMealFilterChange,
  statusFilter,
  onStatusFilterChange,
  selectedMeal,
}: QuickFiltersBarProps) {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search students..."
          onChangeText={(text) => {
            onSearchChange(text)
          }}
          onFocus={() => {
            if (onSearchFocus) {
              onSearchFocus()
            }
          }}
          onBlur={() => {
            if (onSearchBlur) {
              setTimeout(() => {
                if (onSearchBlur) {
                  onSearchBlur()
                }
              }, 200)
            }
          }}
          value={searchQuery}
          style={styles.search}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Meal Filter Chips */}
      <View style={styles.chipsRow}>
        <Chip
          selected={mealFilter === 'all'}
          onPress={() => onMealFilterChange('all')}
          style={styles.chip}
          textStyle={mealFilter === 'all' ? styles.chipTextSelected : styles.chipText}
          icon={mealFilter === 'all' ? 'check-circle' : 'circle-outline'}
        >
          All
        </Chip>
        <Chip
          selected={mealFilter === 'missing'}
          onPress={() => onMealFilterChange('missing')}
          style={styles.chip}
          textStyle={mealFilter === 'missing' ? styles.chipTextSelected : styles.chipText}
          icon={mealFilter === 'missing' ? 'close-circle' : 'circle-outline'}
        >
          Missing
        </Chip>
        <Chip
          selected={mealFilter === 'present'}
          onPress={() => onMealFilterChange('present')}
          style={styles.chip}
          textStyle={mealFilter === 'present' ? styles.chipTextSelected : styles.chipText}
          icon={mealFilter === 'present' ? 'check-circle' : 'circle-outline'}
        >
          Present
        </Chip>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.chipsRow}>
        <Chip
          selected={statusFilter === 'all'}
          onPress={() => onStatusFilterChange('all')}
          style={styles.chip}
          textStyle={statusFilter === 'all' ? styles.chipTextSelected : styles.chipText}
        >
          All Status
        </Chip>
        <Chip
          selected={statusFilter === 'full'}
          onPress={() => onStatusFilterChange('full')}
          style={[styles.chip, styles.chipFull]}
          textStyle={statusFilter === 'full' ? styles.chipTextSelected : styles.chipText}
        >
          Full
        </Chip>
        <Chip
          selected={statusFilter === 'partial'}
          onPress={() => onStatusFilterChange('partial')}
          style={[styles.chip, styles.chipPartial]}
          textStyle={statusFilter === 'partial' ? styles.chipTextSelected : styles.chipText}
        >
          Partial
        </Chip>
        <Chip
          selected={statusFilter === 'none'}
          onPress={() => onStatusFilterChange('none')}
          style={[styles.chip, styles.chipNone]}
          textStyle={statusFilter === 'none' ? styles.chipTextSelected : styles.chipText}
        >
          None
        </Chip>
      </View>

      {/* Selected Meal Indicator */}
      {selectedMeal && (
        <View style={styles.mealIndicator}>
          <Text style={styles.mealIndicatorText}>
            Filtering by: {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    marginBottom: 12,
  },
  search: {
    elevation: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  chip: {
    height: 32,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextSelected: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipFull: {
    backgroundColor: '#F3F4F6',
  },
  chipPartial: {
    backgroundColor: '#F3F4F6',
  },
  chipNone: {
    backgroundColor: '#F3F4F6',
  },
  mealIndicator: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealIndicatorText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
})

