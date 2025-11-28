import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId, updateStudent } from '@/lib/students'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ResetPINScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [currentPIN, setCurrentPIN] = useState('')
  const [newPIN, setNewPIN] = useState('')
  const [confirmPIN, setConfirmPIN] = useState('')
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const { data: studentData } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const result = await getStudentByUserId(user.id)
      if (result.error) throw result.error
      return result.student
    },
    enabled: !!user?.id,
  })

  const updatePINMutation = useMutation({
    mutationFn: async (pin: string) => {
      if (!studentData) throw new Error('Student not found')
      const result = await updateStudent(studentData.id, { pin })
      if (result.error) throw result.error
      return result.student
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', user?.id] })
      setSnackbarMessage('PIN reset successfully!')
      setSnackbarVisible(true)
      setTimeout(() => {
        router.back()
      }, 1500)
    },
    onError: (error: Error) => {
      setSnackbarMessage(error.message || 'Failed to reset PIN')
      setSnackbarVisible(true)
    },
  })

  const handleResetPIN = () => {
    // Validate inputs
    if (!currentPIN || currentPIN.length !== 4) {
      setSnackbarMessage('Please enter your current 4-digit PIN')
      setSnackbarVisible(true)
      return
    }

    if (!newPIN || newPIN.length !== 4) {
      setSnackbarMessage('Please enter a new 4-digit PIN')
      setSnackbarVisible(true)
      return
    }

    if (newPIN !== confirmPIN) {
      setSnackbarMessage('New PIN and confirmation do not match')
      setSnackbarVisible(true)
      return
    }

    if (newPIN === currentPIN) {
      setSnackbarMessage('New PIN must be different from current PIN')
      setSnackbarVisible(true)
      return
    }

    // Verify current PIN
    if (studentData?.pin !== currentPIN) {
      setSnackbarMessage('Current PIN is incorrect')
      setSnackbarVisible(true)
      return
    }

    // Update PIN
    updatePINMutation.mutate(newPIN)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <MaterialCommunityIcons name="lock-reset" size={32} color="#7B2CBF" />
        <View style={styles.headerText}>
          <Text variant="headlineSmall" style={styles.title}>
            Reset PIN
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Change your 4-digit attendance PIN
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.infoText}>
              Your PIN is used to mark attendance when scanning the QR code at the mess.
            </Text>

            {/* Current PIN */}
            <TextInput
              label="Current PIN"
              value={currentPIN}
              onChangeText={setCurrentPIN}
              mode="outlined"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
            />

            {/* New PIN */}
            <TextInput
              label="New PIN (4 digits)"
              value={newPIN}
              onChangeText={setNewPIN}
              mode="outlined"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock-plus" />}
            />

            {/* Confirm PIN */}
            <TextInput
              label="Confirm New PIN"
              value={confirmPIN}
              onChangeText={setConfirmPIN}
              mode="outlined"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
            />

            <Button
              mode="contained"
              onPress={handleResetPIN}
              loading={updatePINMutation.isPending}
              disabled={updatePINMutation.isPending}
              style={styles.button}
            >
              Reset PIN
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerText: {
    flex: 1,
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
  },
  card: {
    elevation: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoText: {
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
})

