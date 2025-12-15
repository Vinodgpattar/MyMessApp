import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Card, Text, Button, IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { Snackbar } from 'react-native-paper'

interface CredentialsDisplayProps {
  email: string
  password: string
  pin: string
  studentName: string
  rollNumber: string | null
  onSendEmail?: () => void
  onDone: () => void
}

export function CredentialsDisplay({
  email,
  password,
  pin,
  studentName,
  rollNumber,
  onSendEmail,
  onDone,
}: CredentialsDisplayProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text)
    setSnackbarMessage(`${label} copied to clipboard!`)
    setSnackbarVisible(true)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#10b981" />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Student Created Successfully!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {studentName}
          {rollNumber && ` • ${rollNumber}`}
        </Text>
      </View>

      {/* Credentials Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Login Credentials
          </Text>
          <Text variant="bodySmall" style={styles.cardSubtitle}>
            Share these credentials with the student
          </Text>

          {/* Email */}
          <View style={styles.credentialItem}>
            <Text variant="labelMedium" style={styles.credentialLabel}>
              Email
            </Text>
            <View style={styles.credentialValueContainer}>
              <Text variant="bodyLarge" style={styles.credentialValue}>
                {email}
              </Text>
              <IconButton
                icon="content-copy"
                size={20}
                onPress={() => copyToClipboard(email, 'Email')}
                style={styles.copyButton}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.credentialItem}>
            <Text variant="labelMedium" style={styles.credentialLabel}>
              Password
            </Text>
            <View style={styles.credentialValueContainer}>
              <Text variant="bodyLarge" style={styles.credentialValue}>
                {showPassword ? password : '••••••••••'}
              </Text>
              <View style={styles.credentialActions}>
                <IconButton
                  icon={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.iconButton}
                />
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={() => copyToClipboard(password, 'Password')}
                  style={styles.copyButton}
                />
              </View>
            </View>
          </View>

        </Card.Content>
      </Card>

      {/* Instructions Card */}
      <Card style={styles.instructionsCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.instructionsTitle}>
            Instructions for Student
          </Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
              <Text variant="bodySmall" style={styles.instructionText}>
                Login to the Chinnamma Ootada Mane student app using your email and password.
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
              <Text variant="bodySmall" style={styles.instructionText}>
                Keep your password secure and do not share it with anyone.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {onSendEmail && (
          <Button
            mode="outlined"
            onPress={onSendEmail}
            icon="send"
            style={styles.sendEmailButton}
          >
            Send Email
          </Button>
        )}
        <Button
          mode="contained"
          onPress={onDone}
          style={styles.doneButton}
        >
          Done
        </Button>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  card: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#666',
    marginBottom: 20,
  },
  credentialItem: {
    marginBottom: 20,
  },
  credentialLabel: {
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  credentialValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  credentialValue: {
    flex: 1,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
  pinValue: {
    flex: 1,
    fontWeight: 'bold',
    color: '#7B2CBF',
    letterSpacing: 8,
    textAlign: 'center',
  },
  credentialActions: {
    flexDirection: 'row',
  },
  iconButton: {
    margin: 0,
  },
  copyButton: {
    margin: 0,
  },
  instructionsCard: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#f0f9ff',
  },
  instructionsTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    color: '#1a1a1a',
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  sendEmailButton: {
    borderRadius: 8,
  },
  doneButton: {
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
  },
})

