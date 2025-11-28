import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface QuickAction {
  icon: string
  label: string
  route: string
  color: string
}

const actions: QuickAction[] = [
  {
    icon: 'clipboard-check',
    label: 'Mark\nAttendance',
    route: '/(admin)/attendance',
    color: '#10b981',
  },
  {
    icon: 'cash-plus',
    label: 'Add\nPayment',
    route: '/(admin)/add-payment',
    color: '#f59e0b',
  },
  {
    icon: 'account-plus',
    label: 'Add\nStudent',
    route: '/(admin)/add-student',
    color: '#6366f1',
  },
  {
    icon: 'view-list',
    label: 'View\nAll',
    route: '/(admin)/students',
    color: '#7B2CBF',
  },
]

export function QuickActionsGrid() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        ⚡ Quick Actions
      </Text>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.7}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.content}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={32}
                  color={action.color}
                />
                <Text variant="bodySmall" style={styles.label}>
                  {action.label}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  label: {
    marginTop: 8,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
})


