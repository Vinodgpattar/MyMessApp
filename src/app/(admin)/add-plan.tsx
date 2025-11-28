import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCreatePlan } from '@/hooks/usePlans'
import { MealSelector, type MealSelection } from '@/components/plans/MealSelector'

export default function AddPlanScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const createMutation = useCreatePlan()

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: '',
  })

  const [selectedMeals, setSelectedMeals] = useState<MealSelection>({
    breakfast: false,
    lunch: false,
    dinner: false,
  })

  const [errors, setErrors] = useState<{
    name?: string
    meals?: string
    price?: string
    durationDays?: string
  }>({})
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const updateMealsString = (meals: MealSelection): string => {
    return Object.entries(meals)
      .filter(([_, checked]) => checked)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
      .join(', ')
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required'
    }

    // Validate meals
    if (!selectedMeals.breakfast && !selectedMeals.lunch && !selectedMeals.dinner) {
      newErrors.meals = 'Please select at least one meal'
    }

    // Validate price
    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    // Validate duration
    const durationDays = parseInt(formData.durationDays)
    if (isNaN(durationDays) || durationDays <= 0) {
      newErrors.durationDays = 'Duration must be greater than 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSnackbarMessage('Please fix the errors in the form')
      setSnackbarVisible(true)
      return
    }

    setErrors({})

    try {
      const mealsString = updateMealsString(selectedMeals)
      const plan = await createMutation.mutateAsync({
        name: formData.name.trim(),
        meals: mealsString,
        price,
        durationDays,
      })

      setSnackbarMessage(`Plan "${plan.name}" created successfully!`)
      setSnackbarVisible(true)

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create plan'
      setErrors({ name: errorMessage })
      setSnackbarMessage(errorMessage)
      setSnackbarVisible(true)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Button
            icon="arrow-left"
            onPress={() => router.back()}
            mode="text"
            textColor="#666"
          >
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Add New Plan
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Plan Name */}
            <TextInput
              label="Plan Name *"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text })
                if (errors.name) {
                  setErrors({ ...errors, name: undefined })
                }
              }}
              mode="outlined"
              placeholder="e.g., B+L+D, L+D, Breakfast Only"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.name}
            />
            {errors.name && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.name}
                </Text>
              </View>
            )}

            {/* Meals Selector */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Meals Included *
              </Text>
              <MealSelector
                selectedMeals={selectedMeals}
                onChange={(meals) => {
                  setSelectedMeals(meals)
                  if (errors.meals) {
                    setErrors({ ...errors, meals: undefined })
                  }
                }}
                error={errors.meals}
              />
              {errors.meals && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                  <Text variant="bodySmall" style={styles.error}>
                    {errors.meals}
                  </Text>
                </View>
              )}
            </View>

            {/* Price and Duration Row */}
            <View style={styles.row}>
              <View style={styles.halfInputContainer}>
                <TextInput
                  label="Price (₹) *"
                  value={formData.price}
                  onChangeText={(text) => {
                    setFormData({ ...formData, price: text })
                    if (errors.price) {
                      setErrors({ ...errors, price: undefined })
                    }
                  }}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.price}
                />
                {errors.price && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                    <Text variant="bodySmall" style={styles.error}>
                      {errors.price}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.halfInputContainer}>
                <TextInput
                  label="Duration (Days) *"
                  value={formData.durationDays}
                  onChangeText={(text) => {
                    setFormData({ ...formData, durationDays: text })
                    if (errors.durationDays) {
                      setErrors({ ...errors, durationDays: undefined })
                    }
                  }}
                  mode="outlined"
                  keyboardType="number-pad"
                  placeholder="30"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.durationDays}
                />
                {errors.durationDays && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                    <Text variant="bodySmall" style={styles.error}>
                      {errors.durationDays}
                    </Text>
                  </View>
                )}
              </View>
            </View>

          </Card.Content>
        </Card>
      </ScrollView>

      {/* Sticky Action Buttons */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={styles.submitButton}
            buttonColor="#7B2CBF"
          >
            Create Plan
          </Button>
        </View>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
})


