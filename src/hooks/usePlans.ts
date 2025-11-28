import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan, type Plan, type CreatePlanData, type UpdatePlanData } from '@/lib/plans'

/**
 * Hook to fetch all plans
 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const result = await getPlans()
      if (result.error) {
        throw result.error
      }
      return { plans: result.plans }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch a single plan by ID
 */
export function usePlan(id: number) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: async () => {
      const result = await getPlanById(id)
      if (result.error) {
        throw result.error
      }
      return { plan: result.plan }
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePlanData) => {
      const result = await createPlan(data)
      if (result.error) {
        throw result.error
      }
      return result.plan
    },
    onSuccess: () => {
      // Invalidate plans list to refetch
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

/**
 * Hook to update a plan
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePlanData }) => {
      const result = await updatePlan(id, data)
      if (result.error) {
        throw result.error
      }
      return result.plan
    },
    onSuccess: (_, variables) => {
      // Invalidate both list and single plan queries
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['plans', variables.id] })
    },
  })
}

/**
 * Hook to delete a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deletePlan(id)
      if (result.error) {
        throw result.error
      }
      return result.success
    },
    onSuccess: () => {
      // Invalidate plans list to refetch
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}


