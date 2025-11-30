import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateStudentRequest {
  name: string
  email: string
  contactNumber: string
  planId: number
  joinDate: string
  endDate?: string
  paid?: number
}

const formatDate = (date: Date) => date.toISOString().split('T')[0]

const generatePassword = () => {
  const length = 10
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  for (let i = password.length; i < length; i += 1) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: CreateStudentRequest = await req.json()
    const { name, email, contactNumber, planId, joinDate, endDate, paid = 0 } = body

    if (!name || !email || !contactNumber || !planId || !joinDate) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if email already exists
    try {
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(normalizedEmail)
      if (existingUser?.user) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      // getUserByEmail throws if user doesn't exist - that's fine, continue
    }

    const { data: plan, error: planError } = await supabase
      .from('Plan')
      .select('id, price, durationDays')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: `Plan not found: ${planError?.message || 'Invalid plan ID'}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const joinDateObj = new Date(joinDate)
    if (Number.isNaN(joinDateObj.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid join date' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const endDateObj = endDate ? new Date(endDate) : new Date(joinDateObj.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

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
        if (!Number.isNaN(lastNum)) {
          rollNumber = `STU-${String(lastNum + 1).padStart(4, '0')}`
        }
      }
    }

    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    const password = generatePassword()

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    })

    if (createUserError || !createdUser.user) {
      console.error('Failed to create auth user:', createUserError)
      return new Response(JSON.stringify({ error: createUserError?.message || 'Failed to create auth user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authUserId = createdUser.user.id

    const { error: profileInsertError } = await supabase.from('profiles').insert({
      user_id: authUserId,
      role: 'student',
      email: normalizedEmail,
    })

    if (profileInsertError) {
      console.error('Failed to create profile:', profileInsertError)
      return new Response(JSON.stringify({ error: profileInsertError.message || 'Failed to create profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const planPrice = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price
    const paidRounded = Math.round((paid || 0) * 100) / 100
    const priceRounded = Math.round(planPrice * 100) / 100
    const balance = Math.max(Math.round((priceRounded - paidRounded) * 100) / 100, 0)
    const credit = Math.max(Math.round((paidRounded > priceRounded ? paidRounded - priceRounded : 0) * 100) / 100, 0)

    const { data: studentInsert, error: studentError } = await supabase
      .from('Student')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        contactNumber: contactNumber.trim(),
        planId,
        rollNumber,
        joinDate: formatDate(joinDateObj),
        endDate: formatDate(endDateObj),
        price: planPrice,
        paid: paidRounded,
        balance,
        credit,
        pin,
        isActive: true,
        user_id: authUserId,
      })
      .select('id')
      .single()

    if (studentError || !studentInsert) {
      console.error('Failed to create student:', studentError)
      return new Response(JSON.stringify({ error: studentError?.message || 'Failed to create student' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: studentWithPlan, error: fetchError } = await supabase
      .from('Student')
      .select(`
        id,
        name,
        rollNumber,
        email,
        contactNumber,
        planId,
        joinDate,
        endDate,
        price,
        paid,
        balance,
        credit,
        pin,
        isActive,
        createdAt,
        updatedAt,
        plan:Plan(id, name, meals, price, durationDays)
      `)
      .eq('id', studentInsert.id)
      .single()

    if (fetchError || !studentWithPlan) {
      console.error('Failed to fetch student:', fetchError)
      return new Response(JSON.stringify({ error: 'Student created but failed to fetch details' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, student: { ...studentWithPlan, password } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in admin-create-student function:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
