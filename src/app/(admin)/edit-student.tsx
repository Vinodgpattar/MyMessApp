import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStudent, useUpdateStudent } from '@/hooks/useStudents'
import { SimpleDatePicker } from '@/components/shared/SimpleDatePicker'
import { format } from 'date-fns'

export default function EditStudentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const studentId = id ? parseInt(id) : 0

  const { data, isLoading, error: studentError } = useStudent(studentId)
  const updateMutation = useUpdateStudent()

  const student = data?.student

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    joinDate: '',
    endDate: '',
    paid: '0',
  })

  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    contactNumber?: string
    joinDate?: string
    endDate?: string
  }>({})
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Update form when student loads
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        email: student.email,
        contactNumber: student.contactNumber || '',
        joinDate: student.joinDate,
        endDate: student.endDate,
        paid: student.paid.toString(),
      })
    }
  }, [student])

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    // Validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Invalid email format'
      }
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Mobile number is required'
    } else {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(formData.contactNumber.trim().replace(/\D/g, ''))) {
        newErrors.contactNumber = 'Mobile number must be 10 digits'
      }
    }

    if (!formData.joinDate) {
      newErrors.joinDate = 'Join date is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSnackbarMessage('Please fix the errors in the form')
      setSnackbarVisible(true)
      return
    }

    setErrors({})

    try {
      await updateMutation.mutateAsync({
        id: studentId,
        data: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contactNumber: formData.contactNumber.trim().replace(/\D/g, ''),
          joinDate: formData.joinDate,
          endDate: formData.endDate,
          paid: parseFloat(formData.paid) || 0,
        },
      })

      setSnackbarMessage('Student updated successfully!')
      setSnackbarVisible(true)

      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update student'
      setError(errorMessage)
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
      {isLoading ? (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Button
              icon="arrow-left"
              onPress={() => router.back()}
              mode="text"
              textColor="#666"
            >
              Back
            </Button>
            <Text variant="headlineSmall" style={styles.title}>
              Edit Student
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.inlineLoadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Loading student...
            </Text>
          </View>
        </>
      ) : studentError || !student ? (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Button
              icon="arrow-left"
              onPress={() => router.back()}
              mode="text"
              textColor="#666"
            >
              Back
            </Button>
            <Text variant="headlineSmall" style={styles.title}>
              Edit Student
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text variant="titleMedium" style={styles.errorTitle}>
              {studentError?.message || 'Student not found'}
            </Text>
            <Button mode="contained" onPress={() => router.back()} buttonColor="#7B2CBF">
              Go Back
            </Button>
          </View>
        </>
      ) : (
        <>
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
                Edit Student
              </Text>
              <View style={{ width: 60 }} />
            </View>

        {/* Form Card */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Plan Info (Read-only) */}
            <View style={styles.readOnlySection}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Plan (Cannot be changed)
              </Text>
              <Text variant="bodyMedium" style={styles.readOnlyValue}>
                {student.plan.name} - ₹{student.plan.price.toFixed(2)}
              </Text>
            </View>

            {/* Name */}
            <TextInput
              label="Name *"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text })
                if (errors.name) {
                  setErrors({ ...errors, name: undefined })
                }
              }}
              mode="outlined"
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

            {/* Email */}
            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text })
                if (errors.email) {
                  setErrors({ ...errors, email: undefined })
                }
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.email}
            />
            {errors.email && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.email}
                </Text>
              </View>
            )}

            {/* Mobile Number */}
            <TextInput
              label="Mobile Number *"
              value={formData.contactNumber}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '')
                if (digits.length <= 10) {
                  setFormData({ ...formData, contactNumber: digits })
                  if (errors.contactNumber) {
                    setErrors({ ...errors, contactNumber: undefined })
                  }
                }
              }}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.contactNumber}
              left={<TextInput.Icon icon="phone" />}
            />
            {errors.contactNumber && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.contactNumber}
                </Text>
              </View>
            )}

            {/* Join Date */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Join Date *
              </Text>
              <SimpleDatePicker
                value={formData.joinDate}
                onChange={(date) => {
                  setFormData({ ...formData, joinDate: date })
                  if (errors.joinDate) {
                    setErrors({ ...errors, joinDate: undefined })
                  }
                }}
                label="Select Join Date"
              />
              {errors.joinDate && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                  <Text variant="bodySmall" style={styles.error}>
                    {errors.joinDate}
                  </Text>
                </View>
              )}
            </View>

            {/* End Date */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                End Date *
              </Text>
              <SimpleDatePicker
                value={formData.endDate}
                onChange={(date) => {
                  setFormData({ ...formData, endDate: date })
                  if (errors.endDate) {
                    setErrors({ ...errors, endDate: undefined })
                  }
                }}
                label="Select End Date"
              />
              {errors.endDate && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                  <Text variant="bodySmall" style={styles.error}>
                    {errors.endDate}
                  </Text>
                </View>
              )}
            </View>

            {/* Paid Amount */}
            <TextInput
              label="Paid Amount (₹)"
              value={formData.paid}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.]/g, '')
                setFormData({ ...formData, paid: cleaned })
              }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Icon icon="currency-inr" />}
            />

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
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
              style={styles.submitButton}
              buttonColor="#7B2CBF"
            >
              Save Changes
            </Button>
          </View>
        </View>
        </>
      )}

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
  inlineLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
  fullScreenErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    color: '#dc2626',
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  inputOutline: {
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
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
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  readOnlySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  readOnlyValue: {
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
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

