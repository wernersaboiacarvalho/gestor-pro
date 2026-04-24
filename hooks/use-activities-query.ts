// hooks/use-activities-query.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface Activity {
  id: string
  tenantId: string | null
  userId: string | null
  action: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

interface ActivitiesResponse {
  activities: Activity[]
  pagination: {
    total: number
    limit: number
    skip: number
    hasMore: boolean
  }
}

const ACTIVITIES_KEY = 'activities'

export function useActivities(params?: { limit?: number; skip?: number; action?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.skip) searchParams.set('skip', params.skip.toString())
  if (params?.action && params.action !== 'all') searchParams.set('action', params.action)

  const queryString = searchParams.toString()
  const url = `/api/activities${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: [ACTIVITIES_KEY, params],
    queryFn: () => api.get<ActivitiesResponse>(url),
  })
}
