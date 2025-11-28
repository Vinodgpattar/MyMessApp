import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { PaymentStats } from '@/lib/payments'

interface PaymentStatsCardsProps {
  stats: PaymentStats
  onStatPress?: (stat: 'total' | 'today' | 'month') => void
}

export function PaymentStatsCards({ stats, onStatPress }: PaymentStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const statsData = [
    {
      key: 'total' as const,
      label: 'Total',
      icon: 'currency-inr',
      color: '#7B2CBF',
      bg: '#F3E8FF',
      iconBg: '#E9D5FF',
      value: stats.total,
    },
    {
      key: 'today' as const,
      label: 'Today',
      icon: 'calendar-today',
      color: '#10B981',
      bg: '#D1FAE5',
      iconBg: '#A7F3D0',
      value: stats.today,
    },
    {
      key: 'month' as const,
      label: 'This Month',
      icon: 'calendar-month',
      color: '#F59E0B',
      bg: '#FEF3C7',
      iconBg: '#FDE68A',
      value: stats.thisMonth,
    },
  ]

  return (
    <View style={styles.container}>
      {statsData.map((stat) => (
        <TouchableOpacity
          key={stat.key}
          style={styles.card}
          onPress={() => onStatPress?.(stat.key)}
          activeOpacity={0.7}
        >
          <Card style={[styles.cardContent, { backgroundColor: stat.bg }]}>
            <Card.Content style={styles.cardInner}>
              <View style={[styles.iconWrapper, { backgroundColor: stat.iconBg }]}>
                <MaterialCommunityIcons name={stat.icon} size={22} color={stat.color} />
              </View>
              <View style={styles.textContainer}>
                <Text variant="labelSmall" style={[styles.label, { color: stat.color }]}>
                  {stat.label}
                </Text>
                <Text variant="headlineSmall" style={[styles.value, { color: stat.color }]}>
                  {formatCurrency(stat.value)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    borderRadius: 14,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardInner: {
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: -0.5,
  },
})
