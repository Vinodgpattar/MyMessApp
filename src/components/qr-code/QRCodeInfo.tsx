import { View, StyleSheet } from 'react-native'
import { Text, Card, Button, Snackbar } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'

interface QRCodeInfoProps {
  url: string
}

export function QRCodeInfo({ url }: QRCodeInfoProps) {
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(url)
      setSnackbarVisible(true)
    } catch (error) {
      // Error copying URL - silently handle
    }
  }

  // Truncate URL for display
  const displayUrl = url.length > 40 
    ? `${url.substring(0, 37)}...` 
    : url

  return (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.container}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons 
                name="link-variant" 
                size={20} 
                color="#666" 
              />
              <Text variant="labelLarge" style={styles.label}>
                Identifier:
              </Text>
            </View>
            <View style={styles.urlContainer}>
              <Text 
                variant="bodyMedium" 
                style={styles.urlText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {displayUrl}
              </Text>
              <Button
                mode="text"
                onPress={handleCopy}
                icon="content-copy"
                style={styles.copyButton}
                labelStyle={styles.copyButtonLabel}
              >
                Copy
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        Identifier copied to clipboard!
      </Snackbar>
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  container: {
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#666',
    fontWeight: '600',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  urlText: {
    flex: 1,
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 8,
  },
  copyButtonLabel: {
    fontSize: 12,
  },
})


