import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, RadioButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface PaymentMethodSelectorProps {
  selectedMethod: string
  onSelect: (method: string) => void
  error?: string
}

const paymentMethods = [
  { value: 'Cash', label: 'Cash', icon: 'cash', color: '#10B981' },
  { value: 'UPI', label: 'UPI', icon: 'cellphone', color: '#6366F1' },
  { value: 'Online', label: 'Online', icon: 'credit-card', color: '#8B5CF6' },
]

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  error,
}: PaymentMethodSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="credit-card-multiple" size={20} color="#8B5CF6" />
        <Text variant="titleMedium" style={styles.label}>
          Payment Method *
        </Text>
      </View>
      <View style={styles.options}>
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.value
          return (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.option,
                isSelected && { 
                  backgroundColor: `${method.color}15`,
                  borderColor: method.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => onSelect(method.value)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? method.color : '#F3F4F6' }
              ]}>
                <MaterialCommunityIcons
                  name={method.icon as any}
                  size={22}
                  color={isSelected ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text
                variant="bodyLarge"
                style={[
                  styles.optionLabel,
                  isSelected && { color: method.color, fontWeight: '700' },
                ]}
              >
                {method.label}
              </Text>
              <RadioButton
                value={method.value}
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => onSelect(method.value)}
                color={method.color}
              />
            </TouchableOpacity>
          )
        })}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
          <Text variant="bodySmall" style={styles.error}>
            {error}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    color: '#111827',
    fontWeight: '500',
    fontSize: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
})


