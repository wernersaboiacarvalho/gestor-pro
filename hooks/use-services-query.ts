// hooks/use-services-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Service, ServiceFormSubmitData } from '@/types/service.types'

const SERVICES_KEY = 'services'

export function useServices() {
  return useQuery({
    queryKey: [SERVICES_KEY],
    queryFn: () => api.get<Service[]>('/api/services'),
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: [SERVICES_KEY, id],
    queryFn: () => api.get<Service>(`/api/services/${id}`),
    enabled: !!id,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceFormSubmitData) => api.post<Service>('/api/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormSubmitData }) =>
      api.patch<Service>(`/api/services/${id}`, data),
    onSuccess: (updatedService) => {
      queryClient.setQueryData([SERVICES_KEY, updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; serviceId: string }>(`/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
    },
  })
}

// Hook para dados auxiliares (clientes, veículos, mecânicos para o form)
export function useServiceFormData() {
  const customers = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => api.get<Array<{ id: string; name: string; phone: string }>>('/api/customers'),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })

  const vehicles = useQuery({
    queryKey: ['vehicles', 'list'],
    queryFn: () =>
      api.get<
        Array<{
          id: string
          plate: string
          brand: string
          model: string
          customerId: string
          year: number
        }>
      >('/api/vehicles'),
    staleTime: 5 * 60 * 1000,
  })

  const mechanics = useQuery({
    queryKey: ['mechanics', 'active'],
    queryFn: () =>
      api.get<
        Array<{
          id: string
          name: string
          specialty: string | null
          commissionRate: number | null
          status: string
        }>
      >('/api/mechanics?status=ACTIVE'),
    staleTime: 5 * 60 * 1000,
  })

  const thirdPartyProviders = useQuery({
    queryKey: ['third-party-providers', 'list'],
    queryFn: () =>
      api.get<
        Array<{
          id: string
          name: string
          phone?: string | null
          email?: string | null
        }>
      >('/api/third-party-providers'),
    staleTime: 5 * 60 * 1000,
  })

  return {
    customers,
    vehicles,
    mechanics,
    thirdPartyProviders,
    isLoading:
      customers.isLoading ||
      vehicles.isLoading ||
      mechanics.isLoading ||
      thirdPartyProviders.isLoading,
  }
}
