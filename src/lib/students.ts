import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { logger } from './logger'

export interface Student {
  id: number
  name: string
  rollNumber: string | null
  email: string
  contactNumber: string | null
  planId: number
  user_id?: string | null // References auth.users.id - stable link for role detection
  plan: {
    id: number
    name: string
    meals: string
    price: number
    durationDays: number
  }
  joinDate: string
  endDate: string
  price: number
  paid: number
  balance: number
  credit: number
  pin: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  password?: string // Temporary password for credentials display
}

export interface CreateStudentData {
  name: string
  email: string
  contactNumber: string // Required, not optional
  planId: number
  joinDate: string
  endDate?: string
  paid?: number
}

export interface UpdateStudentData {
  name?: string
  email?: string
  contactNumber?: string
  joinDate?: string
  endDate?: string
  paid?: number
  pin?: string
}

export interface ExtendPlanData {
  days: number
  paid?: number
  extendFromToday?: boolean
}

export interface RenewPlanData {
  planId: number
  paid?: number
  extendFromCurrent?: boolean
}

export interface StudentStats {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
}

/**
 * Get all students with filters and pagination
 */
export async function getStudents(params: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  planId?: number
}): Promise<{ students: Student[]; pagination: { total: number; page: number; limit: number; totalPages: number }; error: null } | { students: null; pagination: null; error: Error }> {
  try {
    const { page = 1, limit = 20, search, active, planId } = params
    const offset = (page - 1) * limit

    let query = supabase
      .from('Student')
      .select('id, name, rollNumber, email, contactNumber, planId, joinDate, endDate, price, paid, balance, credit, pin, isActive, createdAt, updatedAt, plan:Plan(id, name, meals, price, durationDays)', { count: 'exact' })

    // Apply filters
    if (search && search.trim().length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,rollNumber.ilike.%${search}%,contactNumber.ilike.%${search}%`)
    }

    if (active !== undefined) {
      query = query.eq('isActive', active)
    }

    if (planId) {
      query = query.eq('planId', planId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('createdAt', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching students', error as Error)
      return { students: null, pagination: null, error: new Error(error.message) }
    }

    // Transform data to match Student interface
    const students = (data || []).map((student: any) => ({
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      contactNumber: student.contactNumber,
      planId: student.planId,
      plan: student.plan ? {
        id: student.plan.id,
        name: student.plan.name,
        meals: student.plan.meals,
        price: typeof student.plan.price === 'string' ? parseFloat(student.plan.price) : student.plan.price,
        durationDays: student.plan.durationDays,
      } : null,
      joinDate: student.joinDate,
      endDate: student.endDate,
      price: typeof student.price === 'string' ? parseFloat(student.price) : student.price,
      paid: typeof student.paid === 'string' ? parseFloat(student.paid) : student.paid,
      balance: typeof student.balance === 'string' ? parseFloat(student.balance) : student.balance,
      credit: typeof student.credit === 'string' ? parseFloat(student.credit) : student.credit,
      pin: student.pin,
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    })).filter((s: Student) => s.plan !== null) as Student[]

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching students', error as Error)
    return {
      students: null,
      pagination: null,
      error: error instanceof Error ? error : new Error('Failed to fetch students'),
    }
  }
}

/**
 * Get student statistics
 */
export async function getStudentStats(): Promise<{ stats: StudentStats; error: null } | { stats: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('Student')
      .select('isActive, endDate', { count: 'exact' })

    if (error) {
      logger.error('Error fetching student stats', error as Error)
      return { stats: null, error: new Error(error.message) }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalStudents = data?.length || 0
    
    // Active students: isActive=true AND endDate >= today
    const activeStudents = data?.filter((s: any) => {
      const isActive = s.isActive === true
      const endDate = new Date(s.endDate)
      endDate.setHours(0, 0, 0, 0)
      return isActive && endDate >= today
    }).length || 0
    
    // Inactive students: isActive=false OR endDate < today
    const inactiveStudents = totalStudents - activeStudents

    return {
      stats: {
        totalStudents,
        activeStudents,
        inactiveStudents,
      },
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching student stats', error as Error)
    return {
      stats: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student stats'),
    }
  }
}

/**
 * Get a single student by email
 */
export async function getStudentByEmail(email: string): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    logger.debug('getStudentByEmail: Searching for email', { email: normalizedEmail })
    
    // Use eq for exact match (emails are stored lowercase in database)
    // Use limit(1) instead of maybeSingle() to handle cases where there are duplicate emails
    // We'll take the first result (most recent based on createdAt)
    const { data, error } = await supabase
      .from('Student')
      .select('id, name, rollNumber, email, contactNumber, planId, joinDate, endDate, price, paid, balance, credit, pin, isActive, createdAt, updatedAt, plan:Plan(id, name, meals, price, durationDays)')
      .eq('email', normalizedEmail)
      .order('createdAt', { ascending: false }) // Get most recent first
      .limit(1)

    if (error) {
      logger.error('getStudentByEmail: Error fetching student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    // Handle case where multiple rows exist (take first one)
    const studentData = Array.isArray(data) ? data[0] : data

    logger.debug('getStudentByEmail: Data received', { found: !!studentData, name: studentData?.name })
    
    if (!studentData || !studentData.plan) {
      logger.debug('getStudentByEmail: No data or plan, returning null')
      return { student: null, error: null }
    }

    // Warn if there are duplicate emails
    if (Array.isArray(data) && data.length > 1) {
      logger.warn(`getStudentByEmail: Found ${data.length} students with email ${normalizedEmail}. Using the most recent one.`, { email: normalizedEmail, count: data.length })
    }
    
    logger.debug('getStudentByEmail: Student found', {
      id: studentData.id,
      name: studentData.name,
      email: studentData.email,
      planName: studentData.plan?.name,
    })

    const student: Student = {
      id: studentData.id,
      name: studentData.name,
      rollNumber: studentData.rollNumber,
      email: studentData.email,
      contactNumber: studentData.contactNumber,
      planId: studentData.planId,
      plan: {
        id: studentData.plan.id,
        name: studentData.plan.name,
        meals: studentData.plan.meals,
        price: typeof studentData.plan.price === 'string' ? parseFloat(studentData.plan.price) : studentData.plan.price,
        durationDays: studentData.plan.durationDays,
      },
      joinDate: studentData.joinDate,
      endDate: studentData.endDate,
      price: typeof studentData.price === 'string' ? parseFloat(studentData.price) : studentData.price,
      paid: typeof studentData.paid === 'string' ? parseFloat(studentData.paid) : studentData.paid,
      balance: typeof studentData.balance === 'string' ? parseFloat(studentData.balance) : studentData.balance,
      credit: typeof studentData.credit === 'string' ? parseFloat(studentData.credit) : studentData.credit,
      pin: studentData.pin,
      isActive: studentData.isActive,
      createdAt: studentData.createdAt,
      updatedAt: studentData.updatedAt,
    }

    return { student, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student by email', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student'),
    }
  }
}

/**
 * Get student by user_id (UUID from auth.users.id)
 * This is the preferred method for role detection - stable and secure
 */
export async function getStudentByUserId(userId: string): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    logger.debug('getStudentByUserId: Searching for user_id', { userId })
    
    const { data, error } = await supabase
      .from('Student')
      .select('id, name, rollNumber, email, contactNumber, planId, joinDate, endDate, price, paid, balance, credit, pin, isActive, createdAt, updatedAt, user_id, plan:Plan(id, name, meals, price, durationDays)')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error('getStudentByUserId: Error fetching student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    if (!data || !data.plan) {
      logger.debug('getStudentByUserId: No data or plan, returning null')
      return { student: null, error: null }
    }

    logger.debug('getStudentByUserId: Student found', {
      id: data.id,
      name: data.name,
      email: data.email,
      planName: data.plan?.name,
    })

    const student: Student = {
      id: data.id,
      name: data.name,
      rollNumber: data.rollNumber,
      email: data.email,
      contactNumber: data.contactNumber,
      planId: data.planId,
      user_id: data.user_id,
      plan: {
        id: data.plan.id,
        name: data.plan.name,
        meals: data.plan.meals,
        price: typeof data.plan.price === 'string' ? parseFloat(data.plan.price) : data.plan.price,
        durationDays: data.plan.durationDays,
      },
      joinDate: data.joinDate,
      endDate: data.endDate,
      price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
      paid: typeof data.paid === 'string' ? parseFloat(data.paid) : data.paid,
      balance: typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance,
      credit: typeof data.credit === 'string' ? parseFloat(data.credit) : data.credit,
      pin: data.pin,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }

    return { student, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student by user_id', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student'),
    }
  }
}

/**
 * Get a single student by ID
 */
export async function getStudentById(id: number): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('Student')
      .select('id, name, rollNumber, email, contactNumber, planId, joinDate, endDate, price, paid, balance, credit, pin, isActive, createdAt, updatedAt, plan:Plan(id, name, meals, price, durationDays)')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    if (!data || !data.plan) {
      return { student: null, error: new Error('Student not found') }
    }

    const student: Student = {
      id: data.id,
      name: data.name,
      rollNumber: data.rollNumber,
      email: data.email,
      contactNumber: data.contactNumber,
      planId: data.planId,
      plan: {
        id: data.plan.id,
        name: data.plan.name,
        meals: data.plan.meals,
        price: typeof data.plan.price === 'string' ? parseFloat(data.plan.price) : data.plan.price,
        durationDays: data.plan.durationDays,
      },
      joinDate: data.joinDate,
      endDate: data.endDate,
      price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
      paid: typeof data.paid === 'string' ? parseFloat(data.paid) : data.paid,
      balance: typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance,
      credit: typeof data.credit === 'string' ? parseFloat(data.credit) : data.credit,
      pin: data.pin,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }

    return { student, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student'),
    }
  }
}

/**
 * Create a new student
 * Note: This creates the student in database. Email sending is handled separately via web app API.
 */
export async function createStudent(data: CreateStudentData): Promise<{ student: Student; error: null } | { student: null; error: Error }> {
  try {
    // Validate required fields
    if (!data.name?.trim()) {
      return { student: null, error: new Error('Name is required') }
    }
    if (!data.email?.trim()) {
      return { student: null, error: new Error('Email is required') }
    }
    if (!data.contactNumber?.trim()) {
      return { student: null, error: new Error('Mobile number is required') }
    }
    if (!data.planId) {
      return { student: null, error: new Error('Plan is required') }
    }

    // Get plan to calculate price and end date
    const { data: planData, error: planError } = await supabase
      .from('Plan')
      .select('id, name, price, durationDays')
      .eq('id', data.planId)
      .single()

    if (planError || !planData) {
      return { student: null, error: new Error('Plan not found') }
    }

    const planPrice = typeof planData.price === 'string' ? parseFloat(planData.price) : planData.price
    const joinDate = new Date(data.joinDate)
    const endDate = data.endDate ? new Date(data.endDate) : new Date(joinDate.getTime() + planData.durationDays * 24 * 60 * 60 * 1000)

    // Calculate balance and credit (matching web app logic)
    const paid = data.paid || 0
    const priceRounded = Math.round(planPrice * 100) / 100
    const paidRounded = Math.round(paid * 100) / 100
    
    const balance = Math.max(Math.round((priceRounded - paidRounded) * 100) / 100, 0)
    const credit = Math.max(Math.round((paidRounded > priceRounded ? paidRounded - priceRounded : 0) * 100) / 100, 0)

    // Generate roll number
    const { data: rollNumbers } = await supabase
      .from('Student')
      .select('rollNumber')
      .like('rollNumber', 'STU-%')
      .order('rollNumber', { ascending: false })
      .limit(1)

    let rollNumber = 'STU-0001'
    if (rollNumbers && rollNumbers.length > 0 && rollNumbers[0]?.rollNumber) {
      const match = rollNumbers[0].rollNumber.match(/STU-(\d+)/)
      if (match?.[1]) {
        const lastNum = parseInt(match[1], 10)
        if (!isNaN(lastNum)) {
          rollNumber = `STU-${String(lastNum + 1).padStart(4, '0')}`
        }
      }
    }

    // Generate 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString()

    // Generate secure password (8-12 characters, alphanumeric + special)
    const generatePassword = () => {
      const length = 10
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
      let password = ''
      // Ensure at least one lowercase, one uppercase, one number, one special
      password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
      password += '0123456789'[Math.floor(Math.random() * 10)]
      password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
      // Fill the rest randomly
      for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
      }
      // Shuffle
      return password.split('').sort(() => Math.random() - 0.5).join('')
    }
    const generatedPassword = generatePassword()

    // Create student
    const { data: studentData, error } = await supabase
      .from('Student')
      .insert({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        contactNumber: data.contactNumber.trim(),
        planId: data.planId,
        rollNumber,
        joinDate: joinDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        price: planPrice,
        paid,
        balance,
        credit,
        pin,
        isActive: true,
      })
      .select('id, name, rollNumber, email, contactNumber, planId, joinDate, endDate, price, paid, balance, credit, pin, isActive, createdAt, updatedAt')
      .single()

    if (error) {
      logger.error('Error creating student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    // Fetch with plan relation
    const result = await getStudentById(studentData.id)
    if (result.error || !result.student) {
      return { student: null, error: result.error || new Error('Failed to fetch created student') }
    }

    // Create Supabase Auth user with the generated password
    // Note: This requires service role key, but we're using anon key
    // The web app API will handle Auth user creation when sending email
    // For now, we'll store the password temporarily for display
    const studentWithPassword = {
      ...result.student,
      password: generatedPassword, // This will be used for display, web app will create Auth user
    }

    return { student: studentWithPassword, error: null }
  } catch (error) {
    logger.error('Unexpected error creating student', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to create student'),
    }
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(
  id: number,
  data: UpdateStudentData
): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }
    if (data.email !== undefined) {
      updateData.email = data.email.trim().toLowerCase()
    }
    if (data.contactNumber !== undefined) {
      updateData.contactNumber = data.contactNumber.trim()
    }
    if (data.joinDate !== undefined) {
      updateData.joinDate = new Date(data.joinDate).toISOString().split('T')[0]
    }
    if (data.endDate !== undefined) {
      updateData.endDate = new Date(data.endDate).toISOString().split('T')[0]
    }
    if (data.paid !== undefined) {
      // Recalculate balance if paid amount changes
      const { data: existingStudent } = await supabase
        .from('Student')
        .select('price')
        .eq('id', id)
        .single()

      if (existingStudent) {
        const price = typeof existingStudent.price === 'string' ? parseFloat(existingStudent.price) : existingStudent.price
        updateData.paid = data.paid
        updateData.balance = price - data.paid
      }
    }
    if (data.pin !== undefined) {
      // Validate PIN is 4 digits
      if (data.pin.length !== 4 || !/^\d{4}$/.test(data.pin)) {
        return { student: null, error: new Error('PIN must be exactly 4 digits') }
      }
      updateData.pin = data.pin
    }

    const { error } = await supabase
      .from('Student')
      .update(updateData)
      .eq('id', id)

    if (error) {
      logger.error('Error updating student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    // Fetch updated student
    const result = await getStudentById(id)
    return result
  } catch (error) {
    logger.error('Unexpected error updating student', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to update student'),
    }
  }
}

/**
 * Delete a student
 */
export async function deleteStudent(id: number): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const { error } = await supabase.from('Student').delete().eq('id', id)

    if (error) {
      logger.error('Error deleting student', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting student', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete student'),
    }
  }
}

/**
 * Extend student plan by number of days
 * Now uses Supabase Edge Function - no web app dependency!
 */
export async function extendPlan(
  id: number,
  data: ExtendPlanData
): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { student: null, error: new Error('Not authenticated') }
    }

    // Call Supabase Edge Function
    const { data: result, error: functionError } = await supabase.functions.invoke('extend-plan', {
      body: {
        studentId: id,
        days: data.days,
        paid: data.paid || 0,
        extendFromToday: data.extendFromToday !== undefined ? data.extendFromToday : true,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (functionError) {
      return { student: null, error: new Error(functionError.message || 'Failed to extend plan') }
    }

    if (result?.error) {
      return { student: null, error: new Error(result.error) }
    }

    // Fetch updated student to get full data with relationships
    const studentResult = await getStudentById(id)
    return studentResult
  } catch (error) {
    logger.error('Error extending plan', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to extend plan'),
    }
  }
}

/**
 * Renew student plan with a new plan
 * Now uses Supabase Edge Function - no web app dependency!
 */
export async function renewPlan(
  id: number,
  data: RenewPlanData
): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { student: null, error: new Error('Not authenticated') }
    }

    // Call Supabase Edge Function
    const { data: result, error: functionError } = await supabase.functions.invoke('renew-plan', {
      body: {
        studentId: id,
        planId: data.planId,
        paid: data.paid || 0,
        extendFromCurrent: data.extendFromCurrent || false,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (functionError) {
      return { student: null, error: new Error(functionError.message || 'Failed to renew plan') }
    }

    if (result?.error) {
      return { student: null, error: new Error(result.error) }
    }

    // Fetch updated student to get full data with relationships
    const studentResult = await getStudentById(id)
    return studentResult
  } catch (error) {
    logger.error('Error renewing plan', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to renew plan'),
    }
  }
}

/**
 * Export student details as CSV
 * @param studentId - Optional student ID to export specific student, or undefined to export all
 * @param search - Optional search term to filter students
 */
export async function exportStudents(studentId?: number, search?: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL
    if (!webAppUrl) {
      return { success: false, error: new Error('Web app URL not configured. Please set EXPO_PUBLIC_WEB_APP_URL in environment variables.') }
    }

    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: new Error('Not authenticated. Please log in again.') }
    }

    // Build query parameters
    const params = new URLSearchParams()
    if (studentId) {
      params.append('studentId', studentId.toString())
    }
    if (search && search.trim().length >= 2) {
      params.append('search', search.trim())
    }

    const response = await fetch(`${webAppUrl}/api/students/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: new Error('Authentication failed. Please log in again.') }
      }
      if (response.status >= 500) {
        return { success: false, error: new Error('Server error. Please try again later.') }
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Failed to export students' }))
      return { success: false, error: new Error(errorData.error || errorData.message || 'Failed to export students') }
    }

    // Get CSV data
    const csvText = await response.text()
    
    // Save and share the CSV file
    // Use documentDirectory as it's more reliable than cacheDirectory
    const storageDir = FileSystem.documentDirectory || FileSystem.cacheDirectory
    if (!storageDir) {
      return { success: false, error: new Error('File system not available. Please check app permissions.') }
    }

    const filename = studentId 
      ? `student-${studentId}-${new Date().toISOString().split('T')[0]}.csv`
      : `students-${new Date().toISOString().split('T')[0]}.csv`
    const fileUri = `${storageDir}${filename}`

    // Write CSV to file
    await FileSystem.writeAsStringAsync(fileUri, csvText, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    // Share the file
    const isAvailable = await Sharing.isAvailableAsync()
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Student Details',
        UTI: 'public.comma-separated-values-text',
      })
    } else {
      return { success: false, error: new Error('Sharing is not available on this device') }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Error exporting students', error as Error)
    
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        return { success: false, error: new Error('Network error. Please check your internet connection.') }
      }
      if (error.message.includes('Failed to fetch')) {
        return { success: false, error: new Error('Cannot connect to server. The web app may be down or the URL is incorrect.') }
      }
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to export student details. Please try again later.'
    
    return {
      success: false,
      error: new Error(errorMessage),
    }
  }
}

/**
 * Send credentials email via web app API
 * @param studentId - The student ID
 * @param password - Optional password to use (if not provided, web app will generate one)
 */
export async function sendCredentialsEmail(studentId: number, password?: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL
    if (!webAppUrl) {
      return { success: false, error: new Error('Web app URL not configured. Please set EXPO_PUBLIC_WEB_APP_URL in environment variables.') }
    }

    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: new Error('Not authenticated. Please log in again.') }
    }

    const response = await fetch(`${webAppUrl}/api/students/send-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ 
        studentId,
        ...(password && { password }) // Include password if provided
      }),
    })

    if (!response.ok) {
      // Handle different HTTP status codes
      if (response.status === 404) {
        return { success: false, error: new Error('Email API endpoint not found. The web app may need to be updated.') }
      }
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: new Error('Authentication failed. Please log in again.') }
      }
      if (response.status >= 500) {
        return { success: false, error: new Error('Server error. Please try again later.') }
      }
      
      // Try to get error message from response
      const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }))
      return { success: false, error: new Error(errorData.error || errorData.message || 'Failed to send email') }
    }

    return { success: true, error: null }
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        return { success: false, error: new Error('Network error. Please check your internet connection.') }
      }
      if (error.message.includes('Failed to fetch')) {
        return { success: false, error: new Error('Cannot connect to server. The web app may be down or the URL is incorrect.') }
      }
    }
    
    // Handle CORS errors
    if (error instanceof Error && error.message.includes('CORS')) {
      return { success: false, error: new Error('CORS error. Please check web app configuration.') }
    }
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to send credentials email. Please try again later.'
    
    return {
      success: false,
      error: new Error(errorMessage),
    }
  }
}

