import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { getAttendanceInWindow, getTodayStats } from './attendance-tracking'
import { format } from 'date-fns'
import { logger } from './logger'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export type NotificationFrequency = 5 | 10 | 15 | 30 | 60 // minutes

export interface NotificationConfig {
  enabled: boolean
  frequency: NotificationFrequency
  activeHours: {
    breakfast: { start: number; end: number } // 7-10
    lunch: { start: number; end: number } // 12-15
    dinner: { start: number; end: number } // 19-22
  }
  showStudentNames: boolean
  showWhenNoActivity: boolean
}

export const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  frequency: 10,
  activeHours: {
    breakfast: { start: 7, end: 10 },
    lunch: { start: 12, end: 15 },
    dinner: { start: 19, end: 22 },
  },
  showStudentNames: true,
  showWhenNoActivity: false,
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      logger.warn('Notification permissions not granted')
      return false
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('attendance-updates', {
        name: 'Attendance Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7B2CBF',
      })
    }

    return true
  } catch (error) {
    logger.error('Error requesting notification permissions', error as Error)
    return false
  }
}

/**
 * Check if notification should be sent based on active hours
 */
export function shouldSendNotification(
  currentHour: number,
  config: NotificationConfig
): boolean {
  const { activeHours } = config

  return (
    (currentHour >= activeHours.breakfast.start && currentHour < activeHours.breakfast.end) ||
    (currentHour >= activeHours.lunch.start && currentHour < activeHours.lunch.end) ||
    (currentHour >= activeHours.dinner.start && currentHour < activeHours.dinner.end)
  )
}

/**
 * Format notification message
 */
function formatNotificationMessage(
  timeWindow: { start: string; end: string },
  meals: Array<{ meal: 'breakfast' | 'lunch' | 'dinner'; count: number; students: Array<{ name: string; rollNumber: string | null }> }>,
  todayStats: { total: number; present: number; percentage: number },
  config: NotificationConfig
): { title: string; body: string } {
  const mealEmojis = {
    breakfast: '🌅',
    lunch: '🍽️',
    dinner: '🌙',
  }

  const mealNames = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
  }

  if (meals.length === 0) {
    if (config.showWhenNoActivity) {
      return {
        title: '📊 Attendance Update',
        body: `No new attendance in last ${config.frequency} minutes.\n\n📈 Today: ${todayStats.present}/${todayStats.total} (${todayStats.percentage}%)`,
      }
    }
    // Return empty if we don't show when no activity
    return { title: '', body: '' }
  }

  let body = ''
  
  meals.forEach((mealData) => {
    const emoji = mealEmojis[mealData.meal]
    const name = mealNames[mealData.meal]
    
    body += `${emoji} ${name}: ${mealData.count} student${mealData.count !== 1 ? 's' : ''} marked\n`
    
    if (config.showStudentNames && mealData.students.length > 0) {
      const names = mealData.students
        .slice(0, 5) // Show max 5 names
        .map((s) => s.name)
        .join(', ')
      body += `   ${names}`
      if (mealData.students.length > 5) {
        body += ` +${mealData.students.length - 5} more`
      }
      body += '\n\n'
    } else {
      body += '\n'
    }
  })

  body += `📈 Today: ${todayStats.present}/${todayStats.total} (${todayStats.percentage}%)`

  return {
    title: `📊 Attendance Update (${timeWindow.start} - ${timeWindow.end})`,
    body: body.trim(),
  }
}

/**
 * Send attendance notification
 */
export async function sendAttendanceNotification(
  config: NotificationConfig
): Promise<void> {
  try {
    if (!config.enabled) {
      return
    }

    const now = new Date()
    const currentHour = now.getHours()

    // Check if within active hours
    if (!shouldSendNotification(currentHour, config)) {
      return
    }

    // Calculate time window
    const endTime = now
    const startTime = new Date(now.getTime() - config.frequency * 60 * 1000)

    // Get attendance data
    const attendanceWindow = await getAttendanceInWindow(startTime, endTime)
    const todayStats = await getTodayStats()

    // Format time window
    const timeWindow = {
      start: format(startTime, 'h:mm a'),
      end: format(endTime, 'h:mm a'),
    }

    // Format notification message
    const { title, body } = formatNotificationMessage(
      timeWindow,
      attendanceWindow.meals,
      todayStats,
      config
    )

    // Don't send if no activity and showWhenNoActivity is false
    if (!title && !body) {
      return
    }

    // Send notification
    const notificationId = `notification_${now.getTime()}`
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'attendance_update',
          date: format(now, 'yyyy-MM-dd'),
          timeWindow,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
      identifier: notificationId,
    })

    logger.info('Notification sent', { title })
  } catch (error) {
    logger.error('Error sending notification', error as Error)
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (error) {
    logger.error('Error canceling notifications', error as Error)
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync()
  } catch (error) {
    logger.error('Error getting badge count', error as Error)
    return 0
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count)
  } catch (error) {
    logger.error('Error setting badge count', error as Error)
  }
}

/**
 * Clear notification badge
 */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0)
  } catch (error) {
    logger.error('Error clearing badge', error as Error)
  }
}

