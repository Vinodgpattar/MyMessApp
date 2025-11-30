import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getStudentByUserId } from '@/lib/students'
import { useAuth } from '@/context/AuthContext'
import { logger } from '@/lib/logger'

export function useUnreadNotifications() {
  const { user } = useAuth()

  const { data: studentData } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const result = await getStudentByUserId(user.id)
      if (result.error) throw result.error
      return result.student
    },
    enabled: !!user?.id,
  })

  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ['unread-notifications', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return 0

      try {
        const { count, error } = await supabase
          .from('AdminNotificationRecipient')
          .select('*', { count: 'exact', head: true })
          .eq('studentId', studentData.id)
          .eq('read', false)

        if (error) {
          logger.error('Error fetching unread notifications count', error as Error)
          return 0
        }

        return count || 0
      } catch (error) {
        logger.error('Unexpected error fetching unread count', error as Error)
        return 0
      }
    },
    enabled: !!studentData?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return { unreadCount, isLoading }
}

