import { supabase } from './supabase'
import { logger } from './logger'

// Get Supabase URL from environment
const getSupabaseUrl = () => {
  return process.env.EXPO_PUBLIC_SUPABASE_URL || ''
}

export interface Payment {
  id: number
  studentId: number
  amount: number
  paymentDate: string
  method: string | null
  createdAt: string
  updatedAt: string
  student: {
    id: number
    name: string
    rollNumber: string | null
    email: string
    paid: number
    balance: number
  }
}

export interface PaymentStats {
  total: number
  today: number
  thisMonth: number
  byMethod: {
    cash: number
    upi: number
    online: number
  }
}

export interface CreatePaymentData {
  studentId: number
  amount: number
  paymentDate: string
  method: string
}

export interface UpdatePaymentData {
  amount?: number
  paymentDate?: string
  method?: string
}

export interface GetPaymentsParams {
  page?: number
  limit?: number
  search?: string
  studentId?: number
  startDate?: string
  endDate?: string
  method?: string
}

/**
 * Get all payments with filters and pagination
 */
export async function getPayments(
  params: GetPaymentsParams = {}
): Promise<{ payments: Payment[]; pagination: { total: number; page: number; limit: number; totalPages: number }; error: null } | { payments: null; pagination: null; error: Error }> {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      studentId,
      startDate,
      endDate,
      method,
    } = params

    let query = supabase
      .from('Payment')
      .select(`
        *,
        student:Student(
          id,
          name,
          rollNumber,
          email,
          paid,
          balance
        )
      `, { count: 'exact' })
      .order('paymentDate', { ascending: false })
      .order('createdAt', { ascending: false })

    // Apply filters
    if (studentId) {
      query = query.eq('studentId', studentId)
    }

    if (startDate) {
      query = query.gte('paymentDate', startDate)
    }

    if (endDate) {
      query = query.lte('paymentDate', endDate)
    }

    if (method) {
      query = query.eq('method', method)
    }

    // Apply search (search in student name or roll number)
    if (search) {
      // We'll need to filter by student name/rollNumber
      // Since we can't directly search in joined table, we'll fetch and filter
      const { data, error, count } = await query

      if (error) throw error

      const searchLower = search.toLowerCase()
      const filtered = data?.filter((payment: any) => {
        const student = payment.student
        return (
          student?.name?.toLowerCase().includes(searchLower) ||
          student?.rollNumber?.toLowerCase().includes(searchLower)
        )
      }) || []

      // Apply pagination
      const start = (page - 1) * limit
      const end = start + limit - 1
      const paginated = filtered.slice(start, end)

      return {
        payments: paginated as Payment[],
        pagination: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit),
        },
        error: null,
      }
    }

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) throw error

    return {
      payments: (data || []) as Payment[],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      error: null,
    }
  } catch (error) {
    logger.error('Error fetching payments', error as Error)
    return {
      payments: null,
      pagination: null,
      error: error instanceof Error ? error : new Error('Failed to fetch payments'),
    }
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(
  id: number
): Promise<{ payment: Payment | null; error: null } | { payment: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('Payment')
      .select(`
        *,
        student:Student(
          id,
          name,
          rollNumber,
          email,
          paid,
          balance
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      payment: data as Payment,
      error: null,
    }
  } catch (error) {
    logger.error('Error fetching payment', error as Error)
    return {
      payment: null,
      error: error instanceof Error ? error : new Error('Failed to fetch payment'),
    }
  }
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(
  dateRange?: { start: string; end: string }
): Promise<{ stats: PaymentStats; error: null } | { stats: null; error: Error }> {
  try {
    const todayDate = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]

    // Get all payments for stats
    let query = supabase.from('Payment').select('amount, method, paymentDate')

    if (dateRange) {
      query = query.gte('paymentDate', dateRange.start).lte('paymentDate', dateRange.end)
    }

    const { data, error } = await query

    if (error) throw error

    const payments = data || []

    // Calculate stats
    const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const today = payments
      .filter((p) => p.paymentDate === todayDate)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const thisMonth = payments
      .filter((p) => p.paymentDate >= startOfMonth)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const byMethod = {
      cash: payments
        .filter((p) => p.method === 'Cash')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
      upi: payments
        .filter((p) => p.method === 'UPI')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
      online: payments
        .filter((p) => p.method === 'Online')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    }

    return {
      stats: {
        total,
        today,
        thisMonth,
        byMethod,
      },
      error: null,
    }
  } catch (error) {
    logger.error('Error fetching payment stats', error as Error)
    return {
      stats: null,
      error: error instanceof Error ? error : new Error('Failed to fetch payment stats'),
    }
  }
}

/**
 * Create a new payment (transaction-safe via Edge Function)
 * Uses Edge Function to ensure payment creation and balance update happen atomically
 */
export async function createPayment(
  data: CreatePaymentData
): Promise<{ success: boolean; payment: Payment | null; error: null } | { success: false; payment: null; error: Error }> {
  try {
    // Validate input
    if (!data.studentId || data.amount <= 0 || !data.paymentDate || !data.method) {
      return {
        success: false,
        payment: null,
        error: new Error('Invalid payment data. Please check all required fields.'),
      }
    }

    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return {
        success: false,
        payment: null,
        error: new Error('Not authenticated. Please log in again.'),
      }
    }

    // Call Edge Function for transaction-safe payment creation
    const supabaseUrl = getSupabaseUrl()
    if (!supabaseUrl) {
      return {
        success: false,
        payment: null,
        error: new Error('Supabase URL not configured'),
      }
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        studentId: data.studentId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        method: data.method,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        payment: null,
        error: new Error(result.error || 'Failed to create payment'),
      }
    }

    return {
      success: true,
      payment: result.payment as Payment,
      error: null,
    }
  } catch (error) {
    logger.error('Error creating payment', error as Error, { studentId: data.studentId, amount: data.amount })
    return {
      success: false,
      payment: null,
      error: error instanceof Error ? error : new Error('Failed to create payment'),
    }
  }
}

/**
 * Update an existing payment
 */
export async function updatePayment(
  id: number,
  data: UpdatePaymentData
): Promise<{ success: boolean; payment: Payment | null; error: null } | { success: false; payment: null; error: Error }> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        payment: null,
        error: new Error('Invalid payment ID'),
      }
    }

    // Get existing payment to calculate difference
    const { data: existingPayment, error: fetchError } = await supabase
      .from('Payment')
      .select('studentId, amount')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Update payment
    const updateData: any = {}
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate
    if (data.method !== undefined) updateData.method = data.method

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        payment: null,
        error: new Error('No fields to update'),
      }
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('Payment')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        student:Student(
          id,
          name,
          rollNumber,
          email,
          paid,
          balance
        )
      `)
      .single()

    if (updateError) throw updateError

    // Update student balance if amount changed
    if (data.amount !== undefined) {
      const oldAmount = Number(existingPayment.amount || 0)
      const newAmount = Number(data.amount)
      const difference = newAmount - oldAmount

      if (difference !== 0) {
        const { data: studentData, error: studentError } = await supabase
          .from('Student')
          .select('paid, price')
          .eq('id', existingPayment.studentId)
          .single()

        if (studentError) throw studentError

        const newPaid = Number(studentData.paid || 0) + difference
        const newBalance = Number(studentData.price || 0) - newPaid

        const { error: balanceUpdateError } = await supabase
          .from('Student')
          .update({
            paid: newPaid,
            balance: newBalance,
          })
          .eq('id', existingPayment.studentId)

        if (balanceUpdateError) throw balanceUpdateError
      }
    }

    return {
      success: true,
      payment: updatedPayment as Payment,
      error: null,
    }
  } catch (error) {
    logger.error('Error updating payment', error as Error)
    return {
      success: false,
      payment: null,
      error: error instanceof Error ? error : new Error('Failed to update payment'),
    }
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(
  id: number
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: new Error('Invalid payment ID'),
      }
    }

    // Get payment to update student balance
    const { data: payment, error: fetchError } = await supabase
      .from('Payment')
      .select('studentId, amount')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Delete payment
    const { error: deleteError } = await supabase.from('Payment').delete().eq('id', id)

    if (deleteError) throw deleteError

    // Update student balance
    const { data: studentData, error: studentError } = await supabase
      .from('Student')
      .select('paid, price')
      .eq('id', payment.studentId)
      .single()

    if (studentError) throw studentError

    const newPaid = Number(studentData.paid || 0) - Number(payment.amount || 0)
    const newBalance = Number(studentData.price || 0) - newPaid

    const { error: updateError } = await supabase
      .from('Student')
      .update({
        paid: newPaid,
        balance: newBalance,
      })
      .eq('id', payment.studentId)

    if (updateError) throw updateError

    return { success: true, error: null }
  } catch (error) {
    logger.error('Error deleting payment', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete payment'),
    }
  }
}

