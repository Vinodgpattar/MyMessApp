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
    const { studentId, planId, paid = 0, extendFromCurrent = false, startDate } = await req.json()

    // Validation
    if (!studentId || !planId) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: studentId and planId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (paid < 0) {
      return new Response(
        JSON.stringify({ error: 'Payment amount cannot be negative' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Prevent renewing with same plan
    if (existingStudent.planId === planId) {
      return new Response(
        JSON.stringify({ error: 'Cannot renew with the same plan. Please select a different plan.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get new plan
    const { data: newPlan, error: planError } = await supabase
      .from('Plan')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !newPlan) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let newJoinDate: Date
    let newEndDate: Date

    if (startDate) {
      // Use provided start date
      newJoinDate = new Date(startDate)
      newJoinDate.setHours(0, 0, 0, 0)
      newEndDate = new Date(newJoinDate)
      newEndDate.setDate(newEndDate.getDate() + newPlan.durationDays)
    } else if (extendFromCurrent) {
      // Extend from current endDate
      const currentEndDate = new Date(existingStudent.endDate)
      currentEndDate.setHours(0, 0, 0, 0)
      newJoinDate = currentEndDate
      newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() + newPlan.durationDays)
    } else {
      // Start from today
      newJoinDate = today
      newEndDate = new Date(today)
      newEndDate.setDate(newEndDate.getDate() + newPlan.durationDays)
    }

    // Calculate balance with credit carry-forward
    const planPrice = typeof newPlan.price === 'number' ? newPlan.price : parseFloat(newPlan.price) || 0
    const existingCredit = typeof existingStudent.credit === 'number' ? existingStudent.credit : parseFloat(existingStudent.credit) || 0
    const newPayment = paid || 0
    
    // Carry forward existing credit
    const totalPaid = newPayment + existingCredit
    
    // Calculate balance and credit
    const balance = Math.max(Math.round((planPrice - totalPaid) * 100) / 100, 0)
    const credit = Math.max(Math.round((totalPaid > planPrice ? totalPaid - planPrice : 0) * 100) / 100, 0)

    // Update student
    const { data: updatedStudent, error: updateError } = await supabase
      .from('Student')
      .update({
        planId: planId,
        price: planPrice,
        joinDate: newJoinDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
        paid: Math.round(totalPaid * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        credit: Math.round(credit * 100) / 100,
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
            action: 'renew_plan',
            oldPlanId: existingStudent.planId,
            newPlanId: planId,
            oldEndDate: existingStudent.endDate,
            newEndDate: newEndDate.toISOString().split('T')[0],
            paid: newPayment,
            existingCredit: existingCredit,
            totalPaid: totalPaid,
          },
        })
    } catch (auditError) {
      // Don't fail if audit log fails
      console.error('Error creating audit log:', auditError)
    }

    return new Response(
      JSON.stringify({
        message: 'Plan renewed successfully',
        student: updatedStudent,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in renew-plan function:', error)
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










