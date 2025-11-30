import React from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { useQuery } from '@tanstack/react-query'

// Feature flag: Set to true to show PIN reset UI, false to hide it
const ENABLE_PIN_RESET = false

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const result = await getStudentByUserId(user.id)
      if (result.error) throw result.error
      return result.student
    },
    enabled: !!user?.id,
  })

  const student = studentData

  const handleResetPIN = () => {
    router.push('/(student)/reset-pin')
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // CRITICAL FIX: Navigate to login (not admin-login for better UX)
      router.replace('/(auth)/admin-login')
    } catch (error) {
      // CRITICAL FIX: Show error feedback instead of silent failure
      Alert.alert(
        'Logout Error',
        'Failed to logout. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleLogout },
        ]
      )
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Profile
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Manage your account
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {student && (
          <>
            {/* Personal Information */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="account" size={24} color="#7B2CBF" />
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Personal Information
                  </Text>
                </View>
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Name:</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {student.name}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Email:</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {student.email}
                    </Text>
                  </View>
                  {student.rollNumber && (
                    <View style={styles.infoRow}>
                      <Text variant="bodyMedium" style={styles.infoLabel}>Roll Number:</Text>
                      <Text variant="bodyLarge" style={styles.infoValue}>
                        {student.rollNumber}
                      </Text>
                    </View>
                  )}
                  {student.contactNumber && (
                    <View style={styles.infoRow}>
                      <Text variant="bodyMedium" style={styles.infoLabel}>Contact:</Text>
                      <Text variant="bodyLarge" style={styles.infoValue}>
                        {student.contactNumber}
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>

            {/* Plan Information */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#7B2CBF" />
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Plan Information
                  </Text>
                </View>
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Plan:</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {student.plan.name}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Meals:</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {student.plan.meals}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Start Date:</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {new Date(student.joinDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>End Date:</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {new Date(student.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* PIN Management - Hidden by default, set ENABLE_PIN_RESET = true to show */}
            {ENABLE_PIN_RESET && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="lock" size={24} color="#7B2CBF" />
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      PIN Management
                    </Text>
                  </View>
                  <View style={styles.pinSection}>
                    <Text variant="bodyMedium" style={styles.pinInfo}>
                      Your 4-digit PIN is used for marking attendance via QR code.
                    </Text>
                    <Button
                      mode="contained"
                      onPress={handleResetPIN}
                      style={styles.pinButton}
                      icon="lock-reset"
                    >
                      Reset PIN
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#EF4444"
          icon="logout"
        >
          Logout
        </Button>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pinSection: {
    gap: 12,
  },
  pinInfo: {
    color: '#666',
    lineHeight: 20,
  },
  pinButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#EF4444',
  },
})

