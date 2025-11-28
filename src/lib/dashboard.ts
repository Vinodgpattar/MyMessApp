import { supabase } from './supabase'
import { getCurrentMeal, getAttendanceStats } from './attendance'
import { format } from 'date-fns'
import { logger } from './logger'

export interface CurrentMealStatus {
  meal: 'breakfast' | 'lunch' | 'dinner' | null
  mealName: string
  timeWindow: string
  present: number
  total: number
  percentage: number
}

export interface TodaySummary {
  totalStudents: number
  presentToday: number
  paidToday: number
}

export interface QuickStats {
  activeStudents: number
  totalPlans: number
}

export interface Alert {
  type: 'expiring' | 'low_balance'
  count: number
  students?: Array<{ id: number; name: string; daysRemaining?: number; balance?: number }>
}

export interface AttendanceTrend {
  todayPercentage: number
  yesterdayPercentage: number
  difference: number
}

export interface ActivityItem {
  id: string
  type: 'attendance' | 'payment' | 'student'
  message: string
  timestamp: Date
}

export interface TodaySummaryWithTrend extends TodaySummary {
  trends: {
    totalStudents: number
    presentToday: number
    paidToday: number
  }
}

export interface DashboardData {
  currentMeal: CurrentMealStatus
  todaySummary: TodaySummaryWithTrend
  quickStats: QuickStats
  alerts: Alert[]
  attendanceTrend: AttendanceTrend
  activities: ActivityItem[]
}

/**
 * Get current meal status with attendance
 */
export async function getCurrentMealStatus(): Promise<CurrentMealStatus> {
  try {
    const currentMeal = getCurrentMeal()
    const today = format(new Date(), 'yyyy-MM-dd')

    if (!currentMeal) {
      return {
        meal: null,
        mealName: 'No active meal',
        timeWindow: '',
        present: 0,
        total: 0,
        percentage: 0,
      }
    }

    // Get attendance stats for today
    const stats = await getAttendanceStats(today)

    const mealNames = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
    }

    const timeWindows = {
      breakfast: '7:00 AM - 10:00 AM',
      lunch: '12:00 PM - 3:00 PM',
      dinner: '7:00 PM - 10:00 PM',
    }

    const mealStats = stats[currentMeal]
    const present = mealStats.present
    const total = mealStats.total
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      meal: currentMeal,
      mealName: mealNames[currentMeal],
      timeWindow: timeWindows[currentMeal],
      present,
      total,
      percentage,
    }
  } catch (error) {
    logger.error('Error getting current meal status', error as Error)
    return {
      meal: null,
      mealName: 'Error loading',
      timeWindow: '',
      present: 0,
      total: 0,
      percentage: 0,
    }
  }
}

/**
 * Get today's summary
 */
export async function getTodaySummary(): Promise<TodaySummary> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')

    // Get total active students
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select('id')
      .eq('isActive', true)
      .lte('joinDate', today)
      .gte('endDate', today)

    if (studentsError) throw studentsError

    const totalStudents = students?.length || 0

    // Get attendance for today
    const { data: attendance, error: attendanceError } = await supabase
      .from('Attendance')
      .select('studentId')
      .eq('date', today)

    if (attendanceError) throw attendanceError

    // Count unique students with attendance
    const studentsWithAttendance = new Set(
      attendance?.map((a) => a.studentId) || []
    )
    const presentToday = studentsWithAttendance.size

    // Get payments for today
    const { data: payments, error: paymentsError } = await supabase
      .from('Payment')
      .select('amount')
      .eq('paymentDate', today)

    if (paymentsError) throw paymentsError

    const paidToday = payments?.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    ) || 0

    return {
      totalStudents,
      presentToday,
      paidToday,
    }
  } catch (error) {
    logger.error('Error getting today summary', error as Error)
    return {
      totalStudents: 0,
      presentToday: 0,
      paidToday: 0,
    }
  }
}

/**
 * Get quick stats
 */
export async function getQuickStats(): Promise<QuickStats> {
  try {
    // Get active students count
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select('id')
      .eq('isActive', true)
      .lte('joinDate', today)
      .gte('endDate', today)

    if (studentsError) throw studentsError

    const activeStudents = students?.length || 0

    // Get total plans count
    const { data: plans, error: plansError } = await supabase
      .from('Plan')
      .select('id')

    if (plansError) throw plansError

    const totalPlans = plans?.length || 0

    return {
      activeStudents,
      totalPlans,
    }
  } catch (error) {
    logger.error('Error getting quick stats', error as Error)
    return {
      activeStudents: 0,
      totalPlans: 0,
    }
  }
}

/**
 * Get alerts (students needing attention)
 */
export async function getAlerts(): Promise<Alert[]> {
  try {
    const today = new Date()
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    const todayStr = format(today, 'yyyy-MM-dd')
    const sevenDaysStr = format(sevenDaysLater, 'yyyy-MM-dd')

    // Get students expiring soon (within 7 days)
    const { data: expiringStudents, error: expiringError } = await supabase
      .from('Student')
      .select('id, name, endDate')
      .eq('isActive', true)
      .gte('endDate', todayStr)
      .lte('endDate', sevenDaysStr)

    if (expiringError) throw expiringError

    // Get students with low balance (< ₹500)
    const { data: lowBalanceStudents, error: balanceError } = await supabase
      .from('Student')
      .select('id, name, balance')
      .eq('isActive', true)
      .lt('balance', 500)
      .gt('balance', 0)

    if (balanceError) throw balanceError

    const alerts: Alert[] = []

    if (expiringStudents && expiringStudents.length > 0) {
      const studentsWithDays = expiringStudents.map((student) => {
        const endDate = new Date(student.endDate)
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          id: student.id,
          name: student.name,
          daysRemaining,
        }
      })

      alerts.push({
        type: 'expiring',
        count: expiringStudents.length,
        students: studentsWithDays,
      })
    }

    if (lowBalanceStudents && lowBalanceStudents.length > 0) {
      alerts.push({
        type: 'low_balance',
        count: lowBalanceStudents.length,
        students: lowBalanceStudents.map((student) => ({
          id: student.id,
          name: student.name,
          balance: Number(student.balance),
        })),
      })
    }

    return alerts
  } catch (error) {
    logger.error('Error getting alerts', error as Error)
    return []
  }
}

/**
 * Get yesterday's attendance percentage
 */
async function getYesterdayAttendancePercentage(): Promise<number> {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

    const stats = await getAttendanceStats(yesterdayStr)
    const total = stats.breakfast.total + stats.lunch.total + stats.dinner.total
    const present = stats.breakfast.present + stats.lunch.present + stats.dinner.present

    return total > 0 ? Math.round((present / total) * 100) : 0
  } catch (error) {
    logger.error('Error getting yesterday attendance', error as Error)
    return 0
  }
}

/**
 * Get attendance trend
 */
export async function getAttendanceTrend(): Promise<AttendanceTrend> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayStats = await getAttendanceStats(today)
    const yesterdayPercentage = await getYesterdayAttendancePercentage()

    const total = todayStats.breakfast.total + todayStats.lunch.total + todayStats.dinner.total
    const present = todayStats.breakfast.present + todayStats.lunch.present + todayStats.dinner.present
    const todayPercentage = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      todayPercentage,
      yesterdayPercentage,
      difference: todayPercentage - yesterdayPercentage,
    }
  } catch (error) {
    logger.error('Error getting attendance trend', error as Error)
    return {
      todayPercentage: 0,
      yesterdayPercentage: 0,
      difference: 0,
    }
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(): Promise<ActivityItem[]> {
  try {
    const activities: ActivityItem[] = []
    const today = format(new Date(), 'yyyy-MM-dd')

    // Get recent attendance (last 5)
    const { data: recentAttendance, error: attendanceError } = await supabase
      .from('Attendance')
      .select('id, studentId, updatedAt, student:Student(name)')
      .eq('date', today)
      .order('updatedAt', { ascending: false })
      .limit(3)

    if (!attendanceError && recentAttendance) {
      recentAttendance.forEach((record) => {
        const student = record.student as any
        activities.push({
          id: `attendance-${record.id}`,
          type: 'attendance',
          message: `${student?.name || 'Student'} marked attendance`,
          timestamp: new Date(record.updatedAt),
        })
      })
    }

    // Get recent payments (last 3)
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('Payment')
      .select('id, amount, createdAt, student:Student(name)')
      .eq('paymentDate', today)
      .order('createdAt', { ascending: false })
      .limit(2)

    if (!paymentsError && recentPayments) {
      recentPayments.forEach((payment) => {
        const student = payment.student as any
        activities.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          message: `Payment received ₹${Number(payment.amount)} from ${student?.name || 'Student'}`,
          timestamp: new Date(payment.createdAt),
        })
      })
    }

    // Get recent students (last 2, today)
    const { data: recentStudents, error: studentsError } = await supabase
      .from('Student')
      .select('id, name, createdAt')
      .gte('createdAt', `${today}T00:00:00`)
      .order('createdAt', { ascending: false })
      .limit(2)

    if (!studentsError && recentStudents) {
      recentStudents.forEach((student) => {
        activities.push({
          id: `student-${student.id}`,
          type: 'student',
          message: `New student added: ${student.name}`,
          timestamp: new Date(student.createdAt),
        })
      })
    }

    // Sort by timestamp (newest first) and limit to 5
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
  } catch (error) {
    logger.error('Error getting recent activities', error as Error)
    return []
  }
}

/**
 * Get today's summary with trends
 */
export async function getTodaySummaryWithTrend(): Promise<TodaySummaryWithTrend> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

    // Get today's data
    const todayData = await getTodaySummary()

    // Get yesterday's data for comparison
    const { data: yesterdayStudents } = await supabase
      .from('Student')
      .select('id')
      .eq('isActive', true)
      .lte('joinDate', yesterdayStr)
      .gte('endDate', yesterdayStr)

    const { data: yesterdayAttendance } = await supabase
      .from('Attendance')
      .select('studentId')
      .eq('date', yesterdayStr)

    const { data: yesterdayPayments } = await supabase
      .from('Payment')
      .select('amount')
      .eq('paymentDate', yesterdayStr)

    const yesterdayTotalStudents = yesterdayStudents?.length || 0
    const yesterdayPresent = new Set(yesterdayAttendance?.map((a) => a.studentId) || []).size
    const yesterdayPaid = yesterdayPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0

    return {
      ...todayData,
      trends: {
        totalStudents: todayData.totalStudents - yesterdayTotalStudents,
        presentToday: todayData.presentToday - yesterdayPresent,
        paidToday: todayData.paidToday - yesterdayPaid,
      },
    }
  } catch (error) {
    logger.error('Error getting today summary with trend', error as Error)
    const baseSummary = await getTodaySummary()
    return {
      ...baseSummary,
      trends: {
        totalStudents: 0,
        presentToday: 0,
        paidToday: 0,
      },
    }
  }
}

/**
 * Get all dashboard data
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [currentMeal, todaySummary, quickStats, alerts, attendanceTrend, activities] = await Promise.all([
      getCurrentMealStatus(),
      getTodaySummaryWithTrend(),
      getQuickStats(),
      getAlerts(),
      getAttendanceTrend(),
      getRecentActivities(),
    ])

    return {
      currentMeal,
      todaySummary,
      quickStats,
      alerts,
      attendanceTrend,
      activities,
    }
  } catch (error) {
    logger.error('Error getting dashboard data', error as Error)
    throw error
  }
}

