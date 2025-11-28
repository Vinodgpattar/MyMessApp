import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Card, Text, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Plan } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  index: number
  onPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const colorVariants = [
  { bg: '#dbeafe', icon: '#2563eb', accent: '#3b82f6' }, // Blue
  { bg: '#fef3c7', icon: '#d97706', accent: '#f59e0b' }, // Yellow
  { bg: '#d1fae5', icon: '#059669', accent: '#10b981' }, // Green
  { bg: '#e0e7ff', icon: '#6366f1', accent: '#818cf8' }, // Indigo
  { bg: '#fce7f3', icon: '#db2777', accent: '#ec4899' }, // Pink
  { bg: '#f3e8ff', icon: '#9333ea', accent: '#a855f7' }, // Purple
]

export function PlanCard({ plan, index, onPress, onEdit, onDelete }: PlanCardProps) {
  const colors = colorVariants[index % colorVariants.length]

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="outlined">
        {/* Gradient Accent Bar */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: colors.accent,
            },
          ]}
        />

        {/* Card Content */}
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: colors.bg,
                  borderColor: `${colors.icon}25`,
                },
              ]}
            >
              <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={colors.icon} />
            </View>
            <View style={styles.titleSection}>
              <Text variant="titleMedium" style={styles.planName}>
                {plan.name}
              </Text>
              <Text variant="bodySmall" style={styles.planMeals} numberOfLines={2}>
                {plan.meals}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-inr" size={16} color="#059669" />
              <View style={styles.detailContent}>
                <Text variant="labelSmall" style={styles.detailLabel}>
                  Price
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {formatCurrency(plan.price)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color="#6366f1" />
              <View style={styles.detailContent}>
                <Text variant="labelSmall" style={styles.detailLabel}>
                  Duration
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {plan.durationDays} days
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              icon="pencil"
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
            >
              Edit
            </Button>
            <Button
              mode="outlined"
              onPress={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              icon="delete"
              textColor="#dc2626"
              style={[styles.actionButton, styles.deleteButton]}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
            >
              Delete
            </Button>
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
  accentBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  titleSection: {
    flex: 1,
  },
  planName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  planMeals: {
    color: '#666',
    fontSize: 12,
  },
  details: {
    marginBottom: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  deleteButton: {
    borderColor: '#dc2626',
  },
})


