import { supabase } from './supabase'
import { logger } from './logger'

export interface StudentAttendance {
  id: number
  studentId: number
  name: string
  rollNumber: string | null
  email: string
  plan: {
    name: string
    meals: string[] // Array of meal types
  }
  attendance: {
    breakfast: boolean
    lunch: boolean
    dinner: boolean
    lastUpdated: string | null
    scannedAt: string | null
  }
}

export interface AttendanceStats {
  breakfast: { present: number; total: number }
  lunch: { present: number; total: number }
  dinner: { present: number; total: number }
  attendancePercentage: number
}

export interface AttendanceView {
  date: string
  currentMeal: 'breakfast' | 'lunch' | 'dinner' | null
  stats: AttendanceStats
  students: {
    present: StudentAttendance[]
    missing: StudentAttendance[]
  }
}

export interface MarkAttendanceData {
  studentId: number
  date: string
  breakfast?: boolean
  lunch?: boolean
  dinner?: boolean
}

/**
 * Get current meal time based on current time
 */
export function getCurrentMeal(): 'breakfast' | 'lunch' | 'dinner' | null {
  const now = new Date()
  const hour = now.getHours()
  
  if (hour >= 7 && hour < 10) return 'breakfast'
  if (hour >= 12 && hour < 15) return 'lunch'
  if (hour >= 19 && hour < 22) return 'dinner'
  return null
}

/**
 * Get attendance statistics for a specific date
 */
export async function getAttendanceStats(date: string): Promise<AttendanceStats> {
  try {
    // Get all active students (active on the selected date)
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select('id, planId, plan:Plan(meals)')
      .eq('isActive', true)
      .lte('joinDate', date)
      .gte('endDate', date)

    if (studentsError) throw studentsError

    const totalStudents = students?.length || 0

    // Get attendance records for the date
    // Date is stored as Date type in database (YYYY-MM-DD format)
    const { data: attendance, error: attendanceError } = await supabase
      .from('Attendance')
      .select('studentId, breakfast, lunch, dinner')
      .eq('date', date)

    if (attendanceError) throw attendanceError

    // Calculate stats
    let breakfastCount = 0
    let lunchCount = 0
    let dinnerCount = 0
    let studentsWithAttendance = 0

    const attendanceMap = new Map<number, { breakfast: boolean; lunch: boolean; dinner: boolean }>()
    
    attendance?.forEach((record) => {
      attendanceMap.set(record.studentId, {
        breakfast: record.breakfast,
        lunch: record.lunch,
        dinner: record.dinner,
      })
      if (record.breakfast) breakfastCount++
      if (record.lunch) lunchCount++
      if (record.dinner) dinnerCount++
      if (record.breakfast || record.lunch || record.dinner) {
        studentsWithAttendance++
      }
    })

    // Count students eligible for each meal based on their plan
    let breakfastEligible = 0
    let lunchEligible = 0
    let dinnerEligible = 0

    students?.forEach((student) => {
      const planMeals = (student.plan as any)?.meals || ''
      if (planMeals.includes('Breakfast')) breakfastEligible++
      if (planMeals.includes('Lunch')) lunchEligible++
      if (planMeals.includes('Dinner')) dinnerEligible++
    })

    const attendancePercentage = totalStudents > 0 
      ? Math.round((studentsWithAttendance / totalStudents) * 100)
      : 0

    return {
      breakfast: {
        present: breakfastCount,
        total: breakfastEligible || totalStudents, // Fallback to total if no plan data
      },
      lunch: {
        present: lunchCount,
        total: lunchEligible || totalStudents,
      },
      dinner: {
        present: dinnerCount,
        total: dinnerEligible || totalStudents,
      },
      attendancePercentage,
    }
  } catch (error) {
    logger.error('Error fetching attendance stats', error as Error)
    throw error instanceof Error ? error : new Error('Failed to fetch attendance stats')
  }
}

/**
 * Get attendance view for a specific date and meal
 */
export async function getAttendanceView(
  date: string,
  meal?: 'breakfast' | 'lunch' | 'dinner'
): Promise<AttendanceView> {
  try {
    const currentMeal = meal || getCurrentMeal()
    const stats = await getAttendanceStats(date)

    // Get all active students with their plans
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select(`
        id,
        name,
        rollNumber,
        email,
        planId,
        plan:Plan(
          name,
          meals
        )
      `)
      .eq('isActive', true)
      .lte('joinDate', date)
      .gte('endDate', date)
      .order('name', { ascending: true })

    if (studentsError) throw studentsError

    // Get attendance records for the date
    // Date is stored as Date type in database (YYYY-MM-DD format)
    const { data: attendance, error: attendanceError } = await supabase
      .from('Attendance')
      .select('id, studentId, breakfast, lunch, dinner, scannedAt, updatedAt')
      .eq('date', date)

    if (attendanceError) throw attendanceError

    // Create attendance map
    const attendanceMap = new Map<number, {
      id: number
      breakfast: boolean
      lunch: boolean
      dinner: boolean
      scannedAt: string | null
      updatedAt: string
    }>()

    attendance?.forEach((record) => {
      attendanceMap.set(record.studentId, {
        id: record.id,
        breakfast: record.breakfast,
        lunch: record.lunch,
        dinner: record.dinner,
        scannedAt: record.scannedAt,
        updatedAt: record.updatedAt,
      })
    })

    // Build student attendance list
    const present: StudentAttendance[] = []
    const missing: StudentAttendance[] = []

    students?.forEach((student) => {
      const planMeals = (student.plan as any)?.meals || ''
      const mealArray = planMeals.split(',').map((m: string) => m.trim()).filter(Boolean)
      
      const attendanceRecord = attendanceMap.get(student.id)
      
      const studentAttendance: StudentAttendance = {
        id: attendanceRecord?.id || 0,
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        plan: {
          name: (student.plan as any)?.name || '',
          meals: mealArray,
        },
        attendance: {
          breakfast: attendanceRecord?.breakfast || false,
          lunch: attendanceRecord?.lunch || false,
          dinner: attendanceRecord?.dinner || false,
          lastUpdated: attendanceRecord?.updatedAt || null,
          scannedAt: attendanceRecord?.scannedAt || null,
        },
      }

      // Determine if student is present or missing for the current meal
      if (currentMeal) {
        const hasMeal = studentAttendance.attendance[currentMeal]
        const isEligible = mealArray.some((m: string) => 
          m.toLowerCase().includes(currentMeal)
        )
        
        if (hasMeal && isEligible) {
          present.push(studentAttendance)
        } else if (isEligible) {
          missing.push(studentAttendance)
        }
      } else {
        // If no current meal, show all students
        const hasAnyAttendance = attendanceRecord && (
          attendanceRecord.breakfast || 
          attendanceRecord.lunch || 
          attendanceRecord.dinner
        )
        if (hasAnyAttendance) {
          present.push(studentAttendance)
        } else {
          missing.push(studentAttendance)
        }
      }
    })

    return {
      date,
      currentMeal,
      stats,
      students: {
        present,
        missing,
      },
    }
  } catch (error) {
    logger.error('Error fetching attendance view', error as Error)
    throw error instanceof Error ? error : new Error('Failed to fetch attendance view')
  }
}

/**
 * Mark attendance for a student
 */
export async function markAttendance(
  data: MarkAttendanceData
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    // First, get the student's plan to validate meal eligibility
    const { data: studentData, error: studentError } = await supabase
      .from('Student')
      .select('id, planId, plan:Plan(meals)')
      .eq('id', data.studentId)
      .single()

    if (studentError) throw studentError
    if (!studentData) {
      return { success: false, error: new Error('Student not found') }
    }

    const planMeals = (studentData.plan as any)?.meals || ''
    const mealArray = planMeals.split(',').map((m: string) => m.trim().toLowerCase())

    // Validate meal eligibility - only check if we're trying to mark a meal as true
    if (data.breakfast !== undefined && data.breakfast && !mealArray.some(m => m.includes('breakfast'))) {
      return { success: false, error: new Error('Student plan does not include Breakfast') }
    }
    if (data.lunch !== undefined && data.lunch && !mealArray.some(m => m.includes('lunch'))) {
      return { success: false, error: new Error('Student plan does not include Lunch') }
    }
    if (data.dinner !== undefined && data.dinner && !mealArray.some(m => m.includes('dinner'))) {
      return { success: false, error: new Error('Student plan does not include Dinner') }
    }

    // Check if attendance record already exists
    const { data: existing, error: checkError } = await supabase
      .from('Attendance')
      .select('id, breakfast, lunch, dinner')
      .eq('studentId', data.studentId)
      .eq('date', data.date)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new records
      throw checkError
    }

    const attendanceData: {
      studentId: number
      date: string
      breakfast: boolean
      lunch: boolean
      dinner: boolean
      scannedAt?: string
    } = {
      studentId: data.studentId,
      date: data.date,
      breakfast: data.breakfast ?? (existing?.breakfast || false),
      lunch: data.lunch ?? (existing?.lunch || false),
      dinner: data.dinner ?? (existing?.dinner || false),
    }

    // If marking a specific meal, update only that meal
    if (data.breakfast !== undefined) attendanceData.breakfast = data.breakfast
    if (data.lunch !== undefined) attendanceData.lunch = data.lunch
    if (data.dinner !== undefined) attendanceData.dinner = data.dinner

    // Note: scannedAt is only set by QR scanner, not for manual/admin marking
    // For manual marking, scannedAt remains null

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('Attendance')
        .update(attendanceData)
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('Attendance')
        .insert(attendanceData)

      if (insertError) throw insertError
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Error marking attendance', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to mark attendance'),
    }
  }
}

/**
 * Mark attendance for multiple students (bulk)
 */
export async function markBulkAttendance(
  studentIds: number[],
  date: string,
  meal: 'breakfast' | 'lunch' | 'dinner'
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    // Process each student
    const promises = studentIds.map((studentId) =>
      markAttendance({
        studentId,
        date,
        [meal]: true,
      })
    )

    const results = await Promise.all(promises)
    const errors = results.filter((r) => !r.success)

    if (errors.length > 0) {
      return {
        success: false,
        error: new Error(`Failed to mark attendance for ${errors.length} students`),
      }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Error in bulk attendance marking', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to mark bulk attendance'),
    }
  }
}

/**
 * Update attendance record
 */
export async function updateAttendance(
  id: number,
  data: {
    breakfast?: boolean
    lunch?: boolean
    dinner?: boolean
  }
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: new Error('Invalid attendance ID'),
      }
    }

    // Get the attendance record to find student
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('Attendance')
      .select('studentId, student:Student(planId, plan:Plan(meals))')
      .eq('id', id)
      .single()

    if (attendanceError) throw attendanceError
    if (!attendanceRecord) {
      return { success: false, error: new Error('Attendance record not found') }
    }

    // Get plan meals
    const student = attendanceRecord.student as any
    const planMeals = student?.plan?.meals || ''
    const mealArray = planMeals.split(',').map((m: string) => m.trim().toLowerCase())

    // Validate meal eligibility before updating - only check if we're trying to mark a meal as true
    if (data.breakfast !== undefined && data.breakfast && !mealArray.some(m => m.includes('breakfast'))) {
      return { success: false, error: new Error('Student plan does not include Breakfast') }
    }
    if (data.lunch !== undefined && data.lunch && !mealArray.some(m => m.includes('lunch'))) {
      return { success: false, error: new Error('Student plan does not include Lunch') }
    }
    if (data.dinner !== undefined && data.dinner && !mealArray.some(m => m.includes('dinner'))) {
      return { success: false, error: new Error('Student plan does not include Dinner') }
    }

    const updateData: any = {}
    if (data.breakfast !== undefined) updateData.breakfast = data.breakfast
    if (data.lunch !== undefined) updateData.lunch = data.lunch
    if (data.dinner !== undefined) updateData.dinner = data.dinner

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: new Error('No fields to update'),
      }
    }

    const { error, data: updatedData } = await supabase
      .from('Attendance')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      logger.error('Supabase update error', error as Error)
      throw error
    }

    if (!updatedData || updatedData.length === 0) {
      return {
        success: false,
        error: new Error('Attendance record not found'),
      }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Error updating attendance', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to update attendance'),
    }
  }
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(
  id: number
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: new Error('Invalid attendance ID'),
      }
    }

    // Delete the record directly (Supabase will return empty array if not found)
    const { error, data } = await supabase
      .from('Attendance')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      logger.error('Supabase delete error', error as Error)
      // Handle specific error codes
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: new Error('Attendance record not found'),
        }
      }
      throw error
    }

    // Verify deletion - Supabase returns deleted records in data array
    if (!data || data.length === 0) {
      return {
        success: false,
        error: new Error('Attendance record not found or already deleted'),
      }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Error deleting attendance', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete attendance'),
    }
  }
}

