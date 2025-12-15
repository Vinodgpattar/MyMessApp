import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import {
  requestNotificationPermissions,
  sendAttendanceNotification,
  cancelAllNotifications,
  NotificationConfig,
  NotificationFrequency,
  DEFAULT_CONFIG,
} from '@/lib/notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { logger } from '@/lib/logger'

const NOTIFICATION_CONFIG_KEY = '@notification_config'
const NOTIFICATION_HISTORY_KEY = '@notification_history'
const MAX_HISTORY_ITEMS = 50

export interface NotificationHistoryItem {
  id: string
  title: string
  body: string
  timestamp: Date
  timeWindow?: { start: string; end: string }
  date?: string
}

interface NotificationContextType {
  config: NotificationConfig
  updateConfig: (config: Partial<NotificationConfig>) => Promise<void>
  isEnabled: boolean
  toggleEnabled: () => Promise<void>
  setFrequency: (frequency: NotificationFrequency) => Promise<void>
  permissionsGranted: boolean
  requestPermissions: () => Promise<boolean>
  lastNotificationTime: Date | null
  notificationHistory: NotificationHistoryItem[]
  addToHistory: (notification: NotificationHistoryItem) => Promise<void>
  clearHistory: () => Promise<void>
  deleteFromHistory: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null)
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null)

  // Load config and history from storage
  useEffect(() => {
    loadConfig()
    loadHistory()
    checkPermissions()
  }, [])

  // Setup notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const now = new Date()
        setLastNotificationTime(now)
        
        // Add to history
        const historyItem: NotificationHistoryItem = {
          id: notification.request.identifier || Date.now().toString(),
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          timestamp: now,
          timeWindow: notification.request.content.data?.timeWindow,
          date: notification.request.content.data?.date,
        }
        await addToHistory(historyItem)
      }
    )

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data
        
        // Handle plan expiry notifications (for students)
        if (data?.type === 'plan_expiring' || data?.type === 'plan_expired') {
          router.push('/(student)/(tabs)/profile')
          return
        }
        
        // Navigate to attendance screen (for admin)
        if (data?.date) {
          router.push(`/(admin)/attendance?date=${data.date}`)
        } else if (data?.type === 'attendance_update') {
          router.push('/(admin)/attendance')
        }
      }
    )

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove()
        } catch (error) {
          // Subscription might already be removed or not available
          // Silently handle cleanup errors
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove()
        } catch (error) {
          // Subscription might already be removed or not available
          // Silently handle cleanup errors
        }
      }
    }
  }, [router])

  // Register push token when user logs in and permissions are granted
  useEffect(() => {
    if (user?.id && permissionsGranted) {
      const registerPushToken = async () => {
        try {
          // Get Expo push token
          const projectId = 
            Constants.expoConfig?.extra?.eas?.projectId ||
            Constants.easConfig?.projectId

          if (!projectId) {
            logger.warn('Expo project ID not found - push notifications may not work')
            return
          }

          logger.debug('Getting Expo push token', { projectId, userId: user.id })
          const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
            projectId,
          })

          if (tokenData) {
            logger.debug('Expo push token received', { tokenLength: tokenData.length })
            // Save to Supabase
            const { error } = await supabase
              .from('user_push_tokens')
              .upsert(
                {
                  user_id: user.id,
                  push_token: tokenData,
                  platform: Platform.OS,
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: 'user_id,platform',
                }
              )

            if (error) {
              logger.error('Error saving push token to Supabase', error as Error, {
                userId: user.id,
                platform: Platform.OS,
              })
            } else {
              logger.info('Push token registered successfully', {
                userId: user.id,
                platform: Platform.OS,
              })
            }
          } else {
            logger.warn('No push token data received from Expo')
          }
        } catch (error) {
          logger.error('Error registering push token', error as Error, {
            userId: user.id,
          })
        }
      }

      registerPushToken()
    }
  }, [user?.id, permissionsGranted])

  // Start/stop periodic notifications based on config
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (config.enabled && permissionsGranted) {
      // Send initial notification check
      sendAttendanceNotification(config).catch(() => {
        // Silently handle notification errors
      })

      // Set up periodic interval
      const intervalMs = config.frequency * 60 * 1000
      intervalRef.current = setInterval(() => {
        sendAttendanceNotification(config).catch(() => {
          // Silently handle notification errors
        })
      }, intervalMs)
    } else {
      // Cancel all notifications if disabled
      if (!config.enabled) {
        cancelAllNotifications().catch(() => {
          // Silently handle cancellation errors
        })
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [config, permissionsGranted])

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_CONFIG_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConfig({ ...DEFAULT_CONFIG, ...parsed })
      }
    } catch (error) {
      // Error loading notification config - use defaults
    }
  }

  const saveConfig = async (newConfig: NotificationConfig) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_CONFIG_KEY, JSON.stringify(newConfig))
      setConfig(newConfig)
    } catch (error) {
      // Error saving notification config - silently fail
    }
  }

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync()
      setPermissionsGranted(status === 'granted')
    } catch (error) {
      // Error checking permissions - assume not granted
      setPermissionsGranted(false)
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions()
    setPermissionsGranted(granted)
    return granted
  }

  const updateConfig = async (updates: Partial<NotificationConfig>) => {
    const newConfig = { ...config, ...updates }
    await saveConfig(newConfig)
  }

  const toggleEnabled = async () => {
    await updateConfig({ enabled: !config.enabled })
  }

  const setFrequency = async (frequency: NotificationFrequency) => {
    await updateConfig({ frequency })
  }

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const now = Date.now()
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000

        // Convert timestamp strings back to Date objects and auto-delete entries older than 2 days
        const history = parsed
          .map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
          .filter((item: NotificationHistoryItem) => {
            const ts = item.timestamp instanceof Date ? item.timestamp.getTime() : new Date(item.timestamp).getTime()
            return now - ts <= twoDaysMs
          })

        setNotificationHistory(history)

        // Persist cleaned history without old entries
        await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history))
      }
    } catch (error) {
      // Error loading notification history - use empty array
    }
  }

  const saveHistory = async (history: NotificationHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history))
      setNotificationHistory(history)
    } catch (error) {
      // Error saving notification history - silently fail
    }
  }

  const addToHistory = async (notification: NotificationHistoryItem) => {
    try {
      const now = Date.now()
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000

      const currentHistory = [...notificationHistory, notification]
        // Auto-delete any items older than 2 days
        .filter((item) => {
          const ts = item.timestamp instanceof Date ? item.timestamp.getTime() : new Date(item.timestamp).getTime()
          return now - ts <= twoDaysMs
        })

      // Keep only last MAX_HISTORY_ITEMS, newest first
      const trimmedHistory = currentHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_HISTORY_ITEMS)
      await saveHistory(trimmedHistory)
    } catch (error) {
      // Error adding to notification history - silently fail
    }
  }

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY)
      setNotificationHistory([])
    } catch (error) {
      // Error clearing notification history - silently fail
    }
  }

  const deleteFromHistory = async (id: string) => {
    try {
      const filtered = notificationHistory.filter((item) => item.id !== id)
      await saveHistory(filtered)
    } catch (error) {
      // Error deleting from history - silently fail
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        config,
        updateConfig,
        isEnabled: config.enabled,
        toggleEnabled,
        setFrequency,
        permissionsGranted,
        requestPermissions,
        lastNotificationTime,
        notificationHistory,
        addToHistory,
        clearHistory,
        deleteFromHistory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}


