// hooks/use-mechanics-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Mechanic, CreateMechanicDTO, UpdateMechanicDTO } from '@/types/mechanic'
import type { PaginatedResponse } from '@/types/pagination'

const MECHANICS_KEY = 'mechanics'

export function useMechanics(params?: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const queryString = searchParams.toString()
  const url = `/api/mechanics${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: [MECHANICS_KEY, params],
    queryFn: () => api.get<PaginatedResponse<Mechanic>>(url),
  })
}

export function useMechanic(id: string) {
  return useQuery({
    queryKey: [MECHANICS_KEY, id],
    queryFn: () => api.get<Mechanic>(`/api/mechanics/${id}`),
    enabled: !!id,
  })
}

export function useCreateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMechanicDTO) => api.post<Mechanic>('/api/mechanics', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MECHANICS_KEY] })
    },
  })
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMechanicDTO }) =>
      api.patch<Mechanic>(`/api/mechanics/${id}`, data),
    onSuccess: (updatedMechanic) => {
      queryClient.setQueryData([MECHANICS_KEY, updatedMechanic.id], updatedMechanic)
      queryClient.invalidateQueries({ queryKey: [MECHANICS_KEY] })
    },
  })
}

export function useDeleteMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; mechanicId: string }>(`/api/mechanics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MECHANICS_KEY] })
    },
  })
}
