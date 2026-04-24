// hooks/use-vehicles-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Vehicle, CreateVehicleDTO, UpdateVehicleDTO } from '@/types/vehicle'
import type { PaginatedResponse } from '@/types/pagination'

const VEHICLES_KEY = 'vehicles'

export function useVehicles() {
  return useQuery({
    queryKey: [VEHICLES_KEY],
    queryFn: () => api.get<PaginatedResponse<Vehicle>>('/api/vehicles'),
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: [VEHICLES_KEY, id],
    queryFn: () => api.get<Vehicle>(`/api/vehicles/${id}`),
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVehicleDTO) => api.post<Vehicle>('/api/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleDTO }) =>
      api.patch<Vehicle>(`/api/vehicles/${id}`, data),
    onSuccess: (updatedVehicle) => {
      queryClient.setQueryData([VEHICLES_KEY, updatedVehicle.id], updatedVehicle)
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; vehicleId: string }>(`/api/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] })
    },
  })
}
