import { supabase } from './supabase'
import { getStudentByUserId } from './students'
import { logger } from './logger'

/**
 * Validate QR code format
 * Accepts: mess-management://attendance, mess://attendance (backward compatible), or URL containing /attendance/mobile
 */
export function validateQRCode(qrData: string): boolean {
  if (!qrData || typeof qrData !== 'string') return false
  
  const trimmed = qrData.trim()
  
  // Check for configured scheme (primary)
  if (trimmed === 'mess-management://attendance') return true
  
  // Check for old scheme (backward compatibility)
  if (trimmed === 'mess://attendance') return true
  
  // Check for URL format (backward compatible)
  if (qrData.includes('/attendance/mobile')) return true
  
  return false
}

/**
 * Get current meal based on time with grace periods (before and after)
 * Breakfast: 7:00 AM - 11:00 AM (grace: 30 min before 7:30, 30 min after 10:30)
 * Lunch: 12:00 PM - 4:00 PM (grace: 30 min before 12:30, 30 min after 3:30)
 * Dinner: 7:00 PM - 11:00 PM (grace: 30 min before 7:30, 30 min after 10:30)
 */
export function getCurrentMeal(): 'breakfast' | 'lunch' | 'dinner' | null {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes
  const gracePeriod = 30 // 30 minutes grace period

  // Breakfast: 7:00 (420 min) to 11:00 (660 min)
  // Normal: 7:30 (450 min) to 10:30 (630 min)
  // Grace before: 7:00 (420 min) to 7:30 (450 min)
  // Grace after: 10:30 (630 min) to 11:00 (660 min)
  if (totalMinutes >= 450 - gracePeriod && totalMinutes <= 630 + gracePeriod) {
    return 'breakfast'
  }

  // Lunch: 12:00 (720 min) to 4:00 PM (960 min)
  // Normal: 12:30 (750 min) to 3:30 PM (930 min)
  // Grace before: 12:00 (720 min) to 12:30 (750 min)
  // Grace after: 3:30 PM (930 min) to 4:00 PM (960 min)
  if (totalMinutes >= 750 - gracePeriod && totalMinutes <= 930 + gracePeriod) {
    return 'lunch'
  }

  // Dinner: 7:00 PM (1140 min) to 11:00 PM (1380 min)
  // Normal: 7:30 PM (1170 min) to 10:30 PM (1350 min)
  // Grace before: 7:00 PM (1140 min) to 7:30 PM (1170 min)
  // Grace after: 10:30 PM (1350 min) to 11:00 PM (1380 min)
  if (totalMinutes >= 1170 - gracePeriod && totalMinutes <= 1350 + gracePeriod) {
    return 'dinner'
  }

  return null
}

export interface MarkAttendanceResult {
  success: boolean
  message: string
  meal?: 'breakfast' | 'lunch' | 'dinner'
  alreadyMarked?: boolean
}

/**
 * Mark attendance from QR scan (Direct Supabase - NO WEB APP DEPENDENCY)
 */
export async function markAttendanceFromQR(
  userId: string
): Promise<MarkAttendanceResult> {
  try {
    // Get student data
    const studentResult = await getStudentByUserId(userId)
    if (studentResult.error || !studentResult.student) {
      return {
        success: false,
        message: 'Student profile not found. Please contact administrator.',
      }
    }

    const student = studentResult.student

    // Check meal time FIRST
    const currentMeal = getCurrentMeal()
    if (!currentMeal) {
      return {
        success: false,
        message: 'No active meal time at the moment.\n\nPlease scan during meal hours to mark your attendance.',
      }
    }

    // Check if student plan includes this meal
    const planMeals = student.plan.meals.toLowerCase()
    const mealLower = currentMeal.toLowerCase()
    if (!planMeals.includes(mealLower) && !planMeals.includes('all')) {
      return {
        success: false,
        message: `Your meal plan does not include ${currentMeal}.\n\nPlease contact administrator to update your plan.`,
      }
    }

    // Check if plan is active
    const today = new Date()
    const endDate = new Date(student.endDate)
    if (endDate < today) {
      return {
        success: false,
        message: 'Your meal plan has expired. Please renew to continue.',
      }
    }

    // Check if plan has started
    const joinDate = new Date(student.joinDate)
    if (joinDate > today) {
      return {
        success: false,
        message: 'Your meal plan has not started yet.',
      }
    }

    // Get today's date in YYYY-MM-DD format (using local date to avoid timezone issues)
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Check if attendance already exists for today
    const { data: existing, error: checkError } = await supabase
      .from('Attendance')
      .select('id, breakfast, lunch, dinner')
      .eq('studentId', student.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing attendance', checkError as Error)
      return {
        success: false,
        message: 'Unable to check attendance. Please try again.',
      }
    }

    // Check if meal already marked
    if (existing && existing[currentMeal]) {
      return {
        success: true,
        message: `✓ ${currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)} attendance already marked for today!`,
        meal: currentMeal,
        alreadyMarked: true,
      }
    }

    // Prepare attendance data
    const attendanceData: {
      studentId: number
      date: string
      breakfast: boolean
      lunch: boolean
      dinner: boolean
      scannedAt?: string
    } = {
      studentId: student.id,
      date: todayStr,
      breakfast: existing?.breakfast || false,
      lunch: existing?.lunch || false,
      dinner: existing?.dinner || false,
    }

    // Mark the current meal
    attendanceData[currentMeal] = true

    // Set scannedAt if this is a new record
    if (!existing) {
      attendanceData.scannedAt = new Date().toISOString()
    }

    // Insert or update attendance
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('Attendance')
        .update(attendanceData)
        .eq('id', existing.id)

      if (updateError) {
        logger.error('Error updating attendance', updateError as Error)
        return {
          success: false,
          message: 'Unable to mark attendance. Please try again.',
        }
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('Attendance')
        .insert(attendanceData)

      if (insertError) {
        logger.error('Error inserting attendance', insertError as Error)
        return {
          success: false,
          message: 'Unable to mark attendance. Please try again.',
        }
      }
    }

    // Success!
    return {
      success: true,
      message: `Attendance marked successfully!`,
      meal: currentMeal,
    }
  } catch (error) {
    logger.error('Error marking attendance', error as Error)
    return {
      success: false,
      message: error instanceof Error 
        ? error.message 
        : 'Unable to mark attendance. Please try again.',
    }
  }
}


