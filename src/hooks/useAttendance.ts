import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAttendanceStats,
  getAttendanceView,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
  deleteAttendance,
  type MarkAttendanceData,
  type AttendanceView,
  type AttendanceStats,
} from '@/lib/attendance'

/**
 * Hook to get attendance statistics for a date
 */
export function useAttendanceStats(date: string) {
  return useQuery<AttendanceStats>({
    queryKey: ['attendance-stats', date],
    queryFn: () => getAttendanceStats(date),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to get attendance view for a date and meal
 */
export function useAttendanceView(
  date: string,
  meal?: 'breakfast' | 'lunch' | 'dinner'
) {
  return useQuery<AttendanceView>({
    queryKey: ['attendance-view', date, meal],
    queryFn: () => getAttendanceView(date, meal),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to mark attendance
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MarkAttendanceData) => {
      const result = await markAttendance(data)
      if (!result.success && result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['attendance-stats', variables.date] })
        queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date] })
        // Also invalidate any meal-specific queries
        if (variables.breakfast !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date, 'breakfast'] })
        }
        if (variables.lunch !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date, 'lunch'] })
        }
        if (variables.dinner !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date, 'dinner'] })
        }
      }
    },
  })
}

/**
 * Hook to mark bulk attendance
 */
export function useMarkBulkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentIds,
      date,
      meal,
    }: {
      studentIds: number[]
      date: string
      meal: 'breakfast' | 'lunch' | 'dinner'
    }) => {
      const result = await markBulkAttendance(studentIds, date, meal)
      if (!result.success && result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['attendance-stats', variables.date] })
        queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date, variables.meal] })
        queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date] })
      }
    },
  })
}

/**
 * Hook to update attendance
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: { breakfast?: boolean; lunch?: boolean; dinner?: boolean }
    }) => {
      const result = await updateAttendance(id, data)
      if (!result.success && result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate all attendance queries
        queryClient.invalidateQueries({ queryKey: ['attendance'] })
        queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
        queryClient.invalidateQueries({ queryKey: ['attendance-view'] })
      }
    },
  })
}

/**
 * Hook to delete attendance
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, date }: { id: number; date?: string }) => {
      const result = await deleteAttendance(id)
      if (!result.success && result.error) {
        throw result.error
      }
      return { ...result, date }
    },
    onSuccess: (result, variables) => {
      // Invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-view'] })
      
      // If date is provided, also invalidate specific date queries
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ['attendance-stats', variables.date] })
        queryClient.invalidateQueries({ queryKey: ['attendance-view', variables.date] })
      }
    },
    onError: (error) => {
      // Error is handled by the mutation
    },
  })
}

