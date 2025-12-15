import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get request body
    const { studentId, days, startDate, paid = 0 } = await req.json()

    // Validation
    if (!studentId || !days || days <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: studentId and days (positive number) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!startDate) {
      return new Response(
        JSON.stringify({ error: 'Start date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (paid < 0) {
      return new Response(
        JSON.stringify({ error: 'Payment amount cannot be negative' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing student with plan
    const { data: existingStudent, error: studentError } = await supabase
      .from('Student')
      .select(`
        *,
        plan:Plan(*)
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !existingStudent) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin (check profile)
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

    // Parse and validate start date
    const [year, month, day] = startDate.split('-').map(Number)
    const startDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const today = new Date()
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))
    
    // Validate start date is not in the past
    if (startDateObj.getTime() < todayUTC.getTime()) {
      return new Response(
        JSON.stringify({ error: 'Start date cannot be in the past' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Calculate new end date: startDate + days
    const daysToAdd = days
    const newEndDate = new Date(startDateObj)
    newEndDate.setUTCDate(newEndDate.getUTCDate() + daysToAdd)
    newEndDate.setUTCHours(0, 0, 0, 0)

    // Manager can enter any payment amount (no extension cost calculation)
    const newPayment = paid || 0

    // Calculate balance (no credit system, price stays the same)
    const planPrice = typeof existingStudent.price === 'number' ? existingStudent.price : parseFloat(existingStudent.price) || 0
    const existingPaid = typeof existingStudent.paid === 'number' ? existingStudent.paid : parseFloat(existingStudent.paid) || 0
    const newPaid = Math.round((existingPaid + newPayment) * 100) / 100
    // Price remains the same (no automatic extension cost calculation)
    const balance = Math.max(Math.round((planPrice - newPaid) * 100) / 100, 0)

    // Update student in transaction
    const { data: updatedStudent, error: updateError } = await supabase
      .from('Student')
      .update({
        endDate: newEndDate.toISOString().split('T')[0],
        // Price remains the same (no automatic extension cost calculation)
        paid: Math.round(newPaid * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        credit: 0, // Credit system removed - always set to 0
        isActive: true, // Reactivate if inactive
      })
      .eq('id', studentId)
      .select(`
        *,
        plan:Plan(*)
      `)
      .single()

    if (updateError) {
      console.error('Error updating student:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update student plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create audit log (if AuditLog table exists)
    try {
      await supabase
        .from('AuditLog')
        .insert({
          userId: user.id,
          userEmail: user.email,
          action: 'UPDATE_STUDENT',
          entity: 'Student',
          entityId: studentId,
          details: {
            action: 'extend_plan',
            days: days,
            startDate: startDate,
            oldEndDate: existingStudent.endDate,
            newEndDate: newEndDate.toISOString().split('T')[0],
            paid: newPayment,
          },
        })
    } catch (auditError) {
      // Don't fail if audit log fails
      console.error('Error creating audit log:', auditError)
    }

    return new Response(
      JSON.stringify({
        message: 'Plan extended successfully',
        student: updatedStudent,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in extend-plan function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})










