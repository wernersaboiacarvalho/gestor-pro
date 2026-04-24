// hooks/use-customers-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '@/types/customer'
import type { PaginatedResponse } from '@/types/pagination'

const CUSTOMERS_KEY = 'customers'

export function useCustomers() {
  return useQuery({
    queryKey: [CUSTOMERS_KEY],
    queryFn: () => api.get<PaginatedResponse<Customer>>('/api/customers'),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, id],
    queryFn: () => api.get<Customer>(`/api/customers/${id}`),
    enabled: !!id, // Só busca se tiver ID
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCustomerDTO) => api.post<Customer>('/api/customers', data),
    onSuccess: (newCustomer) => {
      // Atualiza o cache otimisticamente
      queryClient.setQueryData<PaginatedResponse<Customer>>([CUSTOMERS_KEY], (old) => {
        if (!old) return old
        return {
          ...old,
          items: [newCustomer, ...old.items],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        }
      })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDTO }) =>
      api.patch<Customer>(`/api/customers/${id}`, data),
    onSuccess: (updatedCustomer) => {
      // Atualiza o cache
      queryClient.setQueryData<PaginatedResponse<Customer>>([CUSTOMERS_KEY], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)),
        }
      })
      // Atualiza o cache individual
      queryClient.setQueryData([CUSTOMERS_KEY, updatedCustomer.id], updatedCustomer)
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; customerId: string }>(`/api/customers/${id}`),
    onSuccess: (_, deletedId) => {
      // Remove do cache
      queryClient.setQueryData<PaginatedResponse<Customer>>([CUSTOMERS_KEY], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.filter((c) => c.id !== deletedId),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1,
          },
        }
      })
      // Invalida o cache individual
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY, deletedId] })
    },
  })
}
