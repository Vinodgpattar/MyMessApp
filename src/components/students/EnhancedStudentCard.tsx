import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Card, Text, Chip } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Student } from '@/lib/students'
import { format, differenceInDays } from 'date-fns'

interface EnhancedStudentCardProps {
  student: Student
  onPress?: () => void
  onQuickPay?: () => void
  onQuickEmail?: () => void
  onQuickAttendance?: () => void
}

export function EnhancedStudentCard({
  student,
  onPress,
  onQuickPay,
  onQuickEmail,
  onQuickAttendance,
}: EnhancedStudentCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(0)}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  const isExpired = new Date(student.endDate) < new Date()
  const daysUntilExpiry = differenceInDays(new Date(student.endDate), new Date())
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  const hasBalance = student.balance > 0

  // Get status indicator
  const getStatusIndicator = () => {
    if (!student.isActive) {
      return { color: '#9CA3AF', label: 'Inactive' }
    }
    if (isExpired) {
      return { color: '#EF4444', label: 'Expired' }
    }
    if (hasBalance) {
      return { color: '#F59E0B', label: 'Balance Due' }
    }
    if (isExpiringSoon) {
      return { color: '#F59E0B', label: 'Expiring Soon' }
    }
    return { color: '#10B981', label: 'Active' }
  }

  const status = getStatusIndicator()

  // Get meal icons
  const getMealIcons = () => {
    const meals = student.plan.meals.toLowerCase()
    const icons = []
    if (meals.includes('breakfast')) icons.push('🌅')
    if (meals.includes('lunch')) icons.push('🍽️')
    if (meals.includes('dinner')) icons.push('🌙')
    return icons.join(' ')
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.content}>
          {/* Header with Avatar and Status */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatar, { backgroundColor: `${status.color}20` }]}>
                <Text style={[styles.avatarText, { color: status.color }]}>
                  {getInitials(student.name)}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                    {student.name}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                </View>
                {student.rollNumber && (
                  <Text variant="bodySmall" style={styles.rollNumber}>
                    {student.rollNumber}
                  </Text>
                )}
              </View>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: `${status.color}15` }]}
              textStyle={[styles.statusChipText, { color: status.color }]}
            >
              {status.label}
            </Chip>
          </View>

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#6B7280" />
              <Text variant="bodySmall" style={styles.contactText} numberOfLines={1}>
                {student.email}
              </Text>
            </View>
            {student.contactNumber && (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="phone-outline" size={16} color="#6B7280" />
                <Text variant="bodySmall" style={styles.contactText}>
                  {student.contactNumber}
                </Text>
              </View>
            )}
          </View>

          {/* Plan Info */}
          <View style={styles.planSection}>
            <View style={styles.planRow}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#7B2CBF" />
              <Text variant="bodyMedium" style={styles.planName}>
                {student.plan.name}
              </Text>
              <Text variant="bodySmall" style={styles.mealIcons}>
                {getMealIcons()}
              </Text>
            </View>
          </View>

          {/* Dates with Expiry Warning */}
          <View style={styles.datesSection}>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text variant="labelSmall" style={styles.dateLabel}>Start</Text>
                <Text variant="bodySmall" style={styles.dateValue}>
                  {formatDate(student.joinDate)}
                </Text>
              </View>
              <View style={styles.dateItem}>
                <Text variant="labelSmall" style={styles.dateLabel}>End</Text>
                <View style={styles.endDateRow}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.dateValue,
                      isExpired && styles.dateExpired,
                      isExpiringSoon && !isExpired && styles.dateExpiring,
                    ]}
                  >
                    {formatDate(student.endDate)}
                  </Text>
                  {isExpiringSoon && !isExpired && (
                    <Text variant="labelSmall" style={styles.expiryWarning}>
                      ({daysUntilExpiry}d left)
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Financial Info */}
          <View style={styles.financialSection}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text variant="labelSmall" style={styles.financialLabel}>Paid</Text>
                <Text variant="titleSmall" style={styles.financialValue}>
                  {formatCurrency(student.paid)}
                </Text>
              </View>
              <View style={styles.financialDivider} />
              <View style={styles.financialItem}>
                <Text variant="labelSmall" style={styles.financialLabel}>Balance</Text>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.financialValue,
                    hasBalance ? styles.balanceNegative : styles.balancePositive,
                  ]}
                >
                  {formatCurrency(student.balance)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {onQuickPay && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.payButton]}
                onPress={(e) => {
                  e.stopPropagation()
                  onQuickPay()
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="cash" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Pay</Text>
              </TouchableOpacity>
            )}
            {onQuickEmail && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.emailButton]}
                onPress={(e) => {
                  e.stopPropagation()
                  onQuickEmail()
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="email" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Email</Text>
              </TouchableOpacity>
            )}
            {onQuickAttendance && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.attendanceButton]}
                onPress={(e) => {
                  e.stopPropagation()
                  onQuickAttendance()
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="clipboard-check" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Mark</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rollNumber: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  statusChip: {
    height: 24,
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
    color: '#6B7280',
    flex: 1,
    fontSize: 13,
  },
  planSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  mealIcons: {
    fontSize: 16,
  },
  datesSection: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    color: '#6B7280',
    marginBottom: 4,
    fontSize: 11,
  },
  dateValue: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 13,
  },
  dateExpired: {
    color: '#EF4444',
  },
  dateExpiring: {
    color: '#F59E0B',
  },
  endDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryWarning: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 11,
  },
  financialSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    color: '#6B7280',
    marginBottom: 4,
    fontSize: 11,
  },
  financialValue: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 16,
  },
  balanceNegative: {
    color: '#EF4444',
  },
  balancePositive: {
    color: '#10B981',
  },
  financialDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButton: {
    backgroundColor: '#7B2CBF',
  },
  emailButton: {
    backgroundColor: '#10B981',
  },
  attendanceButton: {
    backgroundColor: '#6366F1',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
})

