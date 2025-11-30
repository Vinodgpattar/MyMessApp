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
    const { studentId, days, paid = 0, extendFromToday = true } = await req.json()

    // Validation
    if (!studentId || !days || days <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: studentId and days (positive number) are required' }),
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

    // Calculate dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const currentEndDate = new Date(existingStudent.endDate)
    currentEndDate.setHours(0, 0, 0, 0)
    
    // Calculate new end date
    const daysToAdd = days
    const newEndDate = new Date(extendFromToday ? today : currentEndDate)
    newEndDate.setDate(newEndDate.getDate() + daysToAdd)
    newEndDate.setHours(0, 0, 0, 0)

    // Calculate costs
    const planPrice = typeof existingStudent.price === 'number' ? existingStudent.price : parseFloat(existingStudent.price) || 0
    const planDuration = existingStudent.plan?.durationDays || 1
    const pricePerDay = planDuration > 0 ? planPrice / planDuration : 0
    
    // Calculate additional cost if extending from today (when plan hasn't expired yet)
    const daysOverlap = currentEndDate > today 
      ? Math.ceil((currentEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) 
      : 0
    const additionalCost = daysOverlap > 0 && daysToAdd > daysOverlap 
      ? Math.round(pricePerDay * (daysToAdd - daysOverlap) * 100) / 100 
      : 0

    // Calculate balance with credit carry-forward
    const existingPaid = typeof existingStudent.paid === 'number' ? existingStudent.paid : parseFloat(existingStudent.paid) || 0
    const existingCredit = typeof existingStudent.credit === 'number' ? existingStudent.credit : parseFloat(existingStudent.credit) || 0
    const newPayment = paid || 0
    
    // Carry forward existing credit
    const totalNewPayment = newPayment + existingCredit
    const newPaid = existingPaid + newPayment + existingCredit
    const newPrice = extendFromToday && additionalCost > 0
      ? planPrice + additionalCost
      : planPrice

    // Calculate balance and credit
    const balance = Math.max(Math.round((newPrice - newPaid) * 100) / 100, 0)
    const credit = Math.max(Math.round((newPaid > newPrice ? newPaid - newPrice : 0) * 100) / 100, 0)

    // Update student in transaction
    const { data: updatedStudent, error: updateError } = await supabase
      .from('Student')
      .update({
        endDate: newEndDate.toISOString().split('T')[0],
        price: extendFromToday && additionalCost > 0 ? Math.round(newPrice * 100) / 100 : undefined,
        paid: Math.round(newPaid * 100) / 100,
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
            action: 'extend_plan',
            days: days,
            oldEndDate: existingStudent.endDate,
            newEndDate: newEndDate.toISOString().split('T')[0],
            additionalCost: extendFromToday ? additionalCost : 0,
            paid: newPayment,
            existingCredit: existingCredit,
            totalNewPayment: totalNewPayment,
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
        additionalCost: extendFromToday ? additionalCost : 0,
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










