// hooks/use-settings-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

const SETTINGS_KEY = 'settings'
const EMPLOYEES_KEY = 'settings-employees'

// ============================================
// SETTINGS
// ============================================
export function useSettings() {
  return useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: () =>
      api.get<{
        tenant: Record<string, unknown>
        settings: Record<string, unknown>
        resolvedModules: Record<string, boolean> | null
        template: Record<string, unknown> | null
      }>('/api/settings'),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/api/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ============================================
// EMPLOYEES
// ============================================
export function useEmployees() {
  return useQuery({
    queryKey: [EMPLOYEES_KEY],
    queryFn: () =>
      api.get<
        Array<{
          id: string
          name: string
          email: string
          role: string
          avatar: string | null
          permissions: string[]
          createdAt: string
          lastLoginAt: string | null
          _count: { services: number }
        }>
      >('/api/settings/employees'),
  })
}

export function useInviteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      email: string
      role: string
      password: string
      permissions?: string[] // ✅ Adicionado
    }) => api.post('/api/settings/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/api/settings/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/settings/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
    },
  })
}
