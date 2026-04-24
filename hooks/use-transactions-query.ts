// hooks/use-transactions-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  Transaction,
  TransactionStats,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '@/types/transaction'

const TRANSACTIONS_KEY = 'transactions'

export function useTransactions(params?: {
  type?: string
  isPaid?: boolean
  startDate?: string
  endDate?: string
  category?: string
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.type && params.type !== 'ALL') searchParams.set('type', params.type)
  if (params?.isPaid !== undefined) searchParams.set('isPaid', String(params.isPaid))
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)
  if (params?.category) searchParams.set('category', params.category)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const queryString = searchParams.toString()
  const url = `/api/transactions${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: [TRANSACTIONS_KEY, params],
    queryFn: () => api.get<{ items: Transaction[]; pagination: unknown }>(url),
  })
}

export function useTransactionsSummary(params?: { startDate?: string; endDate?: string }) {
  const searchParams = new URLSearchParams()
  searchParams.set('summary', 'true')
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)

  return useQuery({
    queryKey: [TRANSACTIONS_KEY, 'summary', params],
    queryFn: () => api.get<TransactionStats>(`/api/transactions?${searchParams.toString()}`),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransactionDTO) => api.post<Transaction>('/api/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDTO }) =>
      api.patch<Transaction>(`/api/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; id: string }>(`/api/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })
}

export function useToggleTransactionPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      api.patch<Transaction>(`/api/transactions/${id}`, {
        isPaid: !isPaid,
        paidAt: !isPaid ? new Date().toISOString() : null,
      }),
    onMutate: async ({ id, isPaid }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      // Snapshot do estado anterior
      const previousData = queryClient.getQueryData(['transactions'])

      // ✅ Otimistic update - atualiza a UI imediatamente
      queryClient.setQueryData(
        ['transactions'],
        (old: { items: Transaction[]; pagination: unknown } | undefined) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((t) =>
              t.id === id
                ? { ...t, isPaid: !isPaid, paidAt: !isPaid ? new Date().toISOString() : null }
                : t
            ),
          }
        }
      )

      // Retornar o snapshot para rollback em caso de erro
      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Rollback em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(['transactions'], context.previousData)
      }
    },
  })
}
