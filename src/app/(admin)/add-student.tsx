import React, { useState, useEffect, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, Menu, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCreateStudent, useSendCredentialsEmail } from '@/hooks/useStudents'
import { usePlans } from '@/hooks/usePlans'
import { CredentialsDisplay } from '@/components/students/CredentialsDisplay'
import { SimpleDatePicker } from '@/components/shared/SimpleDatePicker'
import { format } from 'date-fns'
import { MaterialCommunityIcons } from '@expo/vector-icons'

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AddStudentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const createMutation = useCreateStudent()
  const sendEmailMutation = useSendCredentialsEmail()
  const { data: plansData } = usePlans()
  const plans = plansData?.plans || []

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    planId: '',
    joinDate: formatDateLocal(new Date()),
    endDate: '',
    paid: '',
  })

  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null)
  const [planMenuVisible, setPlanMenuVisible] = useState(false)
  const [menuKey, setMenuKey] = useState(0) // Key to force menu remount
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const [createdStudent, setCreatedStudent] = useState<any>(null)
  const [endDateManuallyEdited, setEndDateManuallyEdited] = useState(false)

  // Auto-calculate end date when plan or join date changes
  useEffect(() => {
    if (selectedPlan && formData.joinDate && !endDateManuallyEdited) {
      const joinDate = new Date(formData.joinDate)
      const calculatedEndDate = new Date(joinDate)
      calculatedEndDate.setDate(calculatedEndDate.getDate() + selectedPlan.durationDays)
      const calculatedEndDateStr = formatDateLocal(calculatedEndDate)
      
      setFormData(prev => ({
        ...prev,
        endDate: calculatedEndDateStr,
      }))
    }
  }, [selectedPlan, formData.joinDate, endDateManuallyEdited])

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find((p) => p.id === parseInt(planId))
    setSelectedPlan(plan || null)
    setFormData(prev => ({ ...prev, planId }))
    setEndDateManuallyEdited(false)
    // Close menu and force remount on next open
    setPlanMenuVisible(false)
    setMenuKey(prev => prev + 1)
  }

  const handleMenuToggle = () => {
    // Toggle menu - if opening, ensure it's ready
    if (!planMenuVisible) {
      setPlanMenuVisible(true)
    } else {
      setPlanMenuVisible(false)
    }
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

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

    if (!formData.planId) {
      newErrors.planId = 'Please select a plan'
    }

    if (!selectedPlan) {
      newErrors.planId = 'Invalid plan selected'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    } else {
      const joinDate = new Date(formData.joinDate)
      const endDate = new Date(formData.endDate)
      if (endDate <= joinDate) {
        newErrors.endDate = 'End date must be after join date'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    try {
      const joinDate = new Date(formData.joinDate)
      const endDate = formData.endDate ? new Date(formData.endDate) : new Date(joinDate)
      
      if (!formData.endDate) {
        endDate.setDate(endDate.getDate() + selectedPlan!.durationDays)
      }

      const student = await createMutation.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim().replace(/\D/g, ''),
        planId: parseInt(formData.planId),
        joinDate: formData.joinDate,
        endDate: formatDateLocal(endDate),
        paid: parseFloat(formData.paid) || 0,
      })

      setCreatedStudent(student)
      setShowCredentials(true)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create student'
      setSnackbarMessage(errorMessage)
      setSnackbarVisible(true)
    }
  }

  const handleSendEmail = async () => {
    if (!createdStudent) return

    try {
      await sendEmailMutation.mutateAsync({ 
        studentId: createdStudent.id,
        password: createdStudent.password
      })
      setSnackbarMessage('Credentials email sent successfully')
      setSnackbarVisible(true)
    } catch (err: any) {
      setSnackbarMessage(err.message || 'Failed to send email')
      setSnackbarVisible(true)
    }
  }

  const handleDone = () => {
    router.back()
  }

  // Show credentials screen after successful creation
  if (showCredentials && createdStudent) {
    return (
      <CredentialsDisplay
        email={createdStudent.email}
        password={createdStudent.password || 'Not generated'}
        pin={createdStudent.pin}
        studentName={createdStudent.name}
        rollNumber={createdStudent.rollNumber}
        onSendEmail={handleSendEmail}
        onDone={handleDone}
      />
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {/* Modern Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="account-plus" size={28} color="#7B2CBF" />
            </View>
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.title}>
                Add New Student
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Register a new student to the system
              </Text>
            </View>
          </View>
        </View>

        {/* Personal Information Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color="#6366F1" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Personal Information *
              </Text>
            </View>

            <TextInput
              mode="outlined"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text })
                if (errors.name) {
                  setErrors({ ...errors, name: '' })
                }
              }}
              placeholder="Enter student full name"
              label="Full Name"
              left={<TextInput.Icon icon="account" />}
              error={!!errors.name}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {errors.name && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.name}
                </Text>
              </View>
            )}

            <TextInput
              mode="outlined"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text })
                if (errors.email) {
                  setErrors({ ...errors, email: '' })
                }
              }}
              placeholder="student@example.com"
              label="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              error={!!errors.email}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {errors.email && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.email}
                </Text>
              </View>
            )}

            <TextInput
              mode="outlined"
              value={formData.contactNumber}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '')
                if (digits.length <= 10) {
                  setFormData({ ...formData, contactNumber: digits })
                  if (errors.contactNumber) {
                    setErrors({ ...errors, contactNumber: '' })
                  }
                }
              }}
              placeholder="9876543210"
              label="Mobile Number"
              keyboardType="phone-pad"
              maxLength={10}
              left={<TextInput.Icon icon="phone" />}
              error={!!errors.contactNumber}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {errors.contactNumber && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.contactNumber}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Plan Selection Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#10B981" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Select Plan *
              </Text>
            </View>
            {plans.length === 0 ? (
              <View style={styles.noPlansContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.noPlansText}>
                  No plans available. Please create a plan first.
                </Text>
              </View>
            ) : (
              <>
                <Menu
                  key={menuKey}
                  visible={planMenuVisible}
                  onDismiss={() => setPlanMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={handleMenuToggle}
                      activeOpacity={0.7}
                    >
                      <View style={styles.planSelectorButton}>
                        <View style={styles.planSelectorContent}>
                          {selectedPlan ? (
                            <>
                              <MaterialCommunityIcons name="check-circle" size={20} color="#7B2CBF" />
                              <View style={styles.planSelectorText}>
                                <Text variant="bodyLarge" style={styles.planSelectorName}>
                                  {selectedPlan.name}
                                </Text>
                                <Text variant="bodySmall" style={styles.planSelectorDetails}>
                                  ₹{selectedPlan.price.toFixed(2)} • {selectedPlan.durationDays} days
                                </Text>
                              </View>
                            </>
                          ) : (
                            <>
                              <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                              <Text variant="bodyLarge" style={styles.planSelectorPlaceholder}>
                                Select a plan
                              </Text>
                            </>
                          )}
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                      </View>
                    </TouchableOpacity>
                  }
                  contentStyle={styles.menuContent}
                >
                  {plans.map((plan) => (
                    <Menu.Item
                      key={plan.id}
                      onPress={() => {
                        handlePlanSelect(plan.id.toString())
                      }}
                      title={plan.name}
                      titleStyle={[
                        styles.menuItemTitle,
                        selectedPlan?.id === plan.id && styles.menuItemTitleSelected
                      ]}
                      description={`₹${plan.price.toFixed(2)} • ${plan.durationDays} days`}
                      descriptionStyle={styles.menuItemDescription}
                      leadingIcon={selectedPlan?.id === plan.id ? 'check-circle' : undefined}
                    />
                  ))}
                </Menu>
                {errors.planId && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                    <Text variant="bodySmall" style={styles.error}>
                      {errors.planId}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Dates Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={20} color="#F59E0B" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Dates *
              </Text>
            </View>

            <View style={styles.dateFieldContainer}>
              <Text variant="labelLarge" style={styles.dateFieldLabel}>
                Join Date
              </Text>
              <SimpleDatePicker
                value={formData.joinDate}
                onChange={(date) => {
                  setFormData({ ...formData, joinDate: date })
                  setEndDateManuallyEdited(false)
                }}
                label="Select Join Date"
              />
            </View>

            <View style={styles.dateFieldContainer}>
              <Text variant="labelLarge" style={styles.dateFieldLabel}>
                End Date
              </Text>
              <SimpleDatePicker
                value={formData.endDate || ''}
                onChange={(date) => {
                  setFormData({ ...formData, endDate: date })
                  setEndDateManuallyEdited(true)
                }}
                label="Select End Date"
                minimumDate={formData.joinDate ? new Date(new Date(formData.joinDate).getTime() + 24 * 60 * 60 * 1000) : undefined}
              />
              {selectedPlan && formData.joinDate && (
                <View style={styles.endDateInfo}>
                  <MaterialCommunityIcons name="information" size={16} color="#6366f1" />
                  <Text variant="bodySmall" style={styles.endDateHint}>
                    Suggested: {format(
                      new Date(
                        new Date(formData.joinDate).getTime() +
                          selectedPlan.durationDays * 24 * 60 * 60 * 1000
                      ),
                      'dd MMM yyyy'
                    )} ({selectedPlan.durationDays} days)
                  </Text>
                </View>
              )}
              {errors.endDate && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                  <Text variant="bodySmall" style={styles.error}>
                    {errors.endDate}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Initial Payment Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#10B981" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Initial Payment
              </Text>
            </View>
            <TextInput
              mode="outlined"
              value={formData.paid}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.]/g, '')
                setFormData({ ...formData, paid: cleaned })
              }}
              placeholder="Enter amount (e.g., 5000.00)"
              label="Amount Paid (₹)"
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon="currency-inr" />}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {/* Quick Amount Buttons */}
            <View style={styles.quickButtons}>
              {[500, 1000, 2000, 5000].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  onPress={() => {
                    setFormData({ ...formData, paid: quickAmount.toString() })
                  }}
                  style={[
                    styles.quickButtonTouchable,
                    formData.paid === quickAmount.toString() && styles.quickButtonSelected
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickButtonText,
                    formData.paid === quickAmount.toString() && styles.quickButtonTextSelected
                  ]}>
                    ₹{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Submit Button - Fixed at bottom */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 8 }]}>
        <Button
          mode="contained"
          onPress={() => {
            Keyboard.dismiss()
            handleSubmit()
          }}
          loading={createMutation.isPending}
          disabled={createMutation.isPending || plans.length === 0}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          buttonColor="#7B2CBF"
          icon="check-circle"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Student'}
        </Button>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'OK',
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
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickButtonTouchable: {
    flex: 1,
    minWidth: '22%',
    minHeight: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quickButtonSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  quickButtonTextSelected: {
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
  noPlansContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noPlansText: {
    flex: 1,
    color: '#92400E',
    fontStyle: 'italic',
  },
  planSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  planSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planSelectorText: {
    flex: 1,
  },
  planSelectorName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  planSelectorDetails: {
    color: '#6B7280',
    fontSize: 13,
  },
  planSelectorPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  menuContent: {
    borderRadius: 12,
    marginTop: 8,
  },
  menuItemTitle: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuItemTitleSelected: {
    color: '#7B2CBF',
  },
  menuItemDescription: {
    color: '#6b7280',
    fontSize: 12,
  },
  dateFieldContainer: {
    marginBottom: 16,
  },
  dateFieldLabel: {
    marginBottom: 8,
    color: '#374151',
    fontWeight: '600',
  },
  endDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  endDateHint: {
    color: '#6366f1',
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    elevation: 0,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
})
