import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { Text, Switch, Card, Button, Divider, Snackbar, List } from 'react-native-paper'
import { useNotifications } from '@/context/NotificationContext'
import { NotificationFrequency } from '@/lib/notifications'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const FREQUENCY_OPTIONS: Array<{ value: NotificationFrequency; label: string }> = [
  { value: 5, label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every 1 hour' },
]

export default function NotificationSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const {
    config,
    updateConfig,
    isEnabled,
    toggleEnabled,
    setFrequency,
    permissionsGranted,
    requestPermissions,
    lastNotificationTime,
  } = useNotifications()

  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const handleToggleEnabled = async () => {
    if (!isEnabled && !permissionsGranted) {
      // Request permissions when enabling
      const granted = await requestPermissions()
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive attendance updates.',
          [{ text: 'OK' }]
        )
        return
      }
    }
    await toggleEnabled()
    setSnackbarMessage(isEnabled ? 'Notifications disabled' : 'Notifications enabled')
    setSnackbarVisible(true)
  }

  const handleFrequencyChange = async (frequency: NotificationFrequency) => {
    await setFrequency(frequency)
    setSnackbarMessage(`Frequency updated to ${FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label}`)
    setSnackbarVisible(true)
  }

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions()
    if (granted) {
      setSnackbarMessage('Notification permissions granted')
    } else {
      setSnackbarMessage('Notification permissions denied. Please enable in device settings.')
    }
    setSnackbarVisible(true)
  }

  const handleToggleStudentNames = async () => {
    await updateConfig({ showStudentNames: !config.showStudentNames })
    setSnackbarMessage(
      config.showStudentNames ? 'Student names hidden' : 'Student names shown'
    )
    setSnackbarVisible(true)
  }

  const handleToggleNoActivity = async () => {
    await updateConfig({ showWhenNoActivity: !config.showWhenNoActivity })
    setSnackbarMessage(
      config.showWhenNoActivity
        ? 'No activity notifications disabled'
        : 'No activity notifications enabled'
    )
    setSnackbarVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.title}>
          Notifications
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Enable/Disable */}
        <Card style={styles.card} mode="outlined">
          <List.Item
            title="Enable Notifications"
            description="Receive periodic attendance updates"
            left={(props) => (
              <List.Icon {...props} icon="bell" color="#7B2CBF" />
            )}
            right={() => (
              <Switch
                value={isEnabled && permissionsGranted}
                onValueChange={handleToggleEnabled}
                disabled={!permissionsGranted && !isEnabled}
              />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        </Card>

        {/* Permissions Status */}
        {!permissionsGranted && (
          <Card style={[styles.card, styles.warningCard]} mode="outlined">
            <Card.Content>
              <View style={styles.warningContent}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#f59e0b" />
                <View style={styles.warningText}>
                  <Text variant="titleSmall" style={styles.warningTitle}>
                    Permissions Required
                  </Text>
                  <Text variant="bodySmall" style={styles.warningDescription}>
                    Please grant notification permissions to receive attendance updates.
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={handleRequestPermissions}
                style={styles.permissionButton}
                buttonColor="#f59e0b"
              >
                Grant Permissions
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Frequency Selection */}
        <Card style={styles.card} mode="outlined">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Frequency
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              How often to receive attendance updates
            </Text>
          </Card.Content>
          {FREQUENCY_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleFrequencyChange(option.value)}
              activeOpacity={0.7}
            >
              <List.Item
                title={option.label}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={
                      config.frequency === option.value
                        ? "radiobox-marked"
                        : "radiobox-blank"
                    }
                    color={config.frequency === option.value ? "#7B2CBF" : "#9CA3AF"}
                  />
                )}
                right={() =>
                  config.frequency === option.value ? (
                    <MaterialCommunityIcons name="check" size={24} color="#7B2CBF" />
                  ) : null
                }
                titleStyle={[
                  styles.frequencyLabel,
                  config.frequency === option.value && styles.frequencyLabelActive,
                ]}
                style={[
                  styles.listItem,
                  index === FREQUENCY_OPTIONS.length - 1 && styles.lastListItem,
                ]}
              />
              {index < FREQUENCY_OPTIONS.length - 1 && <Divider />}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Content Preferences */}
        <Card style={styles.card} mode="outlined">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Content Preferences
            </Text>
          </Card.Content>
          <List.Item
            title="Show Student Names"
            description="Include student names in notifications"
            left={(props) => (
              <List.Icon {...props} icon="account" color="#7B2CBF" />
            )}
            right={() => (
              <Switch
                value={config.showStudentNames}
                onValueChange={handleToggleStudentNames}
              />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title="Show When No Activity"
            description="Send notifications even when no attendance is marked"
            left={(props) => (
              <List.Icon {...props} icon="bell-off" color="#7B2CBF" />
            )}
            right={() => (
              <Switch
                value={config.showWhenNoActivity}
                onValueChange={handleToggleNoActivity}
              />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
            style={styles.lastListItem}
          />
        </Card>

        {/* Active Hours Info */}
        <Card style={styles.card} mode="outlined">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Active Hours
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Notifications are only sent during meal hours
            </Text>
          </Card.Content>
          <List.Item
            title="Breakfast"
            description="7:00 AM - 10:00 AM"
            left={(props) => (
              <List.Icon {...props} icon="weather-sunset-up" color="#f59e0b" />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title="Lunch"
            description="12:00 PM - 3:00 PM"
            left={(props) => (
              <List.Icon {...props} icon="weather-sunny" color="#10b981" />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title="Dinner"
            description="7:00 PM - 10:00 PM"
            left={(props) => (
              <List.Icon {...props} icon="weather-night" color="#6366f1" />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
            style={styles.lastListItem}
          />
        </Card>

        {/* Status Card */}
        <Card 
          style={[
            styles.card, 
            isEnabled && permissionsGranted ? styles.successCard : styles.errorCard
          ]} 
          mode="outlined"
        >
          <Card.Content>
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name={isEnabled && permissionsGranted ? 'check-circle' : 'close-circle'}
                size={28}
                color={isEnabled && permissionsGranted ? '#10b981' : '#ef4444'}
              />
              <View style={styles.statusText}>
                <Text variant="titleMedium" style={styles.statusTitle}>
                  {isEnabled && permissionsGranted ? 'Active' : 'Inactive'}
                </Text>
                <Text variant="bodySmall" style={styles.statusDescription}>
                  {isEnabled && permissionsGranted
                    ? `Sending notifications every ${config.frequency} minutes during meal hours`
                    : 'Notifications are currently disabled'}
                </Text>
                {lastNotificationTime && (
                  <Text variant="bodySmall" style={styles.lastNotificationText}>
                    Last sent: {format(lastNotificationTime, 'MMM dd, h:mm a')}
                  </Text>
                )}
              </View>
            </View>
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for tab bar
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    paddingBottom: 8,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningDescription: {
    color: '#78350f',
  },
  permissionButton: {
    marginTop: 8,
    backgroundColor: '#f59e0b',
  },
  listTitle: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 15,
  },
  listDescription: {
    color: '#6B7280',
    fontSize: 13,
  },
  listItem: {
    paddingVertical: 8,
  },
  lastListItem: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontSize: 16,
  },
  sectionDescription: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 0,
  },
  frequencyLabel: {
    color: '#1F2937',
    fontWeight: '500',
  },
  frequencyLabelActive: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontSize: 16,
  },
  statusDescription: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4,
  },
  lastNotificationText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
})


