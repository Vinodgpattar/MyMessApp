import { supabase } from './supabase'
import { format } from 'date-fns'
import { logger } from './logger'

export interface AttendanceWindow {
  startTime: Date
  endTime: Date
  meals: Array<{
    meal: 'breakfast' | 'lunch' | 'dinner'
    count: number
    students: Array<{ name: string; rollNumber: string | null }>
  }>
}

export interface TodayStats {
  total: number
  present: number
  percentage: number
}

/**
 * Get attendance records updated within a time window
 */
export async function getAttendanceInWindow(
  startTime: Date,
  endTime: Date
): Promise<AttendanceWindow> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const startISO = startTime.toISOString()
    const endISO = endTime.toISOString()

    // Get attendance records updated in the time window
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('Attendance')
      .select(`
        id,
        studentId,
        breakfast,
        lunch,
        dinner,
        updatedAt,
        student:Student(
          id,
          name,
          rollNumber,
          planId,
          plan:Plan(meals)
        )
      `)
      .eq('date', today)
      .gte('updatedAt', startISO)
      .lte('updatedAt', endISO)

    if (attendanceError) throw attendanceError

    // Group by meal type
    const breakfastStudents: Array<{ name: string; rollNumber: string | null }> = []
    const lunchStudents: Array<{ name: string; rollNumber: string | null }> = []
    const dinnerStudents: Array<{ name: string; rollNumber: string | null }> = []

    attendanceRecords?.forEach((record) => {
      const student = record.student as any
      if (!student) return

      const planMeals = (student.plan as any)?.meals || ''
      const mealArray = planMeals.split(',').map((m: string) => m.trim().toLowerCase())

      // Only include if the meal is part of the student's plan
      if (record.breakfast && mealArray.some((m: string) => m.includes('breakfast'))) {
        breakfastStudents.push({
          name: student.name,
          rollNumber: student.rollNumber,
        })
      }
      if (record.lunch && mealArray.some((m: string) => m.includes('lunch'))) {
        lunchStudents.push({
          name: student.name,
          rollNumber: student.rollNumber,
        })
      }
      if (record.dinner && mealArray.some((m: string) => m.includes('dinner'))) {
        dinnerStudents.push({
          name: student.name,
          rollNumber: student.rollNumber,
        })
      }
    })

    const meals: AttendanceWindow['meals'] = []

    if (breakfastStudents.length > 0) {
      meals.push({
        meal: 'breakfast',
        count: breakfastStudents.length,
        students: breakfastStudents,
      })
    }

    if (lunchStudents.length > 0) {
      meals.push({
        meal: 'lunch',
        count: lunchStudents.length,
        students: lunchStudents,
      })
    }

    if (dinnerStudents.length > 0) {
      meals.push({
        meal: 'dinner',
        count: dinnerStudents.length,
        students: dinnerStudents,
      })
    }

    return {
      startTime,
      endTime,
      meals,
    }
  } catch (error) {
    logger.error('Error fetching attendance in window', error as Error)
    throw error instanceof Error ? error : new Error('Failed to fetch attendance in window')
  }
}

/**
 * Get today's overall attendance statistics
 */
export async function getTodayStats(): Promise<TodayStats> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')

    // Get all active students
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select('id')
      .eq('isActive', true)
      .lte('joinDate', today)
      .gte('endDate', today)

    if (studentsError) throw studentsError

    const total = students?.length || 0

    // Get attendance records for today
    const { data: attendance, error: attendanceError } = await supabase
      .from('Attendance')
      .select('studentId, breakfast, lunch, dinner')
      .eq('date', today)

    if (attendanceError) throw attendanceError

    // Count students with at least one meal marked
    const studentsWithAttendance = new Set<number>()
    attendance?.forEach((record) => {
      if (record.breakfast || record.lunch || record.dinner) {
        studentsWithAttendance.add(record.studentId)
      }
    })

    const present = studentsWithAttendance.size
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      total,
      present,
      percentage,
    }
  } catch (error) {
    logger.error('Error fetching today stats', error as Error)
    throw error instanceof Error ? error : new Error('Failed to fetch today stats')
  }
}


