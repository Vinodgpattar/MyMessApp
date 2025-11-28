import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StudentStats } from '@/lib/students'

interface StudentStatsCardsProps {
  stats: StudentStats
}

export function StudentStatsCards({ stats }: StudentStatsCardsProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-group" size={32} color="#6366f1" />
          </View>
          <Text variant="headlineSmall" style={styles.number}>
            {stats.totalStudents}
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
          <Text variant="headlineSmall" style={[styles.number, styles.activeNumber]}>
            {stats.activeStudents}
          </Text>
          <Text variant="bodyMedium" style={styles.label}>
            Active
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-off" size={32} color="#9ca3af" />
          </View>
          <Text variant="headlineSmall" style={[styles.number, styles.inactiveNumber]}>
            {stats.inactiveStudents}
          </Text>
          <Text variant="bodyMedium" style={styles.label}>
            Inactive
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
  activeNumber: {
    color: '#10b981',
  },
  inactiveNumber: {
    color: '#9ca3af',
  },
  label: {
    color: '#666',
    textAlign: 'center',
  },
})


