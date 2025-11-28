/**
 * Script to verify/create admin user in Supabase Auth
 * 
 * This script helps verify if the admin user exists and can be used to create one if needed.
 * 
 * Usage:
 * 1. Set up your .env.local file with Supabase credentials
 * 2. Run: npx tsx scripts/verify-admin-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Create admin client (requires service role key for user management)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'Admin123!'

async function verifyAdminUser() {
  console.log('🔍 Verifying admin user...\n')

  try {
    // List all users (requires service role key)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      console.error('\n💡 Note: You need SUPABASE_SERVICE_ROLE_KEY to list users.')
      console.error('   Get it from: Supabase Dashboard → Settings → API → Service Role Key')
      return
    }

    // Check if admin user exists
    const adminUser = users?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())

    if (adminUser) {
      console.log('✅ Admin user found!')
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   ID: ${adminUser.id}`)
      console.log(`   Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Created: ${adminUser.created_at}`)
      
      if (!adminUser.email_confirmed_at) {
        console.log('\n⚠️  Warning: Email is not confirmed!')
        console.log('   This might cause login issues.')
        console.log('   Fix: Go to Supabase Dashboard → Authentication → Users')
        console.log('        Find the user and confirm the email.')
      }
    } else {
      console.log('❌ Admin user not found!')
      console.log(`   Looking for: ${ADMIN_EMAIL}`)
      console.log('\n📝 To create the admin user:')
      console.log('   1. Go to Supabase Dashboard → Authentication → Users')
      console.log('   2. Click "Add User" or "Invite User"')
      console.log(`   3. Email: ${ADMIN_EMAIL}`)
      console.log(`   4. Password: ${ADMIN_PASSWORD}`)
      console.log('   5. ✅ Check "Auto Confirm User"')
      console.log('   6. Click "Create User"')
      
      // Try to create the user (requires service role key)
      if (supabaseServiceKey && supabaseServiceKey !== process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('\n🔄 Attempting to create admin user...')
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
        })
        
        if (createError) {
          console.error('❌ Failed to create user:', createError.message)
          console.error('   Please create the user manually via Supabase Dashboard.')
        } else {
          console.log('✅ Admin user created successfully!')
          console.log(`   Email: ${newUser.user?.email}`)
        }
      } else {
        console.log('\n⚠️  Cannot auto-create user: Service Role Key not found')
        console.log('   Please create the user manually via Supabase Dashboard.')
      }
    }

    console.log('\n📋 All users in the system:')
    users?.users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.email_confirmed_at ? 'Confirmed' : 'Not Confirmed'})`)
    })

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Make sure:')
    console.error('   1. EXPO_PUBLIC_SUPABASE_URL is correct')
    console.error('   2. SUPABASE_SERVICE_ROLE_KEY is set (for user management)')
    console.error('   3. You have the correct permissions')
  }
}

// Run the verification
verifyAdminUser()
  .then(() => {
    console.log('\n✅ Verification complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })


