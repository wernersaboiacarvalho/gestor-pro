// hooks/use-services-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  Service,
  ServiceActivity,
  ServiceAttachment,
  ServiceChecklistItem,
  ServiceFormSubmitData,
} from '@/types/service.types'
import type { PaginatedResponse } from '@/types/pagination'

const SERVICES_KEY = 'services'

type ServiceFormCustomer = { id: string; name: string; phone: string }
type ServiceFormVehicle = {
  id: string
  plate: string
  brand: string
  model: string
  customerId: string
  year: number
}
type ServiceFormMechanic = {
  id: string
  name: string
  specialty: string | null
  commissionRate: number | null
  status: string
}
type ServiceFormThirdPartyProvider = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

function getItems<T>(response: PaginatedResponse<T>) {
  return Array.isArray(response.items) ? response.items : []
}

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

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Service['status'] }) =>
      api.patch<Service>(`/api/services/${id}/status`, { status }),
    onSuccess: (updatedService) => {
      queryClient.setQueryData([SERVICES_KEY, updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
      queryClient.invalidateQueries({ queryKey: ['activities', 'service', updatedService.id] })
    },
  })
}

export function useApproveService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.post<Service>(`/api/services/${id}/approve`, {}),
    onSuccess: (updatedService) => {
      queryClient.setQueryData([SERVICES_KEY, updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
      queryClient.invalidateQueries({ queryKey: ['activities', 'service', updatedService.id] })
    },
  })
}

export function useServiceActivities(serviceId: string | null | undefined) {
  return useQuery({
    queryKey: ['activities', 'service', serviceId],
    queryFn: async () => {
      const response = await api.get<{
        activities: ServiceActivity[]
        pagination: {
          total: number
          limit: number
          skip: number
          hasMore: boolean
        }
      }>(`/api/activities?serviceId=${serviceId}&limit=100`)

      return Array.isArray(response.activities) ? response.activities : []
    },
    enabled: Boolean(serviceId),
  })
}

export function useCreateServiceChecklistItem(serviceId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title }: { title: string }) => {
      if (!serviceId) throw new Error('Documento sem identificador.')
      return api.post<ServiceChecklistItem>(`/api/services/${serviceId}/checklist`, { title })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY, serviceId] })
      queryClient.invalidateQueries({ queryKey: ['activities', 'service', serviceId] })
    },
  })
}

export function useUpdateServiceChecklistItem(serviceId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      itemId,
      title,
      completed,
    }: {
      itemId: string
      title?: string
      completed?: boolean
    }) => {
      if (!serviceId) throw new Error('Documento sem identificador.')
      return api.patch<ServiceChecklistItem>(`/api/services/${serviceId}/checklist/${itemId}`, {
        title,
        completed,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY, serviceId] })
      queryClient.invalidateQueries({ queryKey: ['activities', 'service', serviceId] })
    },
  })
}

export function useDeleteServiceChecklistItem(serviceId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => {
      if (!serviceId) throw new Error('Documento sem identificador.')
      return api.delete<{ success: boolean; itemId: string }>(
        `/api/services/${serviceId}/checklist/${itemId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY, serviceId] })
      queryClient.invalidateQueries({ queryKey: ['activities', 'service', serviceId] })
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
export async function uploadServiceAttachment(serviceId: string, file: File, caption?: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (caption) formData.append('caption', caption)

  const response = await fetch(`/api/services/${serviceId}/attachments`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Erro ao enviar foto')
  }

  return data.data as ServiceAttachment
}

export function useServiceAttachments(serviceId: string | null | undefined) {
  return useQuery({
    queryKey: [SERVICES_KEY, serviceId, 'attachments'],
    queryFn: () => api.get<ServiceAttachment[]>(`/api/services/${serviceId}/attachments`),
    enabled: Boolean(serviceId),
  })
}

export function useUploadServiceAttachment(serviceId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) => {
      if (!serviceId) throw new Error('Salve o documento antes de enviar fotos.')
      return uploadServiceAttachment(serviceId, file, caption)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY, serviceId, 'attachments'] })
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
    },
  })
}

export function useDeleteServiceAttachment(serviceId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attachmentId: string) => {
      if (!serviceId) throw new Error('Documento sem identificador.')
      return api.delete<{ success: boolean; attachmentId: string }>(
        `/api/services/${serviceId}/attachments/${attachmentId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY, serviceId, 'attachments'] })
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] })
    },
  })
}

export function useServiceFormData() {
  const customers = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<ServiceFormCustomer>>(
        '/api/customers?limit=100'
      )
      return getItems(response)
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })

  const vehicles = useQuery({
    queryKey: ['vehicles', 'list'],
    queryFn: async () => {
      const response =
        await api.get<PaginatedResponse<ServiceFormVehicle>>('/api/vehicles?limit=100')
      return getItems(response)
    },
    staleTime: 5 * 60 * 1000,
  })

  const mechanics = useQuery({
    queryKey: ['mechanics', 'active'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<ServiceFormMechanic>>(
        '/api/mechanics?status=ACTIVE&limit=100'
      )
      return getItems(response)
    },
    staleTime: 5 * 60 * 1000,
  })

  const thirdPartyProviders = useQuery({
    queryKey: ['third-party-providers', 'list'],
    queryFn: async () => {
      const response = await api.get<{
        providers: ServiceFormThirdPartyProvider[]
        count: number
      }>('/api/third-party-providers')

      return Array.isArray(response.providers) ? response.providers : []
    },
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
