import React, { Component, ReactNode } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Button, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Import logger dynamically to avoid circular dependencies
    import('../lib/logger').then(({ logger }) => {
      logger.error('ErrorBoundary caught an error', error, {
        componentStack: errorInfo.componentStack,
      })
    })
    
    this.setState({
      error,
      errorInfo,
    })

    // Error logged via logger utility
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
                </View>
                
                <Text variant="headlineSmall" style={styles.title}>
                  Something went wrong
                </Text>
                
                <Text variant="bodyMedium" style={styles.message}>
                  We're sorry, but something unexpected happened. Please try again.
                </Text>

                {__DEV__ && this.state.error && (
                  <View style={styles.errorDetails}>
                    <Text variant="labelSmall" style={styles.errorLabel}>
                      Error Details (Development Only):
                    </Text>
                    <Text variant="bodySmall" style={styles.errorText}>
                      {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                      <Text variant="bodySmall" style={styles.errorText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={this.handleReset}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                >
                  Try Again
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorLabel: {
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  errorText: {
    color: '#7F1D1D',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    paddingVertical: 4,
  },
})

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

