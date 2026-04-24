// hooks/use-third-party-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  ThirdPartyProvider,
  CreateThirdPartyProviderDTO,
  UpdateThirdPartyProviderDTO,
} from '@/types/third-party-provider'

const THIRD_PARTY_KEY = 'third-party-providers'

export function useThirdPartyProviders() {
  return useQuery({
    queryKey: [THIRD_PARTY_KEY],
    queryFn: () =>
      api.get<{ providers: ThirdPartyProvider[]; count: number }>('/api/third-party-providers'),
  })
}

export function useThirdPartyProvider(id: string) {
  return useQuery({
    queryKey: [THIRD_PARTY_KEY, id],
    queryFn: () => api.get<{ provider: ThirdPartyProvider }>(`/api/third-party-providers/${id}`),
    enabled: !!id,
  })
}

export function useCreateThirdPartyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateThirdPartyProviderDTO) =>
      api.post<{ provider: ThirdPartyProvider }>('/api/third-party-providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THIRD_PARTY_KEY] })
    },
  })
}

export function useUpdateThirdPartyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateThirdPartyProviderDTO }) =>
      api.patch<{ provider: ThirdPartyProvider }>(`/api/third-party-providers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THIRD_PARTY_KEY] })
    },
  })
}

export function useDeleteThirdPartyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; providerId: string }>(`/api/third-party-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THIRD_PARTY_KEY] })
    },
  })
}
