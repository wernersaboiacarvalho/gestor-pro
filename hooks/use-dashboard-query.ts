// hooks/use-dashboard-query.ts
'use client'

import { useQuery } from '@tanstack/react-query'

interface DashboardStats {
  onboarding: {
    title: string
    show: boolean
    completed: number
    total: number
    progress: number
    nextStep: {
      id: string
      title: string
      description: string
      href: string
      cta: string
    } | null
    quickActions: Array<{
      id: string
      label: string
      description: string
      endpoint: string
      method: 'POST'
    }>
    steps: Array<{
      id: string
      title: string
      description: string
      href: string
      cta: string
      completed: boolean
      optional?: boolean
    }>
  }
  kpis: {
    totalCustomers: number
    totalVehicles: number
    totalProducts: number
    activeServices: number
    revenueThisMonth: number
    revenueLastMonth: number
    revenueGrowth: number
    completedThisMonth: number
    lowStockProducts: number
  }
  charts: {
    servicesByStatus: Array<{ name: string; value: number; color: string }>
    revenueByMonth: Array<{ month: string; revenue: number; count: number }>
  }
  operationalAlerts: Array<{
    id: string
    title: string
    description: string
    severity: 'low' | 'medium' | 'high'
    count: number
    href: string
    filter: string
    items: Array<{
      id: string
      href: string
      customerName: string
      vehicleLabel: string | null
      description: string
      status: string
      totalValue: number
      updatedAt: string
    }>
  }>
  recentServices: Array<{
    id: string
    description: string
    status: string
    type: string
    totalValue: number
    createdAt: string
    customer: { name: string }
    vehicle: { plate: string; brand: string; model: string } | null
  }>
  recentActivities: Array<{
    id: string
    action: string
    description: string
    createdAt: string
    user: { name: string } | null
  }>
}

const DASHBOARD_KEY = 'dashboard-stats'

export function useDashboardStats() {
  return useQuery({
    queryKey: [DASHBOARD_KEY],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()

      // ✅ Garantir que sempre retorna um objeto, nunca undefined
      return result.data || result
    },
    refetchInterval: 30 * 1000, // Atualiza a cada 30 segundos
    staleTime: 10 * 1000, // 10 segundos antes de considerar "stale"
  })
}
