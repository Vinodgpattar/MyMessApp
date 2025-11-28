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
 */
export async function getProfileByUserId(
  userId: string
): Promise<{ profile: Profile | null; error: null } | { profile: null; error: Error }> {
  try {
    logger.debug('getProfileByUserId: Searching for user_id', { userId })
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, email, createdAt, updatedAt')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error('getProfileByUserId: Error fetching profile', error as Error)
      return { profile: null, error: new Error(error.message) }
    }

    if (!data) {
      logger.debug('getProfileByUserId: No profile found')
      return { profile: null, error: null }
    }

    logger.debug('getProfileByUserId: Profile found', {
      user_id: data.user_id,
      role: data.role,
      email: data.email,
    })

    return { 
      profile: {
        id: data.id,
        user_id: data.user_id,
        role: data.role as 'student' | 'admin',
        email: data.email,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
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



