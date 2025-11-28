import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface StudentBalanceDisplayProps {
  student: {
    name: string
    rollNumber: string | null
    paid: number
    balance: number
    price: number
  } | null
}

export function StudentBalanceDisplay({ student }: StudentBalanceDisplayProps) {
  if (!student) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.placeholder}>
            Select a student to view balance
          </Text>
        </Card.Content>
      </Card>
    )
  }

  const balanceColor = student.balance >= 0 ? '#10B981' : '#EF4444'
  const balanceIcon = student.balance >= 0 ? 'check-circle' : 'alert-circle'

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.studentInfo}>
            <Text variant="titleMedium" style={styles.name}>
              {student.name}
            </Text>
            {student.rollNumber && (
              <Text variant="bodySmall" style={styles.rollNumber}>
                Roll: {student.rollNumber}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceRow}>
            <MaterialCommunityIcons name={balanceIcon} size={20} color={balanceColor} />
            <Text variant="titleLarge" style={[styles.balance, { color: balanceColor }]}>
              ₹{Math.abs(student.balance).toFixed(2)}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.balanceLabel}>
            {student.balance >= 0 ? 'Outstanding' : 'Credit'}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Total Amount:
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              ₹{Number(student.price).toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Paid:
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: '#10B981' }]}>
              ₹{Number(student.paid).toFixed(2)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 0,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    marginBottom: 16,
  },
  studentInfo: {
    gap: 4,
  },
  name: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rollNumber: {
    color: '#666',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  balance: {
    fontWeight: 'bold',
  },
  balanceLabel: {
    color: '#666',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
})


