import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface AttendanceStatsCardsProps {
  total: number
  present: number
  missing: number
  selectedMeal?: 'breakfast' | 'lunch' | 'dinner' | null
}

export function AttendanceStatsCards({ total, present, missing, selectedMeal }: AttendanceStatsCardsProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-group" size={32} color="#6366f1" />
          </View>
          <Text variant="headlineSmall" style={styles.number}>
            {total}
          </Text>
          <Text variant="bodyMedium" style={styles.label}>
            Total Students
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-check" size={32} color="#10b981" />
          </View>
          <Text variant="headlineSmall" style={[styles.number, styles.presentNumber]}>
            {present}
          </Text>
          <Text variant="bodyMedium" style={styles.label}>
            Present
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-off" size={32} color="#ef4444" />
          </View>
          <Text variant="headlineSmall" style={[styles.number, styles.missingNumber]}>
            {missing}
          </Text>
          <Text variant="bodyMedium" style={styles.label}>
            Missing
          </Text>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  number: {
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  presentNumber: {
    color: '#10b981',
  },
  missingNumber: {
    color: '#ef4444',
  },
  label: {
    color: '#666',
    textAlign: 'center',
  },
})
