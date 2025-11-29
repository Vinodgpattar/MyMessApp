import { supabase } from './supabase'
import { logger } from './logger'

export interface Profile {
  id: string
  user_id: string
  role: 'student' | 'admin'
  email: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Get user profile by user_id
 * This is the ONLY way to get role - no more user_metadata
 * 
 * CRITICAL: Detects duplicate profiles and blocks login for security
 */
export async function getProfileByUserId(
  userId: string
): Promise<{ profile: Profile | null; error: null } | { profile: null; error: Error }> {
  try {
    logger.debug('getProfileByUserId: Searching for user_id', { userId })
    
    // Use .select() instead of .maybeSingle() to detect duplicates
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, email, createdAt, updatedAt')
      .eq('user_id', userId)

    if (error) {
      logger.error('getProfileByUserId: Error fetching profile', error as Error)
      return { profile: null, error: new Error(error.message) }
    }

    if (!data || data.length === 0) {
      logger.debug('getProfileByUserId: No profile found')
      return { profile: null, error: null }
    }

    // SECURITY: Detect duplicate profiles - BLOCK login if found
    if (data.length > 1) {
      logger.error('getProfileByUserId: DUPLICATE PROFILES DETECTED', {
        user_id: userId,
        count: data.length,
        roles: data.map(p => p.role),
      })
      return {
        profile: null,
        error: new Error(
          'Your account has conflicting roles. Please contact administrator to resolve this issue.'
        ),
      }
    }

    const profileData = data[0]

    logger.debug('getProfileByUserId: Profile found', {
      user_id: profileData.user_id,
      role: profileData.role,
      email: profileData.email,
    })

    return { 
      profile: {
        id: profileData.id,
        user_id: profileData.user_id,
        role: profileData.role as 'student' | 'admin',
        email: profileData.email,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt,
      }, 
      error: null 
    }
  } catch (error) {
    logger.error('Unexpected error fetching profile', error as Error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error('Failed to fetch profile'),
    }
  }
}



