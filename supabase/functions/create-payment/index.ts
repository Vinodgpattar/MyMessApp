import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentRequest {
  studentId: number
  amount: number
  paymentDate: string
  method: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin (check profiles table)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const body: CreatePaymentRequest = await req.json()
    const { studentId, amount, paymentDate, method } = body

    // Validation
    if (!studentId || !amount || amount <= 0 || !paymentDate || !method) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment data. studentId, amount, paymentDate, and method are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if student exists and is active
    const { data: student, error: studentError } = await supabase
      .from('Student')
      .select('id, paid, price, isActive')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!student.isActive) {
      return new Response(
        JSON.stringify({ error: 'Cannot record payment for inactive student' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate current balance and validate payment amount
    const existingPaid = Number(student.paid || 0)
    const studentPrice = Number(student.price || 0)
    const currentBalance = Math.round((studentPrice - existingPaid) * 100) / 100

    // Prevent payments exceeding the remaining balance
    if (amount > currentBalance) {
      return new Response(
        JSON.stringify({
          error: `Payment amount (₹${amount.toFixed(2)}) exceeds remaining balance (₹${currentBalance.toFixed(2)}). Maximum allowed: ₹${currentBalance.toFixed(2)}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newPaid = Math.round((existingPaid + amount) * 100) / 100
    const newBalance = Math.max(Math.round((studentPrice - newPaid) * 100) / 100, 0)
    const credit = 0 // Credit system removed - always set to 0

    // Use RPC function for transaction-safe payment creation
    // This ensures both payment creation and student balance update happen atomically
    const { data: result, error: rpcError } = await supabase.rpc('create_payment_transaction', {
      p_student_id: studentId,
      p_amount: amount,
      p_payment_date: paymentDate,
      p_method: method,
      p_new_paid: newPaid,
      p_new_balance: newBalance,
      p_new_credit: credit,
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      return new Response(
        JSON.stringify({ error: `Failed to create payment: ${rpcError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the created payment with student details
    const { data: paymentData, error: paymentFetchError } = await supabase
      .from('Payment')
      .select(`
        *,
        student:Student(
          id,
          name,
          rollNumber,
          email,
          paid,
          balance,
          credit
        )
      `)
      .eq('id', result.payment_id)
      .single()

    if (paymentFetchError) {
      return new Response(
        JSON.stringify({ error: 'Payment created but failed to fetch details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: paymentData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in create-payment function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

