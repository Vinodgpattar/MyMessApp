import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'

interface PushNotification {
  to: string
  sound: string
  title: string
  body: string
  data?: Record<string, unknown>
  priority?: string
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
    const body = await req.json()
    const { title, message, imageUrl, targetType, studentIds } = body

    // Validation
    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Title and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!targetType || !['all', 'active', 'expiring', 'expired', 'custom'].includes(targetType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid targetType. Must be: all, active, expiring, expired, or custom' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (targetType === 'custom' && (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'studentIds array is required when targetType is custom' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get target students based on targetType
    let targetStudentIds: number[] = []

    if (targetType === 'custom') {
      targetStudentIds = studentIds
    } else {
      const today = new Date().toISOString().split('T')[0]
      let query = supabase.from('Student').select('id')

      if (targetType === 'active') {
        query = query.eq('isActive', true).gte('endDate', today)
      } else if (targetType === 'expiring') {
        const threeDaysLater = new Date()
        threeDaysLater.setDate(threeDaysLater.getDate() + 3)
        const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]
        query = query.eq('isActive', true).gte('endDate', today).lte('endDate', threeDaysLaterStr)
      } else if (targetType === 'expired') {
        query = query.lt('endDate', today)
      } else {
        // 'all' - get all active students
        query = query.eq('isActive', true)
      }

      const { data: students, error: studentsError } = await query

      if (studentsError) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch students: ${studentsError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      targetStudentIds = students?.map(s => s.id) || []
    }

    if (targetStudentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No students found matching the target criteria' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create AdminNotification record
    const { data: notification, error: notifError } = await supabase
      .from('AdminNotification')
      .insert({
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl || null,
        sentBy: user.id,
        targetType,
        targetStudentIds: targetType === 'custom' ? JSON.stringify(targetStudentIds) : null,
        totalSent: targetStudentIds.length,
        readCount: 0,
      })
      .select()
      .single()

    if (notifError || !notification) {
      return new Response(
        JSON.stringify({ error: `Failed to create notification: ${notifError?.message || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create AdminNotificationRecipient records
    const recipients = targetStudentIds.map(studentId => ({
      notificationId: notification.id,
      studentId,
      read: false,
      pushSent: false,
    }))

    const { error: recipientsError } = await supabase
      .from('AdminNotificationRecipient')
      .insert(recipients)

    if (recipientsError) {
      return new Response(
        JSON.stringify({ error: `Failed to create recipients: ${recipientsError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Trigger push notifications asynchronously (don't wait for it)
    // The send-announcement-push function will handle this
    try {
      await supabase.functions.invoke('send-announcement-push', {
        body: { notificationId: notification.id },
      })
    } catch (pushError) {
      console.error('Error triggering push notifications:', pushError)
      // Don't fail the request if push fails
    }

    // Create audit log (if AuditLog table exists)
    try {
      await supabase.from('AuditLog').insert({
        userId: user.id,
        userEmail: user.email,
        action: 'SEND_ANNOUNCEMENT',
        entity: 'AdminNotification',
        entityId: notification.id,
        details: JSON.stringify({
          notificationId: notification.id,
          title,
          targetType,
          totalSent: targetStudentIds.length,
        }),
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the request if audit log fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: notification.id,
        totalSent: targetStudentIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-announcement function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

