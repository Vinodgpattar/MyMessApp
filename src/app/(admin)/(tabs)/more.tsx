import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Card, List, Divider, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function MoreScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
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
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          More
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* User Info */}
        <Card style={styles.userCard}>
          <Card.Content>
            <View style={styles.userInfo}>
              <MaterialCommunityIcons name="account-circle" size={48} color="#7B2CBF" />
              <View style={styles.userText}>
                <Text variant="titleMedium" style={styles.userName}>
                  Admin
                </Text>
                <Text variant="bodySmall" style={styles.userEmail}>
                  {user?.email}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Features */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <List.Item
              title="Plans Management"
              description="Create and manage meal plans"
              left={(props) => <List.Icon {...props} icon="silverware-fork-knife" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(admin)/plans')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="QR Code Generator"
              description="Generate QR code for attendance"
              left={(props) => <List.Icon {...props} icon="qrcode" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(admin)/qr-generator')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Send Announcement"
              description="Send notifications to students"
              left={(props) => <List.Icon {...props} icon="bullhorn" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(admin)/send-announcement')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Sent Announcements"
              description="View all sent announcements"
              left={(props) => <List.Icon {...props} icon="history" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(admin)/announcements')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Settings"
              description="Notification and app preferences"
              left={(props) => <List.Icon {...props} icon="cog" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(admin)/(tabs)/settings')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Account */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <List.Item
              title="Profile"
              description="View account information"
              left={(props) => <List.Icon {...props} icon="account" color="#6366f1" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Logout */}
        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
          buttonColor="#ef4444"
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
    color: '#1F2937',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for tab bar
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    color: '#666',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 0,
  },
  listItem: {
    paddingHorizontal: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 8,
  },
})


