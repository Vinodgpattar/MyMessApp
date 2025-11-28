import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStudents,
  getStudentById,
  getStudentStats,
  createStudent,
  updateStudent,
  deleteStudent,
  sendCredentialsEmail,
  extendPlan,
  renewPlan,
  type Student,
  type CreateStudentData,
  type UpdateStudentData,
  type StudentStats,
  type ExtendPlanData,
  type RenewPlanData,
} from '@/lib/students'

/**
 * Hook to fetch students with filters and pagination
 */
export function useStudents(
  params: {
    page?: number
    limit?: number
    search?: string
    active?: boolean
    planId?: number
  } = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const result = await getStudents(params)
      if (result.error) {
        throw result.error
      }
      return result
    },
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch student statistics
 */
export function useStudentStats() {
  return useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const result = await getStudentStats()
      if (result.error) {
        throw result.error
      }
      return { stats: result.stats }
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch a single student by ID
 */
export function useStudent(id: number) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const result = await getStudentById(id)
      if (result.error) {
        throw result.error
      }
      return { student: result.student }
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      const result = await createStudent(data)
      if (result.error) {
        throw result.error
      }
      return result.student
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student-stats'] })
    },
  })
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateStudentData }) => {
      const result = await updateStudent(id, data)
      if (result.error) {
        throw result.error
      }
      return result.student
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['student-stats'] })
    },
  })
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteStudent(id)
      if (result.error) {
        throw result.error
      }
      return result.success
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student-stats'] })
    },
  })
}

/**
 * Hook to send credentials email
 */
export function useSendCredentialsEmail() {
  return useMutation({
    mutationFn: async ({ studentId, password }: { studentId: number; password?: string }) => {
      const result = await sendCredentialsEmail(studentId, password)
      if (result.error) {
        throw result.error
      }
      return result.success
    },
  })
}

/**
 * Hook to extend student plan
 */
export function useExtendPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ExtendPlanData }) => {
      const result = await extendPlan(id, data)
      if (result.error) {
        throw result.error
      }
      return result.student
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['student-stats'] })
    },
  })
}

/**
 * Hook to renew student plan
 */
export function useRenewPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RenewPlanData }) => {
      const result = await renewPlan(id, data)
      if (result.error) {
        throw result.error
      }
      return result.student
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['student-stats'] })
    },
  })
}

