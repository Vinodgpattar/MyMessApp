import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPayments,
  getPaymentById,
  getPaymentStats,
  createPayment,
  updatePayment,
  deletePayment,
  type Payment,
  type PaymentStats,
  type CreatePaymentData,
  type UpdatePaymentData,
  type GetPaymentsParams,
} from '@/lib/payments'

/**
 * Hook to get payments with filters
 */
export function usePayments(params: GetPaymentsParams = {}) {
  return useQuery<{ payments: Payment[]; pagination: any }>({
    queryKey: ['payments', params],
    queryFn: async () => {
      const result = await getPayments(params)
      if (result.error) throw result.error
      return {
        payments: result.payments || [],
        pagination: result.pagination,
      }
    },
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to get a single payment
 */
export function usePayment(id: number) {
  return useQuery<Payment>({
    queryKey: ['payment', id],
    queryFn: async () => {
      const result = await getPaymentById(id)
      if (result.error) throw result.error
      if (!result.payment) throw new Error('Payment not found')
      return result.payment
    },
    enabled: !!id && id > 0,
    staleTime: 30000,
  })
}

/**
 * Hook to get payment statistics
 */
export function usePaymentStats(dateRange?: { start: string; end: string }) {
  return useQuery<PaymentStats>({
    queryKey: ['payment-stats', dateRange],
    queryFn: async () => {
      const result = await getPaymentStats(dateRange)
      if (result.error) throw result.error
      if (!result.stats) throw new Error('Failed to fetch payment stats')
      return result.stats
    },
    staleTime: 30000,
  })
}

/**
 * Hook to create a payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const result = await createPayment(data)
      if (!result.success && result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
  })
}

/**
 * Hook to update a payment
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePaymentData }) => {
      const result = await updatePayment(id, data)
      if (!result.success && result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: (result, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
  })
}

/**
 * Hook to delete a payment
 */
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deletePayment(id)
      if (!result.success && result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
  })
}


