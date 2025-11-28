import React from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FilterType } from '@/lib/student-filters'

interface QuickFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts?: {
    all: number
    active: number
    inactive: number
    expiring: number
    overdue: number
  }
}

export function QuickFilters({ activeFilter, onFilterChange, counts }: QuickFiltersProps) {
  const filters: Array<{ key: FilterType; label: string; icon: string; color: string }> = [
    { key: 'all', label: 'All', icon: 'account-group', color: '#6B7280' },
    { key: 'active', label: 'Active', icon: 'check-circle', color: '#10B981' },
    { key: 'expiring', label: 'Expiring', icon: 'clock-alert', color: '#F59E0B' },
    { key: 'overdue', label: 'Overdue', color: '#EF4444', icon: 'alert-circle' },
    { key: 'inactive', label: 'Inactive', icon: 'account-off', color: '#9CA3AF' },
  ]

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key
          const count = counts?.[filter.key] ?? 0

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onFilterChange(filter.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={filter.icon as any}
                size={16}
                color={isActive ? '#FFFFFF' : filter.color}
              />
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                  { marginLeft: 6 },
                ]}
              >
                {filter.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.badge,
                    isActive ? styles.badgeActive : { backgroundColor: filter.color },
                  ]}
                >
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  badgeActive: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B2CBF',
  },
})

