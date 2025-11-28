import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Card, Text, Chip } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Student } from '@/lib/students'
import { format } from 'date-fns'

interface StudentCardProps {
  student: Student
  onPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onResetPin?: () => void
  onSendEmail?: () => void
}

export function StudentCard({
  student,
  onPress,
  onEdit,
  onDelete,
  onResetPin,
  onSendEmail,
}: StudentCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  const isExpired = new Date(student.endDate) < new Date()

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        style={[
          styles.card,
          !student.isActive && styles.cardInactive,
          isExpired && styles.cardExpired,
        ]}
        mode="outlined"
      >
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {student.rollNumber && (
                <Text variant="labelSmall" style={styles.rollNumber}>
                  {student.rollNumber}
                </Text>
              )}
              <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                {student.name}
              </Text>
            </View>
            <Chip
              style={[
                styles.statusChip,
                student.isActive ? styles.statusActive : styles.statusInactive,
              ]}
              textStyle={styles.statusChipText}
            >
              {student.isActive ? 'Active' : 'Inactive'}
            </Chip>
          </View>

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="email" size={14} color="#666" />
              <Text variant="bodySmall" style={styles.contactText} numberOfLines={1}>
                {student.email}
              </Text>
            </View>
            {student.contactNumber && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone" size={14} color="#666" />
                <Text variant="bodySmall" style={styles.contactText}>
                  {student.contactNumber}
                </Text>
              </View>
            )}
          </View>

          {/* Plan Info */}
          <View style={styles.planInfo}>
            <Text variant="bodySmall" style={styles.planLabel}>Plan:</Text>
            <Text variant="bodyMedium" style={styles.planName}>
              {student.plan.name}
            </Text>
          </View>

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text variant="labelSmall" style={styles.dateLabel}>Start:</Text>
              <Text variant="bodySmall" style={styles.dateValue}>
                {formatDate(student.joinDate)}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text variant="labelSmall" style={styles.dateLabel}>End:</Text>
              <Text
                variant="bodySmall"
                style={[styles.dateValue, isExpired && styles.dateExpired]}
              >
                {formatDate(student.endDate)}
              </Text>
            </View>
          </View>

          {/* Financial Info */}
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text variant="labelSmall" style={styles.financialLabel}>Paid:</Text>
              <Text variant="bodyMedium" style={styles.financialValue}>
                {formatCurrency(student.paid)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text variant="labelSmall" style={styles.financialLabel}>Balance:</Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.financialValue,
                  student.balance > 0 ? styles.balanceNegative : styles.balancePositive,
                ]}
              >
                {formatCurrency(student.balance)}
              </Text>
            </View>
          </View>

          {/* Expired Warning */}
          {isExpired && (
            <View style={styles.expiredWarning}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#f59e0b" />
              <Text variant="bodySmall" style={styles.expiredText}>
                Plan expired
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#6366f1" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            {onResetPin && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation()
                  onResetPin?.()
                }}
              >
                <MaterialCommunityIcons name="key-variant" size={18} color="#f59e0b" />
                <Text style={styles.actionText}>Reset PIN</Text>
              </TouchableOpacity>
            )}
            {onSendEmail && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation()
                  onSendEmail?.()
                }}
              >
                <MaterialCommunityIcons name="send" size={18} color="#10b981" />
                <Text style={styles.actionText}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
            >
              <MaterialCommunityIcons name="delete" size={18} color="#dc2626" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.7,
    borderColor: '#9ca3af',
  },
  cardExpired: {
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  rollNumber: {
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  name: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusChip: {
    height: 24,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactInfo: {
    marginBottom: 12,
    gap: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: '#666',
    flex: 1,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  planLabel: {
    color: '#666',
  },
  planName: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dateExpired: {
    color: '#f59e0b',
  },
  financialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    color: '#666',
    marginBottom: 2,
  },
  financialValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  balanceNegative: {
    color: '#dc2626',
  },
  balancePositive: {
    color: '#10b981',
  },
  expiredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  expiredText: {
    color: '#92400e',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  deleteText: {
    color: '#dc2626',
  },
})

