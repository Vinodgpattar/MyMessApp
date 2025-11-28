import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card, IconButton, Chip } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import type { Payment } from '@/lib/payments'

interface PaymentCardProps {
  payment: Payment
  onPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function PaymentCard({ payment, onPress, onEdit, onDelete }: PaymentCardProps) {
  const getMethodIcon = (method: string | null) => {
    switch (method) {
      case 'Cash':
        return 'cash'
      case 'UPI':
        return 'cellphone'
      case 'Online':
        return 'credit-card'
      default:
        return 'currency-inr'
    }
  }

  const getMethodColor = (method: string | null) => {
    switch (method) {
      case 'Cash':
        return { color: '#10B981', bg: '#D1FAE5', iconBg: '#A7F3D0' }
      case 'UPI':
        return { color: '#6366F1', bg: '#E0E7FF', iconBg: '#C7D2FE' }
      case 'Online':
        return { color: '#8B5CF6', bg: '#EDE9FE', iconBg: '#DDD6FE' }
      default:
        return { color: '#6B7280', bg: '#F3F4F6', iconBg: '#E5E7EB' }
    }
  }

  const methodStyle = getMethodColor(payment.method)

  return (
    <Card 
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: methodStyle.color }]} 
      onPress={onPress}
      mode="outlined"
    >
      <Card.Content style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.info}>
            <View style={styles.headerRow}>
              <View style={styles.studentInfo}>
                <Text variant="titleMedium" style={styles.studentName} numberOfLines={1}>
                  {payment.student.name}
                </Text>
                <Text variant="bodySmall" style={styles.rollNumber}>
                  {payment.student.rollNumber || 'No Roll Number'}
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text variant="headlineSmall" style={styles.amount}>
                  ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={[styles.methodBadge, { backgroundColor: methodStyle.bg }]}>
                <View style={[styles.methodIconWrapper, { backgroundColor: methodStyle.iconBg }]}>
                  <MaterialCommunityIcons
                    name={getMethodIcon(payment.method)}
                    size={14}
                    color={methodStyle.color}
                  />
                </View>
                <Text variant="labelSmall" style={[styles.methodText, { color: methodStyle.color }]}>
                  {payment.method || 'N/A'}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <MaterialCommunityIcons name="calendar-clock" size={14} color="#9CA3AF" />
                <Text variant="bodySmall" style={styles.date}>
                  {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#6366F1"
                onPress={onEdit}
                style={styles.actionButton}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={20}
                iconColor="#EF4444"
                onPress={onDelete}
                style={styles.actionButton}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 14,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    fontSize: 16,
  },
  rollNumber: {
    color: '#6B7280',
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
    color: '#10B981',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  methodIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  date: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  actionButton: {
    margin: 0,
  },
})
