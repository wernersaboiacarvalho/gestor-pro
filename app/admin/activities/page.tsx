// app/admin/activities/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, Clock, Filter, Search, User, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityLog {
  id: string
  tenantId: string | null
  userId: string | null
  action: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
  tenant: {
    id: string
    name: string
    slug: string
  } | null
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

interface ActivitiesResponse {
  success: boolean
  data: {
    activities: ActivityLog[]
    pagination: {
      total: number
      limit: number
      skip: number
      hasMore: boolean
    }
  }
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterTenant, setFilterTenant] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    skip: 0,
    hasMore: false,
  })
  const [tenants, setTenants] = useState<{ id: string; name: string; slug: string }[]>([])

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        skip: pagination.skip.toString(),
      })

      if (filterAction !== 'all') {
        params.append('action', filterAction)
      }
      if (filterTenant !== 'all') {
        params.append('tenantId', filterTenant)
      }

      const response = await fetch(`/api/admin/activities?${params}`)
      const data: ActivitiesResponse = await response.json()

      if (data.success) {
        setActivities(data.data.activities)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.skip, filterAction, filterTenant])

  const fetchTenants = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      const data = await response.json()
      if (Array.isArray(data)) {
        setTenants(data.map((tenant) => ({ id: tenant.id, name: tenant.name, slug: tenant.slug })))
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      CUSTOMER_CREATED: 'default',
      CUSTOMER_UPDATED: 'secondary',
      CUSTOMER_DELETED: 'destructive',
      SERVICE_CREATED: 'default',
      SERVICE_UPDATED: 'secondary',
      SERVICE_DELETED: 'destructive',
      VEHICLE_CREATED: 'default',
      VEHICLE_UPDATED: 'secondary',
      VEHICLE_DELETED: 'destructive',
      MECHANIC_CREATED: 'default',
      MECHANIC_UPDATED: 'secondary',
      MECHANIC_DELETED: 'destructive',
    }
    return colors[action] || 'outline'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('CREATED')) return '➕'
    if (action.includes('UPDATED')) return '✏️'
    if (action.includes('DELETED')) return '🗑️'
    return '📝'
  }

  const filteredActivities = activities.filter((activity) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      activity.description.toLowerCase().includes(search) ||
      activity.action.toLowerCase().includes(search) ||
      activity.user?.name.toLowerCase().includes(search) ||
      activity.tenant?.name.toLowerCase().includes(search)
    )
  })

  const uniqueActions = Array.from(new Set(activities.map((a) => a.action)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Atividades do Sistema</h1>
        <p className="text-muted-foreground">
          Log global de todas as atividades de todos os tenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter((t) => t.slug).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Únicas</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants com Atividade</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(activities.map((a) => a.tenantId).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre as atividades por tenant, tipo ou busque por descrição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição, ação, usuário ou tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterTenant} onValueChange={setFilterTenant}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Atividades Global</CardTitle>
          <CardDescription>{filteredActivities.length} atividades encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="w-[150px]">Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <span className="text-lg">{getActionIcon(activity.action)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(activity.action)}>
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="truncate text-sm">{activity.description}</p>
                        {activity.metadata && (
                          <pre className="mt-1 text-xs text-muted-foreground">
                            {JSON.stringify(activity.metadata, null, 2).slice(0, 80)}
                            {JSON.stringify(activity.metadata, null, 2).length > 80 && '...'}
                          </pre>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.tenant ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{activity.tenant.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.tenant.slug}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.user ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{activity.user.name}</p>
                              <p className="text-xs text-muted-foreground">{activity.user.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {filteredActivities.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {pagination.skip + 1} -{' '}
                {Math.min(pagination.skip + pagination.limit, pagination.total)} de{' '}
                {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, skip: Math.max(0, p.skip - p.limit) }))
                  }
                  disabled={pagination.skip === 0}
                  className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, skip: p.skip + p.limit }))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
